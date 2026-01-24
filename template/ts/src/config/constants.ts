export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = typeof HTTP_STATUS;

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Validation failed",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized",
  SERVER_ERROR: "Internal server error",
  BAD_REQUEST: "Bad request",
} as const;

export type ErrorMessages = typeof ERROR_MESSAGES;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
