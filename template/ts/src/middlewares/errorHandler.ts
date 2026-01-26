import { ZodError } from "zod";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.ts";
import { logger } from "../utils/logger.ts";
import {
  AppError,
  ValidationError,
  InternalServerError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../utils/AppError.js";
import { env } from "../config/env.js";
import { Request, Response, NextFunction, RequestHandler } from "express";

const normalizeError = (err: unknown): AppError => {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
    return new ValidationError(ERROR_MESSAGES.VALIDATION_ERROR, errors);
  }

  if (err instanceof Error) {
    if (err instanceof SyntaxError) {
      return new InternalServerError("Syntax error in application code", err, {
        type: "SyntaxError",
      });
    }

    if (err instanceof TypeError) {
      return new InternalServerError("Type error in application", err, {
        type: "TypeError",
      });
    }

    if (err instanceof ReferenceError) {
      return new InternalServerError("Reference error in application", err, {
        type: "ReferenceError",
      });
    }

    if (err instanceof RangeError) {
      return new InternalServerError("Range error in application", err, {
        type: "RangeError",
      });
    }

    return new InternalServerError(
      err.message || ERROR_MESSAGES.SERVER_ERROR,
      err,
      { type: "UnknownError" },
    );
  }

  const errorMessage =
    typeof err === "string"
      ? err
      : err &&
          typeof err === "object" &&
          "message" in err &&
          typeof err.message === "string"
        ? err.message
        : ERROR_MESSAGES.SERVER_ERROR;

  return new InternalServerError(
    errorMessage,
    err instanceof Error ? err : new Error(String(err)),
    { type: "UnknownError" },
  );
};

const logError = (appError: AppError, req: Request): void => {
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

  if (appError.isOperational) {
    logger.warn(`Operational Error: ${appError.code}`, errorDetails);
  } else {
    logger.error(
      `Programmer Error: ${appError.code}`,
      errorDetails,
      appError.stack,
    );
  }

  if (
    appError instanceof ValidationError &&
    (appError as ValidationError).errors
  ) {
    const validationError = appError as ValidationError;
    logger.debug("Validation errors", { errors: validationError.errors });
  }

  if (appError.cause) {
    const causeMessage =
      appError.cause instanceof Error
        ? appError.cause.message
        : String(appError.cause);
    logger.debug("Error cause", { cause: causeMessage });
  }
};

const sendErrorResponse = (res: Response, appError: AppError): void => {
  const statusCode = appError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (!appError.isOperational && env.isProduction) {
    res.status(statusCode).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const response =
    (appError as any).toJSON && typeof (appError as any).toJSON === "function"
      ? (appError as any).toJSON()
      : {
          success: false,
          message: appError.message,
          code: appError.code,
          statusCode,
          timestamp: new Date().toISOString(),
        };

  res.status(statusCode).json(response);
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
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const appError = normalizeError(err);

  logError(appError, req);

  sendErrorResponse(res, appError);
};

/**
 * Async error wrapper
 * Wrap async route handlers to catch errors and pass to middleware
 *
 * Example:
 * router.get('/users/:id', asyncHandler(getUserHandler))
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    try {
      const result = fn(req, res, next);

      if (
        result &&
        typeof result === "object" &&
        "then" in result &&
        typeof result.then === "function"
      ) {
        return (result as Promise<any>).catch(next);
      }

      return result;
    } catch (err) {
      return next(err);
    }
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
};
