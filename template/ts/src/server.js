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

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.warn(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  process.exit(1);
});

// Uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", { error: error.message });
  process.exit(1);
});
