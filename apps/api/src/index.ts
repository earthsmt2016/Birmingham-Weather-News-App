import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./notifications";

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

  startScheduler();
  logger.info({ host, port }, "Server listening on http://%s:%d", host, port);
});
