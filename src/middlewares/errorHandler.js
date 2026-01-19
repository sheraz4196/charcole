import { ZodError } from "zod";
import { HTTP_STATUS, ERROR_MESSAGES } from "../config/constants.js";
import { sendError, sendValidationError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred", {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    message: err.message,
  });

  if (err instanceof ZodError) {
    return sendValidationError(res, err.errors);
  }

  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  return sendError(
    res,
    ERROR_MESSAGES.SERVER_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
};

export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
