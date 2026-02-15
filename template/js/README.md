# Getting Started with Charcole API

Welcome! This guide will help you set up and start using the Charcole API framework.

## 📚 Table of Contents

1. [Installation](#installation)
2. [Project Structure](#project-structure)
3. [Configuration](#configuration)
4. [Creating Your First Endpoint](#creating-your-first-endpoint)
5. [API Documentation with Swagger](#api-documentation-with-swagger)
6. [Error Handling](#error-handling)
7. [Validation](#validation)
8. [Logging](#logging)
9. [Running Your API](#running-your-api)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Installation

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm or yarn

### Setup Steps

1. **Create Charcole App**

   ```bash
   npx create-charcole@latest charcole-demo
   ```

2. **Create environment file**

The `create-charcole` CLI will automatically create a `.env` from `.env.example` and initialize a Git repository for you. Edit the generated `.env` as needed.

If you prefer to create it manually:

```bash
cp .env.example .env
```

3. **Run the charcole**
   ```bash
   npm run dev
   ```

You should see:

```
[2024-01-20T12:00:00.000Z] INFO: Express app configured successfully
[2024-01-20T12:00:00.000Z] INFO: 🔥 Server running in development mode
```

---

## 📂 Project Structure

Understanding the folder structure:

```
charcole-demo/
├── src/                          # All application code
│   ├── config/
│   │   ├── env.js               # Environment validation
│   │   │                         # Validates all .env variables at startup
│   │   │                         # If invalid, server won't start
│   │   │
│   │   └── constants.js         # HTTP status codes & error messages
│   │                             # Use these in your code
│   │
│   ├── middlewares/              # Express middleware
│   │   ├── errorHandler.js      # ⭐ IMPORTANT: Global error handler
│   │   │                         # Every error flows through here
│   │   │                         # Also exports: asyncHandler, AppError classes
│   │   │
│   │   ├── validateRequest.js   # Validates request body, query, params
│   │   │                         # Uses Zod schemas
│   │   │                         # Throws ValidationError if invalid
│   │   │
│   │   └── requestLogger.js     # Logs all incoming requests
│   │                             # Logs: method, path, status, duration, IP
│   │
│   ├── modules/                  # Feature modules (organized by feature)
│   │   └── health/
│   │       ├── controller.js    # Route handlers for this feature
│   │       │                     # Export: getHealth, createItem, etc.
│   │       │                     # Export: validation schemas
│   │       │
│   │       └── service.js       # (Optional) Business logic
│   │       └── model.js         # (Optional) Data models
│   │
│   ├── utils/
│   │   ├── AppError.js          # ⭐ IMPORTANT: Error class hierarchy
│   │   │                         # Use these to throw errors
│   │   │                         # ValidationError, NotFoundError, etc.
│   │   │
│   │   ├── logger.js            # Structured logging
│   │   │                         # Use: logger.info(), logger.error(), etc.
│   │   │
│   │   └── response.js          # Response helpers
│   │                             # Use: sendSuccess() for responses
│   │
│   ├── app.js                   # Express app configuration
│   │                             # All middleware setup
│   │                             # Error handler registered here (last)
│   │
│   ├── routes.js                # All API routes
│   │                             # Import handlers from modules
│   │                             # Define routes here
│   │
│   └── server.js                # Server entry point
│                                 # Listen on PORT
│                                 # Graceful shutdown handling
│
├── .env                         # Environment variables (GITIGNORED)
├── .env.example                 # Example env variables (committed)
├── package.json                 # Dependencies & scripts
├── README.md                    # Project overview (for GitHub/npm)
└── template/README.md           # This file - Getting started guide
```

### Creating New Modules

Create a new feature:

```bash
# Create directory
mkdir -p src/modules/users

# Create files
touch src/modules/users/controller.js
touch src/modules/users/service.js
```

**controller.js** - Route handlers

```javascript
import { asyncHandler } from "../../middlewares/errorHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { z } from "zod";

export const getUserSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await findUserById(id);
  if (!user) throw new NotFoundError("User");
  sendSuccess(res, user);
});
```

---

## ⚙️ Configuration

### Environment Variables

Edit `.env`:

```env
# Server
NODE_ENV=development              # development, production, or test
PORT=3000                         # Server port

# Logging
LOG_LEVEL=info                    # debug, info, warn, error
                                  # In production, use warn or error

# CORS
CORS_ORIGIN=*                     # Change to your domain in production
                                  # Example: https://myapp.com

# Timeouts
REQUEST_TIMEOUT=30000             # 30 seconds
```

### Using Environment Variables

```javascript
import { env } from "./config/env.js";

console.log(env.PORT); // 3000
console.log(env.NODE_ENV); // development
console.log(env.isProduction); // false
console.log(env.isDevelopment); // true
```

---

## 🚀 Creating Your First Endpoint

### Step 1: Create Controller

**src/modules/posts/controller.js**

```javascript
import { z } from "zod";
import { asyncHandler } from "../../middlewares/errorHandler.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../middlewares/errorHandler.js";

// Define validation schema
export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title required").max(200),
    content: z.string().min(1, "Content required"),
  }),
});

// Define handler
export const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.validatedData.body;

  // Your logic here
  const post = {
    id: "1",
    title,
    content,
    createdAt: new Date(),
  };

  sendSuccess(res, post, 201, "Post created successfully");
});

export const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Simulate database fetch
  if (id !== "1") {
    throw new NotFoundError("Post", { id });
  }

  const post = { id: "1", title: "Hello", content: "World" };
  sendSuccess(res, post);
});
```

### Step 2: Register Routes

**src/routes.js**

```javascript
import { Router } from "express";
import { getHealth, createItem } from "./modules/health/controller.js";
import {
  createPost,
  getPost,
  createPostSchema,
} from "./modules/posts/controller.js";
import { validateRequest } from "./middlewares/validateRequest.js";

const router = Router();

// Health check
router.get("/health", getHealth);

// Posts
router.post("/posts", validateRequest(createPostSchema), createPost);
router.get("/posts/:id", getPost);

export default router;
```

### Step 3: Test Your Endpoint

```bash
# Start server
npm run dev

# Test creation
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Hello World"}'

# Test retrieval
curl http://localhost:3000/api/posts/1

# Test 404
curl http://localhost:3000/api/posts/999
```

---

## 🛡️ Error Handling

### Understanding Errors

There are **two types of errors**:

#### 1. Operational Errors (Expected)

User/input errors that can be handled gracefully.

```javascript
import {
  ValidationError, // 422 - Input validation failed
  BadRequestError, // 400 - Malformed request
  AuthenticationError, // 401 - Invalid credentials
  AuthorizationError, // 403 - Permission denied
  NotFoundError, // 404 - Resource not found
  ConflictError, // 409 - Duplicate/conflict
  AppError, // Generic error
} from "./middlewares/errorHandler.js";

// Throw operational errors
throw new NotFoundError("User", { id: userId });
throw new ConflictError("Email already exists");
throw new AuthenticationError("Invalid password");
```

#### 2. Programmer Errors (Bugs)

Unexpected errors that indicate code issues.

```javascript
// These are automatically caught and handled:
// - TypeError
// - ReferenceError
// - SyntaxError
// - Any unhandled error

// Example: This is caught automatically
const user = null;
user.name; // TypeError: Cannot read property 'name' of null
// → Logged as ERROR with stack trace
// → Generic response sent to client
```

### Using asyncHandler

**ALWAYS wrap async handlers** to catch errors:

```javascript
// ✅ CORRECT - Error is caught
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id); // Error caught
    if (!user) throw new NotFoundError("User");
    sendSuccess(res, user);
  }),
);

// ❌ WRONG - Error NOT caught!
router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id); // Error leaks!
  sendSuccess(res, user);
});
```

### Response Format

**Success (200):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": "123", "name": "John" },
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

**Validation Error (422):**

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
    }
  ],
  "timestamp": "2024-01-20T12:00:00.000Z"
}
```

**Not Found (404):**

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

---

## 📖 API Documentation with Swagger

Your API comes with **automatic interactive documentation** powered by Swagger UI!

### Accessing the Documentation

1. Start your server: `npm run dev`
2. Visit: **http://localhost:3000/api-docs**

You'll see all your APIs automatically documented and can test them directly from the browser!

### How It Works

All built-in APIs are already documented. When you create new endpoints, simply add JSDoc comments with `@swagger` annotations:

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Success
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  // Your code here
});
```

That's it! Your new endpoint will automatically appear in Swagger UI.

### Quick Example: Documenting a POST Endpoint

```javascript
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: My First Post
 *               content:
 *                 type: string
 *                 example: This is the post content
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 */
export const createPost = asyncHandler(async (req, res) => {
  // Your implementation
});
```

### Protected Endpoints (with Authentication)

For endpoints that require authentication, add the `security` field:

```javascript
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", requireAuth, getProfile);
```

### 📘 Complete Guide

For comprehensive examples including:

- Path and query parameters
- File uploads
- Complex schemas
- Error responses
- CRUD operations

See the **[Complete Swagger Documentation Guide](src/lib/swagger/SWAGGER_GUIDE.md)**

### Testing APIs in Swagger UI

1. Open http://localhost:3000/api-docs
2. Click on any endpoint to expand it
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"
6. See the response!

For protected endpoints:

1. Click the "Authorize" button at the top
2. Enter your JWT token
3. Now you can test protected endpoints

---

## ✔️ Validation

### Zod Schema Basics

```javascript
import { z } from "zod";

// Define schema
const userSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(1, "Name required"),
    age: z.number().min(18, "Must be 18+").optional(),
  }),
  query: z.object({
    page: z.coerce.number().default(1),
  }),
});

// Use in route
router.post("/users", validateRequest(userSchema), handler);
```

### Common Validations

```javascript
// String
z.string().min(1, "Required");
z.string().email("Invalid email");
z.string().url("Invalid URL");
z.string().regex(/^\d+$/, "Numbers only");

// Number
z.number().min(0).max(100);
z.coerce.number(); // Convert string to number

// Array
z.array(z.string());
z.array(z.object({ id: z.string() }));

// Object
z.object({ key: z.string() });

// Union
z.union([z.string(), z.number()]);

// Optional
z.string().optional();
z.string().default("value");

// Enum
z.enum(["active", "inactive"]);
```

---

## 📝 Logging

### Using Logger

```javascript
import { logger } from "./utils/logger.js";

// Different log levels
logger.debug("Detailed debug info", { data: true });
logger.info("Important information", { userId: 123 });
logger.warn("Warning - something unexpected", { statusCode: 404 });
logger.error("Error occurred", { error: "message" }, stack);
```

### Log Output

**Development** (colorized):

```
[2024-01-20T12:00:00.000Z] DEBUG: Debug message
[2024-01-20T12:00:00.000Z] INFO: Request processed
[2024-01-20T12:00:00.000Z] WARN: User not found
[2024-01-20T12:00:00.000Z] ERROR: Database error
```

**Production** (to file/service):

```
{"level":"info","message":"Request processed","timestamp":"2024-01-20T12:00:00.000Z"}
{"level":"error","message":"Database error","timestamp":"2024-01-20T12:00:00.000Z"}
```

---

## 🎯 Running Your API

### Development

```bash
# Start with auto-reload
npm run dev

# Output:
# [2024-01-20T12:00:00.000Z] INFO: Express app configured successfully
# [2024-01-20T12:00:00.000Z] INFO: 🔥 Server running in development mode
#   { "url": "http://localhost:3000", "port": 3000 }
```

### Production

```bash
# Set environment
export NODE_ENV=production

# Start server
npm start
```

### Testing

```bash
# Test API endpoints
node test-api.js
```

---

## 🆘 Troubleshooting

### Server won't start

**Error:** `listen EADDRINUSE: address already in use :::3000`

**Solution:**

```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows PowerShell:
Get-Process | Where-Object {$_.Port -eq 3000} | Stop-Process -Force
```

### Validation errors not working

**Ensure you:**

1. Import `validateRequest` from middlewares
2. Add it as middleware before handler
3. Pass schema with body/query/params structure
4. Use `req.validatedData` in handler

```javascript
// ✅ Correct
const schema = z.object({
  body: z.object({ name: z.string() }),
});
router.post("/items", validateRequest(schema), handler);

// In handler:
const { name } = req.validatedData.body;
```

### Errors not being caught

**Ensure you:**

1. Wrap handler with `asyncHandler`
2. Throw AppError instances
3. Don't try-catch to return res.status()

```javascript
// ✅ Correct
router.get(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) throw new NotFoundError("Item");
    sendSuccess(res, item);
  }),
);
```

### Environment variables not loading

**Check:**

1. `.env` file exists in root
2. Variable names match (case-sensitive)
3. Restart server after changing .env
4. Use `env.VARIABLE_NAME` to access

```javascript
import { env } from "./config/env.js";

console.log(env.PORT); // Will be validated at startup
```

### CORS errors

**In development**, CORS should be `*`:

```env
CORS_ORIGIN=*
```

**In production**, set your domain:

```env
CORS_ORIGIN=https://myapp.com
```

---

## 📖 Next Steps

1. **Read:** [Main README](../README.md) - Project overview
2. **Learn:** [Quick Reference](../QUICK_REFERENCE.md) - Patterns & rules
3. **Deep Dive:** [Error Handling Guide](../ERROR_HANDLING.md) - Full documentation
4. **Build:** Create your first module using examples above
5. **Deploy:** Follow production checklist in README

---

## 🤔 Common Patterns

### Create with Validation

```javascript
const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
});

export const create = asyncHandler(async (req, res) => {
  const { name, email } = req.validatedData.body;
  const item = await Item.create({ name, email });
  sendSuccess(res, item, 201, "Created");
});

router.post("/items", validateRequest(createSchema), create);
```

### Get with 404 Handling

```javascript
export const getById = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw new NotFoundError("Item");
  sendSuccess(res, item);
});

router.get("/items/:id", getById);
```

### Update with Validation

```javascript
const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  }),
});

export const update = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    req.validatedData.body,
  );
  if (!item) throw new NotFoundError("Item");
  sendSuccess(res, item, 200, "Updated");
});

router.patch("/items/:id", validateRequest(updateSchema), update);
```

### Delete with 404 Handling

```javascript
export const delete = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) throw new NotFoundError("Item");
  sendSuccess(res, { id: item.id }, 200, "Deleted");
});

router.delete("/items/:id", delete);
```

---

**You're ready to build!** 🚀

Questions? Check the [Full Documentation](../ERROR_HANDLING.md).
PORT=3000 # Server port
LOG_LEVEL=info # debug, info, warn, error
CORS_ORIGIN=\* # CORS origin
REQUEST_TIMEOUT=30000 # Request timeout in ms

````

## Running

**Development** (with auto-reload):

```bash
npm run dev
````

**Production**:

```bash
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "healthy",
    "uptime": 42.123,
    "timestamp": "2024-01-19T10:30:00.000Z"
  },
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

### Create Item (Example with Validation)

```
POST /api/items
Content-Type: application/json

{
  "name": "Example Item",
  "description": "Optional description"
}
```

## Response Format

All API responses follow a consistent format:

**Success**:

```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

**Error**:

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

**Validation Error**:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required",
      "code": "too_small"
    }
  ],
  "timestamp": "2024-01-19T10:30:00.000Z"
}
```

## Creating New Endpoints

1. Create controller in `src/modules/<feature>/controller.js`:

```javascript
import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";

export const myHandlerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const myHandler = (req, res) => {
  const { name } = req.validatedData.body;
  sendSuccess(res, { name }, 200, "Success");
};
```

2. Add route in `src/routes.js`:

```javascript
import { myHandler, myHandlerSchema } from "./modules/feature/controller.js";

router.post("/feature", validateRequest(myHandlerSchema), myHandler);
```

## Error Handling

The app includes comprehensive error handling:

- **Zod Validation Errors** - Automatically formatted with field-level errors
- **Custom Errors** - Use `AppError` for application-specific errors
- **Unhandled Rejections** - Caught and logged, then process exits
- **Uncaught Exceptions** - Caught and logged, then process exits

## Logging

Use the logger throughout your code:

```javascript
import { logger } from "./utils/logger.js";

logger.debug("Debug message", { data: true });
logger.info("Info message", { data: true });
logger.warn("Warning message", { data: true });
logger.error("Error message", { data: true });
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` for your domain
- [ ] Set appropriate `LOG_LEVEL`
- [ ] Add database connection
- [ ] Implement authentication middleware
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Set up monitoring
- [ ] Configure reverse proxy (nginx/apache)

## License

ISC
