# Production-Level Error Handling System - Quick Reference

## 🎯 Problem Solved

❌ **Before:** Random `res.status(500).json(...)` scattered throughout code  
✅ **After:** Single centralized error handler with distinguished error types

## 🏗️ System Architecture

```
Every Request
    ↓
Route Handler (wrapped with asyncHandler)
    ↓
    ├─→ Success? → sendSuccess(res, data)
    │
    └─→ Error thrown ✘
        ↓
    Global Error Handler
        ↓
    Normalize Error
    ├─→ Is it AppError? Use it
    ├─→ Is it ZodError? Convert to ValidationError
    ├─→ Is it TypeError/ReferenceError/etc? Convert to InternalServerError
        ↓
    Classify Error
    ├─→ Operational? (isOperational: true)
    │   ├─ Log as WARN with context
    │   └─ Send full details to client
    │
    └─→ Programmer Error? (isOperational: false)
        ├─ Log as ERROR with stack trace
        └─ Send generic message in production
        ↓
    Send Consistent JSON Response
```

## 📦 Error Classes (Use These!)

```javascript
import {
  AppError, // Base class
  ValidationError, // Input validation failed
  AuthenticationError, // Auth failed (401)
  AuthorizationError, // Permission denied (403)
  NotFoundError, // Resource not found (404)
  ConflictError, // Duplicate/conflict (409)
  BadRequestError, // Malformed request (400)
  InternalServerError, // Unexpected error (500)
} from "./middlewares/errorHandler.js";
```

## 🎬 Quick Start

### 1. Throw Operational Errors

```javascript
// Validation
throw new ValidationError("Invalid input", [
  { field: "email", message: "Invalid email", code: "invalid_email" },
]);

// Not found
throw new NotFoundError("User", { id: userId });

// Duplicate
throw new ConflictError("Email already exists", { email });

// Auth
throw new AuthenticationError("Invalid credentials");

// Permission
throw new AuthorizationError("Access denied");

// Generic operational error
throw new AppError("Request failed", 400, {
  isOperational: true,
  code: "CUSTOM_ERROR",
  context: { details: "..." },
});
```

### 2. Wrap All Async Handlers

```javascript
import { asyncHandler } from "./middlewares/errorHandler.js";

// ✅ Correct
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    sendSuccess(res, user, 201);
  }),
);

// ❌ Wrong - errors leak!
router.post("/users", async (req, res) => {
  const user = await User.create(req.body); // Error not caught!
  sendSuccess(res, user, 201);
});
```

### 3. Use Validation Middleware

```javascript
import { validateRequest } from "./middlewares/validateRequest.js";
import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(1, "Name required"),
  }),
});

router.post(
  "/users",
  validateRequest(createUserSchema),
  asyncHandler(async (req, res) => {
    // req.validatedData.body has been validated
    const user = await User.create(req.validatedData.body);
    sendSuccess(res, user, 201, "User created");
  }),
);
```

## 📊 Logging Behavior

| Error Type             | Level | Includes Stack | Info Sent to Client    |
| ---------------------- | ----- | -------------- | ---------------------- |
| ValidationError        | WARN  | ❌             | ✅ All details         |
| NotFoundError          | WARN  | ❌             | ✅ All details         |
| AuthenticationError    | WARN  | ❌             | ✅ All details         |
| TypeError (programmer) | ERROR | ✅             | ❌ Generic only (prod) |
| Unhandled (programmer) | FATAL | ✅             | ❌ Generic only (prod) |

## 📋 Response Format

All responses are consistent JSON:

### Success

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": "123", "name": "John" },
  "timestamp": "2024-01-19T15:55:30.000Z"
}
```

### Operational Error

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "context": { "id": "999" },
  "timestamp": "2024-01-19T15:55:30.000Z"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "errors": [
    { "field": "email", "message": "Invalid email", "code": "invalid_email" }
  ],
  "timestamp": "2024-01-19T15:55:30.000Z"
}
```

### Programmer Error (Production)

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR",
  "timestamp": "2024-01-19T15:55:30.000Z"
}
```

## 🛡️ Golden Rules

1. **Always use asyncHandler** for async route handlers

   ```javascript
   router.get("/endpoint", asyncHandler(async (req, res) => { ... }))
   ```

2. **Never use res.status().json()** for errors - throw AppError instead

   ```javascript
   // ❌ Wrong
   res.status(400).json({ error: "..." });

   // ✅ Correct
   throw new BadRequestError("Invalid input");
   ```

3. **Validate request early** with validateRequest middleware

   ```javascript
   router.post("/endpoint", validateRequest(schema), handler);
   ```

4. **Throw, don't catch** - let global handler catch

   ```javascript
   // ❌ Wrong
   try {
     await someTask();
   } catch (err) {
     res.status(500).json(err);
   }

   // ✅ Correct
   await someTask(); // Error bubbles up to global handler
   ```

5. **Include context** when throwing errors
   ```javascript
   throw new NotFoundError("User", { id: userId, email: userEmail });
   ```

## 🚀 Features at a Glance

| Feature                                          | Status |
| ------------------------------------------------ | ------ |
| Centralized error handler                        | ✅     |
| Error classification (operational vs programmer) | ✅     |
| Validation error formatting                      | ✅     |
| Async error wrapping                             | ✅     |
| Stack trace logging                              | ✅     |
| Production sanitization                          | ✅     |
| Request logging                                  | ✅     |
| Graceful shutdown                                | ✅     |
| Unhandled exception catching                     | ✅     |
| Consistent JSON responses                        | ✅     |

## 📚 Full Documentation

- **[ERROR_HANDLING.md](ERROR_HANDLING.md)** - Comprehensive guide with examples
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - Full implementation details

## 🎓 Key Files

| File                                 | Purpose                             |
| ------------------------------------ | ----------------------------------- |
| `src/utils/AppError.js`              | Error class hierarchy               |
| `src/middlewares/errorHandler.js`    | Global error handler + asyncHandler |
| `src/middlewares/validateRequest.js` | Zod validation middleware           |
| `src/middlewares/requestLogger.js`   | Request logging                     |
| `src/utils/logger.js`                | Structured logging with colors      |
| `src/utils/response.js`              | Success response helpers            |

---

**That's it! Your API now has enterprise-grade error handling.** 🎯

Every error flows through one place. Every response is consistent. Errors are properly classified and logged. You're ready for production. 🚀
