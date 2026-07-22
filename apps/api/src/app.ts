import path from "node:path";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import pinoHttp from "pino-http";
import forecastRouter from "./routes/forecast";
import healthRouter from "./routes/health";
import locationRouter from "./routes/location";
import newsRouter from "./routes/news";
import { logger } from "./lib/logger";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicApiRouter = express.Router();
publicApiRouter.use(healthRouter);
publicApiRouter.use(locationRouter);
publicApiRouter.use(forecastRouter);
publicApiRouter.use(newsRouter);
publicApiRouter.get("/auth/me", (_req, res, next) => {
  if (process.env["SESSION_SECRET"] && process.env["DATABASE_URL"]) {
    next();
    return;
  }

  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.json({ userId: null, username: null });
});
publicApiRouter.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: process.env["VAPID_PUBLIC_KEY"] || "" });
});

app.use("/api", publicApiRouter);

const databaseRoutePrefixes = ["/auth", "/saved-articles", "/push"];
let databaseApiRouterPromise: Promise<express.Router> | undefined;

function matchesDatabaseRoute(pathname: string): boolean {
  return databaseRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function getDatabaseApiRouter(): Promise<express.Router> {
  databaseApiRouterPromise ??= buildDatabaseApiRouter();
  return databaseApiRouterPromise;
}

async function buildDatabaseApiRouter(): Promise<express.Router> {
  const [
    { default: cors },
    { default: session },
    { default: connectPg },
    { config },
    { pool },
    { default: authRouter },
    { default: pushRouter },
    { default: savedArticlesRouter },
  ] = await Promise.all([
    import("cors"),
    import("express-session"),
    import("connect-pg-simple"),
    import("./config"),
    import("@workspace/shared-db"),
    import("./routes/auth"),
    import("./routes/push"),
    import("./routes/saved-articles"),
  ]);

  const router = express.Router();
  const PgStore = connectPg(session);

  router.use(cors(config.corsOptions));
  router.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: !config.isProduction }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.isProduction,
        httpOnly: true,
        sameSite: config.isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );
  router.use(authRouter);
  router.use(pushRouter);
  router.use(savedArticlesRouter);

  return router;
}

app.use("/api", async (req, res, next) => {
  if (!matchesDatabaseRoute(req.path)) {
    next();
    return;
  }

  try {
    const databaseApiRouter = await getDatabaseApiRouter();
    databaseApiRouter(req, res, next);
  } catch (err) {
    next(err);
  }
});

const staticAssetsDir = process.env["STATIC_ASSETS_DIR"];

if (staticAssetsDir) {
  app.use(express.static(staticAssetsDir, { index: false }));

  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || path.extname(req.path)) {
      next();
      return;
    }

    res.sendFile(path.join(staticAssetsDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const asRecord = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {};
  const status = typeof asRecord.status === "number" ? asRecord.status
    : typeof asRecord.statusCode === "number" ? asRecord.statusCode
    : 500;
  const message = status >= 500 && process.env["NODE_ENV"] === "production"
    ? "Internal Server Error"
    : err instanceof Error ? err.message : "Internal Server Error";
  logger.error({ err }, "Unhandled error");
  if (!res.headersSent) res.status(status).json({ message });
});

export default app;
