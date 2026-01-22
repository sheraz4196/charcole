import type { Response } from "express";

/**
 * Standard success response shape
 */
export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = "Success",
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response shape (legacy)
 */
type ErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
  timestamp: string;
};

/**
 * Send error response (DEPRECATED — use AppError instead)
 * Kept for backward compatibility
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors: unknown = null,
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== null && { errors }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Validation error item (Zod / Joi–style compatible)
 */
type ValidationIssue = {
  path: (string | number)[];
  message: string;
  code?: string;
};

/**
 * Validation error response shape
 */
type ValidationErrorResponse = {
  success: false;
  message: string;
  errors: {
    field: string;
    message: string;
    code?: string;
  }[];
  timestamp: string;
};

/**
 * Send validation error response (DEPRECATED — use ValidationError instead)
 * Kept for backward compatibility
 */
export const sendValidationError = (
  res: Response,
  errors: ValidationIssue[],
  statusCode = 422,
): Response<ValidationErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message: "Validation failed",
    errors: errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    })),
    timestamp: new Date().toISOString(),
  });
};
