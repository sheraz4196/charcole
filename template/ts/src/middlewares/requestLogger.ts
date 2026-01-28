import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";

/**
 * Request logging middleware
 * Logs all HTTP requests with method, path, status, duration, and IP
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;

    const logData = {
      method: req.method,
      path: req.path,
      statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
      ...(isError && { error: true }),
    };

    if (isError) {
      logger.warn(`${req.method} ${req.path}`, logData);
    } else {
      logger.debug(`${req.method} ${req.path}`, logData);
    }
  });

  next();
};
