/**
 * Operational Error Class
 *
 * Use for expected errors that can be handled gracefully
 * Examples: validation errors, resource not found, auth failures
 *
 * These errors are logged and sent back to client as JSON
 */
export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    { isOperational = true, code = null, context = null, cause = null } = {},
  ) {
    super(message);

    // Operational or Programmer error
    this.isOperational = isOperational;

    // HTTP status code
    this.statusCode = statusCode;

    // Error code for client handling (e.g., 'INVALID_EMAIL', 'USER_NOT_FOUND')
    this.code = code;

    // Additional context data
    this.context = context || {};

    // Original error that caused this
    this.cause = cause;

    // Timestamp
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(Object.keys(this.context).length > 0 && { context: this.context }),
      timestamp: this.timestamp,
    };
  }

  /**
   * Get full error details for logging
   */
  getFullDetails() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      context: this.context,
      cause: this.cause?.message || null,
      stack: this.stack,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation Error - extends AppError
 * Use for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message, errors = [], context = null) {
    super(message, 422, {
      isOperational: true,
      code: "VALIDATION_ERROR",
      context,
    });
    this.errors = errors;
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Authentication Error
 * Use for auth/permission failures
 */
export class AuthenticationError extends AppError {
  constructor(message = "Unauthorized", context = null) {
    super(message, 401, {
      isOperational: true,
      code: "AUTHENTICATION_ERROR",
      context,
    });
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization Error
 * Use for permission denied scenarios
 */
export class AuthorizationError extends AppError {
  constructor(message = "Forbidden", context = null) {
    super(message, 403, {
      isOperational: true,
      code: "AUTHORIZATION_ERROR",
      context,
    });
    this.name = "AuthorizationError";
  }
}

/**
 * Not Found Error
 * Use when resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", context = null) {
    super(`${resource} not found`, 404, {
      isOperational: true,
      code: "NOT_FOUND",
      context,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Conflict Error
 * Use for duplicate resources, business logic conflicts
 */
export class ConflictError extends AppError {
  constructor(message, context = null) {
    super(message, 409, {
      isOperational: true,
      code: "CONFLICT",
      context,
    });
    this.name = "ConflictError";
  }
}

/**
 * Bad Request Error
 * Use for malformed requests
 */
export class BadRequestError extends AppError {
  constructor(message, context = null) {
    super(message, 400, {
      isOperational: true,
      code: "BAD_REQUEST",
      context,
    });
    this.name = "BadRequestError";
  }
}

/**
 * Internal Server Error
 * Use for unexpected server-side errors (programmer errors)
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", cause = null, context = null) {
    super(message, 500, {
      isOperational: false,
      code: "INTERNAL_SERVER_ERROR",
      cause,
      context,
    });
    this.name = "InternalServerError";
  }
}
