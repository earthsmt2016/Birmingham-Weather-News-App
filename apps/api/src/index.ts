import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? (process.env["NODE_ENV"] === "production" ? "3000" : "5001");
const port = Number(rawPort);
const host = process.env["HOST"] ?? (process.env["NODE_ENV"] === "production" ? "0.0.0.0" : "127.0.0.1");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, host, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  void maybeStartScheduler();
  logger.info({ host, port }, "Server listening on http://%s:%d", host, port);
});

async function maybeStartScheduler(): Promise<void> {
  const defaultSchedulerEnabled = process.env["NODE_ENV"] === "production" ? "false" : "true";
  const schedulerEnabled = process.env["ENABLE_NOTIFICATION_SCHEDULER"] ?? defaultSchedulerEnabled;

  if (schedulerEnabled !== "true") {
    logger.info("Notification scheduler disabled");
    return;
  }

  if (!process.env["DATABASE_URL"]) {
    logger.warn("Notification scheduler skipped because DATABASE_URL is not configured");
    return;
  }

  try {
    const { startScheduler } = await import("./notifications");
    startScheduler();
  } catch (err) {
    logger.error({ err }, "Failed to start notification scheduler");
  }
}
