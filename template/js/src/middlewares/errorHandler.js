import { ZodError } from "zod";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import {
  AppError,
  ValidationError,
  InternalServerError,
} from "../utils/AppError.js";
import { env } from "../config/env.js";

/**
 * Normalize different error types to AppError
 */
const normalizeError = (err) => {
  // Already an AppError
  if (err instanceof AppError) {
    return err;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
    return new ValidationError(ERROR_MESSAGES.VALIDATION_ERROR, errors);
  }

  // Syntax errors (programmer error)
  if (err instanceof SyntaxError) {
    return new InternalServerError("Syntax error in application code", err, {
      type: "SyntaxError",
    });
  }

  // Type errors (programmer error)
  if (err instanceof TypeError) {
    return new InternalServerError("Type error in application", err, {
      type: "TypeError",
    });
  }

  // Reference errors (programmer error)
  if (err instanceof ReferenceError) {
    return new InternalServerError("Reference error in application", err, {
      type: "ReferenceError",
    });
  }

  // Range errors
  if (err instanceof RangeError) {
    return new InternalServerError("Range error in application", err, {
      type: "RangeError",
    });
  }

  // Generic error (unknown)
  return new InternalServerError(
    err.message || ERROR_MESSAGES.SERVER_ERROR,
    err,
    { type: "UnknownError" },
  );
};

/**
 * Log error based on type (operational vs programmer)
 */
const logError = (appError, req) => {
  const errorDetails = {
    type: appError.isOperational ? "OPERATIONAL" : "PROGRAMMER",
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };

  // Operational errors: normal logging
  if (appError.isOperational) {
    logger.warn(`Operational Error: ${appError.code}`, errorDetails);
  } else {
    // Programmer errors: detailed logging with stack
    logger.error(
      `Programmer Error: ${appError.code}`,
      errorDetails,
      appError.stack,
    );
  }

  // Log validation errors separately
  if (appError instanceof ValidationError && appError.errors) {
    logger.debug("Validation errors", { errors: appError.errors });
  }

  // Log cause if present
  if (appError.cause) {
    logger.debug("Error cause", { cause: appError.cause.message });
  }
};

/**
 * Send error response
 */
const sendErrorResponse = (res, appError) => {
  const statusCode = appError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // In production, hide internal details for programmer errors
  if (!appError.isOperational && env.isProduction) {
    return res.status(statusCode).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
    });
  }

  // Return detailed error in development
  const response = appError.toJSON
    ? appError.toJSON()
    : {
        success: false,
        message: appError.message,
        code: appError.code,
        statusCode,
        timestamp: new Date().toISOString(),
      };

  return res.status(statusCode).json(response);
};

/**
 * Global Error Handler Middleware
 *
 * This middleware catches all errors and provides a unified way to handle them.
 * MUST be the last middleware in the app.
 *
 * Features:
 * - Distinguishes between operational and programmer errors
 * - Logs errors with full context
 * - Hides sensitive info in production
 * - Formats JSON responses consistently
 */
export const errorHandler = (err, req, res, next) => {
  // Normalize the error
  const appError = normalizeError(err);

  // Log the error
  logError(appError, req);

  // Send response
  sendErrorResponse(res, appError);
};

/**
 * Async error wrapper
 * Wrap async route handlers to catch errors and pass to middleware
 *
 * Example:
 * router.get('/users/:id', asyncHandler(getUserHandler))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export {
  AppError,
  ValidationError,
  InternalServerError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../utils/AppError.js";
