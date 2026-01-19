# Error Handling Guide

This document explains the production-level error handling system in Charcole API.

## Architecture Overview

The error handling system is built on a few key principles:

1. **Centralized Error Handling** - All errors flow through one place
2. **Error Classification** - Distinguish between operational and programmer errors
3. **Consistent Response Format** - All errors return structured JSON
4. **Comprehensive Logging** - Full context logged for debugging

## Error Types

### Operational Errors

Expected errors that can be handled gracefully. Client caused or known limitations.

```javascript
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "./utils/AppError.js";

// Validation error
throw new ValidationError("Validation failed", [
  { field: "email", message: "Invalid email", code: "invalid_email" },
]);

// Authentication error
throw new AuthenticationError("Invalid credentials");

// Authorization error
throw new AuthorizationError("You don't have permission");

// Not found error
throw new NotFoundError("User");

// Conflict error (e.g., duplicate email)
throw new ConflictError("User with this email already exists");

// Bad request error
throw new BadRequestError("Invalid request");

// Generic operational error with context
throw new AppError("Resource quota exceeded", 429, {
  isOperational: true,
  code: "QUOTA_EXCEEDED",
  context: { limit: 100, used: 100 },
});
```

### Programmer Errors

Unexpected errors that indicate bugs in the code. These are NOT sent to the client in production.

- `SyntaxError` - Code has syntax issues
- `TypeError` - Type mismatch or undefined method
- `ReferenceError` - Undefined variable
- `RangeError` - Invalid range
- Any unhandled error

## Using asyncHandler

Wrap all async route handlers to catch errors automatically:

```javascript
import { asyncHandler } from "./middlewares/errorHandler.js";

// Without asyncHandler - error not caught!
router.get("/users/:id", (req, res) => {
  const user = await findUser(req.params.id); // Error not caught
  res.json(user);
});

// With asyncHandler - error caught and passed to error handler
router.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await findUser(req.params.id); // Error caught!
  res.json(user);
}));
```

## Error Handling Flow

```
Request
  ↓
Route Handler (wrapped with asyncHandler)
  ↓
Error thrown ←─ (if something goes wrong)
  ↓
Global Error Handler Middleware
  ↓
Error normalized (AppError, ZodError, TypeError, etc.)
  ↓
Error logged (operational vs programmer)
  ↓
Response sent (sanitized in production)
```

## Logging Behavior

### Operational Errors (isOperational: true)

Logged as **WARN** with full context:

```
[2024-01-19T10:30:00.000Z] WARN: Operational Error: VALIDATION_ERROR
{
  "type": "OPERATIONAL",
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "statusCode": 422,
  "method": "POST",
  "path": "/api/items"
}
```

### Programmer Errors (isOperational: false)

Logged as **ERROR** with full stack trace:

```
[2024-01-19T10:30:00.000Z] ERROR: Programmer Error: REFERENCE_ERROR
{
  "type": "PROGRAMMER",
  "code": "REFERENCE_ERROR",
  "message": "user is not defined",
  "statusCode": 500,
  "method": "GET",
  "path": "/api/users/123"
}
ReferenceError: user is not defined
    at getUserHandler (/app/src/modules/users/controller.js:15:3)
    ...
```

## Response Format

All errors are returned as JSON with this structure:

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

### Validation Errors

Include detailed field-level errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address",
      "code": "invalid_email"
    },
    {
      "field": "age",
      "message": "Must be at least 18",
      "code": "too_small"
    }
  ],
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

### Production vs Development

**In Production:**

- Programmer errors return generic message
- No stack traces sent to client
- All errors are logged server-side

**In Development:**

- Full error details returned
- Stack traces included
- Detailed context shown

## Creating Custom Errors

Extend AppError for domain-specific errors:

```javascript
import { AppError } from "./utils/AppError.js";

export class UserAlreadyExistsError extends AppError {
  constructor(email) {
    super("User with this email already exists", 409, {
      isOperational: true,
      code: "USER_EXISTS",
      context: { email },
    });
    this.name = "UserAlreadyExistsError";
  }
}

// Use it:
throw new UserAlreadyExistsError("john@example.com");
```

## Error Handling Best Practices

### ✅ DO

```javascript
// Use asyncHandler for async handlers
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    sendSuccess(res, users);
  }),
);

// Throw AppError for operational errors
if (!user) {
  throw new NotFoundError("User");
}

// Use proper error codes
throw new ValidationError("Email is required", [
  { field: "email", message: "Email is required", code: "required" },
]);

// Log important context
throw new AppError("Payment failed", 402, {
  isOperational: true,
  code: "PAYMENT_FAILED",
  context: { orderId: "123", amount: 99.99 },
});
```

### ❌ DON'T

```javascript
// Don't use res.status(500).json(...) - use AppError instead
res.status(500).json({ error: "Something went wrong" });

// Don't swallow errors silently
try {
  await someAsyncWork();
} catch (error) {
  // WRONG: error is lost!
}

// Don't forget asyncHandler wrapper
router.get("/users", async (req, res) => {
  // Error not caught!
  const users = await User.find();
});

// Don't mix error handling styles
try {
  // ...
} catch (error) {
  res.status(500).json(error); // Use AppError instead
}

// Don't log sensitive data
logger.error("Error", { password: user.password }); // WRONG!
```

## Testing Errors

```javascript
import { AppError, NotFoundError } from "./utils/AppError.js";

describe("Error Handling", () => {
  it("should throw NotFoundError", () => {
    expect(() => {
      throw new NotFoundError("User");
    }).toThrow(NotFoundError);
  });

  it("should have correct status code", () => {
    const error = new NotFoundError("User");
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it("should include context in error", () => {
    const error = new AppError("Quote limit exceeded", 429, {
      isOperational: true,
      code: "QUOTE_EXCEEDED",
      context: { limit: 100, used: 100 },
    });
    expect(error.context.limit).toBe(100);
  });
});
```

## Error Codes Reference

| Code                  | Status | Meaning                     |
| --------------------- | ------ | --------------------------- |
| VALIDATION_ERROR      | 422    | Request validation failed   |
| NOT_FOUND             | 404    | Resource not found          |
| AUTHENTICATION_ERROR  | 401    | Invalid credentials         |
| AUTHORIZATION_ERROR   | 403    | Permission denied           |
| BAD_REQUEST           | 400    | Malformed request           |
| CONFLICT              | 409    | Duplicate/conflict resource |
| INTERNAL_SERVER_ERROR | 500    | Unexpected server error     |

## Monitoring & Alerts

In production, monitor these metrics:

1. **Error Rate** - Track operational vs programmer errors
2. **Response Times** - Identify performance issues
3. **5xx Errors** - Alert on programmer errors
4. **Specific Error Codes** - Monitor auth failures, validation errors, etc.

## Examples

### Example 1: Creating a User with Validation

```javascript
import { asyncHandler, ValidationError } from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/response.js";

export const createUser = asyncHandler(async (req, res) => {
  const { email, name } = req.validatedData.body;

  // Check for duplicate
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ConflictError("User with this email already exists", {
      email,
    });
  }

  // Create user
  const user = await User.create({ email, name });

  // Return success
  sendSuccess(res, user, 201, "User created successfully");
});
```

### Example 2: Fetching a User with 404 Handling

```javascript
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError("User", { id: req.params.id });
  }

  sendSuccess(res, user);
});
```

### Example 3: Protected Endpoint with Auth Check

```javascript
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError("User");
  }

  // Check authorization
  if (user.id !== req.user.id) {
    throw new AuthorizationError("You can only update your own profile");
  }

  const updated = await user.updateOne(req.validatedData.body);
  sendSuccess(res, updated, 200, "User updated");
});
```

This comprehensive error handling system ensures that every error in your application is caught, logged appropriately, and returned to the client in a consistent, secure manner.
