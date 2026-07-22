import type { CorsOptions } from "cors";

const isProduction = process.env.NODE_ENV === "production";

function getRequiredProductionEnv(name: string): string {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`${name} must be set in production.`);
  }
  return value ?? "";
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const sessionSecret = getRequiredProductionEnv("SESSION_SECRET") || "dev-fallback-secret-change-me";
const allowedOrigins = parseCsv(process.env.CORS_ORIGIN);

if (isProduction && allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGIN must be set in production.");
}

const corsOptions: CorsOptions = {
  credentials: true,
  origin: isProduction
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not allowed by CORS."));
      }
    : true,
};

export const config = {
  isProduction,
  corsOptions,
  sessionSecret,
};
