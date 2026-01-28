import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🔥 Server running in ${env.NODE_ENV} mode`, {
    url: `http://localhost:${PORT}`,
    port: PORT,
  });
});

const gracefulShutdown = (signal: string): void => {
  logger.warn(`${signal} signal received: closing HTTP server`);

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled Rejection at:", { promise, reason });
    process.exit(1);
  },
);

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
