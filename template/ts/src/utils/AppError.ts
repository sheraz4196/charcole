/**
 * Shared types
 */

export type ErrorContext = Record<string, unknown>;

export interface AppErrorOptions {
  isOperational?: boolean;
  code?: string | null;
  context?: ErrorContext | null;
  cause?: Error | null;
}

/**
 * Operational Error Class
 *
 * Use for expected errors that can be handled gracefully
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string | null;
  public readonly context: ErrorContext;
  public readonly cause: Error | null;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode = 500,
    {
      isOperational = true,
      code = null,
      context = null,
      cause = null,
    }: AppErrorOptions = {},
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.context = context ?? {};
    this.cause = cause;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON response format
   */
  toJSON(): {
    success: false;
    message: string;
    code: string | null;
    statusCode: number;
    context?: ErrorContext;
    timestamp: string;
  } {
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
  getFullDetails(): {
    message: string;
    statusCode: number;
    code: string | null;
    isOperational: boolean;
    context: ErrorContext;
    cause: string | null;
    stack?: string;
    timestamp: string;
  } {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      context: this.context,
      cause: this.cause?.message ?? null,
      stack: this.stack,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  public readonly errors: unknown[];

  constructor(
    message: string,
    errors: unknown[] = [],
    context: ErrorContext | null = null,
  ) {
    super(message, 422, {
      isOperational: true,
      code: "VALIDATION_ERROR",
      context,
    });

    this.name = "ValidationError";
    this.errors = errors;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message = "Unauthorized", context: ErrorContext | null = null) {
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
 */
export class AuthorizationError extends AppError {
  constructor(message = "Forbidden", context: ErrorContext | null = null) {
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
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource", context: ErrorContext | null = null) {
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
 */
export class ConflictError extends AppError {
  constructor(message: string, context: ErrorContext | null = null) {
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
 */
export class BadRequestError extends AppError {
  constructor(message: string, context: ErrorContext | null = null) {
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
 */
export class InternalServerError extends AppError {
  constructor(
    message = "Internal server error",
    cause: Error | null = null,
    context: ErrorContext | null = null,
  ) {
    super(message, 500, {
      isOperational: false,
      code: "INTERNAL_SERVER_ERROR",
      cause,
      context,
    });

    this.name = "InternalServerError";
  }
}
