import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    logger.info(`${req.method} ${req.path}`, {
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};
