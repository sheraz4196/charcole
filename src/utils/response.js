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

export const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
  });
};

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
