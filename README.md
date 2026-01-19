# Charcole API

A production-grade Node.js Express API with Zod validation, structured logging, and comprehensive error handling.

## Features

- ✅ **Express.js** - Fast and minimalist web framework
- ✅ **Zod** - TypeScript-first schema validation with static type inference
- ✅ **Environment Validation** - Validate env vars at startup with Zod
- ✅ **Structured Logging** - Color-coded logs with levels (debug, info, warn, error)
- ✅ **Error Handling** - Global error handler with custom error classes
- ✅ **CORS** - Configurable cross-origin resource sharing
- ✅ **Request Validation** - Middleware for body, query, and params validation
- ✅ **Graceful Shutdown** - Proper cleanup on SIGTERM/SIGINT
- ✅ **Unhandled Exception Handling** - Catches uncaught errors and rejections

## Project Structure

```
src/
├── config/
│   ├── env.js              # Environment validation with Zod
│   └── constants.js        # HTTP status codes and error messages
├── middlewares/
│   ├── errorHandler.js     # Global error handling
│   ├── validateRequest.js  # Request validation middleware
│   └── requestLogger.js    # Request logging
├── modules/
│   └── items/
│       └── controller.js   # Example module with handlers
├── utils/
│   ├── logger.js           # Structured logging utility
│   └── response.js         # Standardized response helpers
├── app.js                  # Express app setup
├── routes.js               # API routes
└── server.js               # Server entry point
```

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development        # development, production, test
PORT=3000                   # Server port
LOG_LEVEL=info              # debug, info, warn, error
CORS_ORIGIN=*               # CORS origin
REQUEST_TIMEOUT=30000       # Request timeout in ms
```

## Running

**Development** (with auto-reload):

```bash
npm run dev
```

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
