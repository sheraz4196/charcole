# Charcole API

> **Production-grade Node.js Express API with enterprise-level error handling, Zod validation, and structured logging.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![Zod](https://img.shields.io/badge/Zod-3.22+-purple.svg)](https://zod.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 🎯 What This Is

A **production-ready Node.js Express backend** with:

- ✅ **Centralized Error Handling** - Every error flows through one place
- ✅ **Error Classification** - Operational vs Programmer errors distinguished
- ✅ **Zod Validation** - Type-safe schema validation with automatic error formatting
- ✅ **Structured Logging** - Color-coded logs with context and stack traces
- ✅ **Consistent JSON Responses** - Standardized format across all endpoints
- ✅ **Production-Safe** - Internal details hidden from clients in production
- ✅ **Async Error Handling** - Promise rejection leaks prevented with asyncHandler
- ✅ **Graceful Shutdown** - Proper cleanup on SIGTERM/SIGINT
- ✅ **Request Logging** - Method, path, status, duration, IP automatically tracked
- ✅ **Unhandled Exception Catching** - All edge cases caught and logged

## 🚀 Quick Start

### Installation

```bash
# Create your charcole app now
npx create-charcole@latest charcole-demo

# Configure environment
cp .env.example .env

# Start development server (with auto-reload)
npm run dev

# OR start production server
npm start
```

Server runs on `http://localhost:3000` by default.

## 📋 Key Features

### 🛡️ Enterprise-Grade Error Handling

**No More `res.status(500).json(...)`**

Every error in your application flows through a centralized global error handler that:

1. **Normalizes** all error types (ZodError, TypeError, custom AppError, etc.)
2. **Classifies** errors as operational (expected) or programmer (bugs)
3. **Logs** appropriately (WARN for operational, ERROR with stack for programmer)
4. **Sanitizes** responses (hides details in production, shows context in dev)

```javascript
// ✅ Throw AppError - ALWAYS
throw new NotFoundError("User", { id: userId });
throw new ValidationError("Invalid input", errors);
throw new ConflictError("Email already exists");

// ❌ Never do this
res.status(404).json({ error: "Not found" });
```

### 🔐 Type-Safe Validation

```javascript
import { z } from "zod";
import { validateRequest } from "./middlewares/validateRequest.js";

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
});

router.post("/users", validateRequest(createUserSchema), handler);
```

### 📝 Structured Logging

```javascript
import { logger } from "./utils/logger.js";

logger.debug("Debug message", { data: true });
logger.info("Info message", { data: true });
logger.warn("Warning message", { data: true });
logger.error("Error message", { data: true });
```

### 📊 Consistent JSON Responses

All responses follow the same format:

**Success:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": "123", "name": "John" },
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

**Error:**

```json
{
  "success": false,
  "message": "User not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "context": { "id": "999" },
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

**Validation Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "errors": [
    { "field": "email", "message": "Invalid email", "code": "invalid_email" }
  ],
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

## 🏗️ Error Classes

Use these specialized error classes:

```javascript
import {
  AppError, // Base class
  ValidationError, // 422 - Input validation failed
  BadRequestError, // 400 - Malformed request
  AuthenticationError, // 401 - Invalid credentials
  AuthorizationError, // 403 - Permission denied
  NotFoundError, // 404 - Resource not found
  ConflictError, // 409 - Duplicate/conflict
  InternalServerError, // 500 - Unexpected error
} from "./middlewares/errorHandler.js";
```

## 📚 Documentation

| Document                                          | Purpose                           |
| ------------------------------------------------- | --------------------------------- |
| [Getting Started](template/README.md)             | Setup & directory structure guide |
| [Quick Reference](QUICK_REFERENCE.md)             | Quick patterns & golden rules     |
| [Error Handling Guide](ERROR_HANDLING.md)         | Comprehensive error documentation |
| [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md) | Visual system architecture        |
| [Full Implementation](IMPLEMENTATION_COMPLETE.md) | Complete implementation details   |

## 🎓 4 Golden Rules

1. **Wrap async handlers** with `asyncHandler`

   ```javascript
   router.get("/users/:id", asyncHandler(async (req, res) => { ... }))
   ```

2. **Throw AppError** (never use `res.status().json()`)

   ```javascript
   throw new NotFoundError("User", { id });
   ```

3. **Validate requests** with `validateRequest`

   ```javascript
   router.post("/users", validateRequest(schema), handler);
   ```

4. **Send success** with `sendSuccess`
   ```javascript
   sendSuccess(res, data, 201, "User created");
   ```

## 📂 Project Structure

```
src/
├── config/
│   ├── env.js              # Environment validation with Zod
│   └── constants.js        # HTTP status codes & error messages
├── middlewares/
│   ├── errorHandler.js     # ⭐ Global error handler + asyncHandler
│   ├── validateRequest.js  # Request validation middleware
│   └── requestLogger.js    # Request logging
├── modules/
│   └── health/
│       └── controller.js   # Example handlers
├── utils/
│   ├── AppError.js         # ⭐ Error class hierarchy
│   ├── logger.js           # Structured logging
│   └── response.js         # Success response helpers
├── app.js                  # Express app setup
├── routes.js               # API routes
└── server.js               # Server entry point
```

## 🚀 Running

```bash
# Development (with auto-reload and full logging)
npm run dev

# Production (optimized, minimal logging)
npm start

# Test API endpoints
node test-api.js
```

## 🔧 Configuration

Environment variables (see `.env.example`):

```env
NODE_ENV=development        # development, production, test
PORT=3000                   # Server port
LOG_LEVEL=info              # debug, info, warn, error
CORS_ORIGIN=*               # CORS allowed origins
REQUEST_TIMEOUT=30000       # Request timeout in milliseconds
```

## 💻 Example: Create User Endpoint

```javascript
import { asyncHandler, ConflictError } from "./middlewares/errorHandler.js";
import { validateRequest } from "./middlewares/validateRequest.js";
import { sendSuccess } from "./utils/response.js";
import { z } from "zod";

// 1. Define validation schema
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(1, "Name required").max(100),
  }),
});

// 2. Define handler (wrapped with asyncHandler)
export const createUser = asyncHandler(async (req, res) => {
  const { email, name } = req.validatedData.body;

  // Check for duplicate
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ConflictError("Email already exists", { email });
  }

  // Create user (any error is automatically caught)
  const user = await User.create({ email, name });

  // Send success
  sendSuccess(res, user, 201, "User created successfully");
});

// 3. Use in routes
router.post("/users", validateRequest(createUserSchema), createUser);
```

**Results:**

- ✅ Valid request → 201 with user data
- ✅ Invalid email → 422 with field errors
- ✅ Duplicate email → 409 conflict
- ✅ Database error → 500 (logged, generic message sent in prod)

## 🌐 API Endpoints

All endpoints follow the same error handling pattern:

```
GET  /                 # Root - API info
GET  /api/health      # Health check
POST /api/items       # Create item (example)
```

## ✨ What Makes This Special

Unlike typical Express APIs, Charcole:

- ✅ **Distinguishes operational from programmer errors** - Different handling for expected vs unexpected errors
- ✅ **Never leaks internal details** - Production-safe error responses
- ✅ **Catches all async errors** - No promise rejections leak
- ✅ **Logs with full context** - Debugging is easy
- ✅ **Validates everything** - Zod integration prevents bad data
- ✅ **Consistent responses** - Predictable format for every endpoint
- ✅ **Production-ready** - Graceful shutdown, signal handling, etc.

## 🔄 Error Flow

```
Request arrives
     ↓
Handler (wrapped with asyncHandler)
     ├─ Success → sendSuccess() → Response sent ✓
     └─ Error thrown ✘
        ↓
Global error handler catches it
     ↓
Error normalized & classified
     ↓
Logged (WARN for operational, ERROR with stack for programmer)
     ↓
Consistent JSON response sent
```

## 📊 Logging Examples

### Operational Error (Expected)

```
[2024-01-20T12:00:00.000Z] WARN: Operational Error: NOT_FOUND
{ "code": "NOT_FOUND", "message": "User not found", "statusCode": 404 }
```

### Programmer Error (Bug)

```
[2024-01-20T12:00:00.000Z] ERROR: Programmer Error: REFERENCE_ERROR
{ "code": "REFERENCE_ERROR", "message": "user is not defined" }
ReferenceError: user is not defined
    at handler.js:15:3
    ...
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server with auto-reload
npm run dev

# Check for syntax errors
npm run lint

# Run tests
npm test
```

## 📦 Dependencies

- **Express** - Web framework
- **Zod** - Schema validation
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables
- **nodemon** - Auto-reload (dev only)

## 🚢 Production Checklist

Before deploying:

- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` for your domain
- [ ] Set `LOG_LEVEL=warn` or higher
- [ ] Add database connection
- [ ] Implement authentication
- [ ] Add rate limiting
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure reverse proxy (nginx/apache)
- [ ] Test all error scenarios
- [ ] Verify no secrets in error responses

## 🤝 Contributing

Contributions welcome! Please:

1. Follow the error handling patterns
2. Always use `asyncHandler` for async handlers
3. Throw `AppError` instances for errors
4. Include context in errors
5. Add tests for new features

## 📄 License

ISC

---

**Made for teams that care about code quality and production reliability.** 🚀

Need help? See the [Getting Started Guide](template/README.md) or [Full Documentation](ERROR_HANDLING.md).
