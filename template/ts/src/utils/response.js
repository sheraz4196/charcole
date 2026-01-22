/**
 * Send success response
 *
 * @param {Response} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message (default: 'Success')
 */
export const sendSuccess = (
  res,
  data,
  statusCode = 200,
  message = "Success",
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error response (DEPRECATED - use AppError instead)
 * This is kept for backward compatibility
 */
export const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send validation error response (DEPRECATED - use ValidationError instead)
 * This is kept for backward compatibility
 */
export const sendValidationError = (res, errors, statusCode = 422) => {
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
