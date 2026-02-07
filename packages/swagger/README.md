# @charcoles/swagger

Effortless API documentation for Express.js applications. Automatically generates OpenAPI 3.0 specs from your Zod validation schemas.

## Features

✨ **Zero Schema Duplication** - Define schemas once in Zod, use everywhere
🚀 **60-80% Less Code** - Minimal documentation overhead
🔄 **Always In Sync** - Impossible to have outdated docs
📦 **Built-in Templates** - Common response schemas included
🎯 **Framework Agnostic** - Works with any Express.js project
💪 **TypeScript First** - Full type safety with optional JavaScript support

## Installation

```bash
npm install @charcoles/swagger zod
```

## Quick Start

### 1. Setup Swagger in your Express app

```typescript
import express from "express";
import { setupSwagger } from "@charcoles/swagger";
import { createUserSchema, loginSchema } from "./schemas";

const app = express();

setupSwagger(app, {
  title: "My API",
  version: "1.0.0",
  schemas: {
    createUserSchema, // Auto-converted from Zod!
    loginSchema,
  },
});

app.listen(3000);
// Swagger UI now available at http://localhost:3000/api-docs
```

### 2. Document your endpoints

**Traditional Way (Manual Schema - 76 lines):**

```typescript
/**
 * @swagger
 * /api/users:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               ... 50+ more lines
 */
router.post("/users", createUser);
```

**With @charcoles/swagger (16 lines):**

```typescript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createUserSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/users", createUser);
```

## API Reference

### `setupSwagger(app, options)`

Sets up Swagger UI and documentation generation.

#### Options

| Option                   | Type    | Default                            | Description                         |
| ------------------------ | ------- | ---------------------------------- | ----------------------------------- |
| `title`                  | string  | "Charcole API"                     | API title                           |
| `version`                | string  | "1.0.0"                            | API version                         |
| `description`            | string  | "Auto-generated API documentation" | API description                     |
| `path`                   | string  | "/api-docs"                        | Swagger UI path                     |
| `servers`                | array   | `[{url: "http://localhost:3000"}]` | Server URLs                         |
| `schemas`                | object  | `{}`                               | Zod schemas to auto-register        |
| `includeCommonResponses` | boolean | `true`                             | Include built-in response templates |
| `customResponses`        | object  | `{}`                               | Additional custom response schemas  |

#### Example

```typescript
setupSwagger(app, {
  title: "My E-commerce API",
  version: "2.0.0",
  description: "Production-ready REST API for e-commerce",
  path: "/docs",
  servers: [
    { url: "https://api.example.com", description: "Production" },
    { url: "http://localhost:3000", description: "Development" },
  ],
  schemas: {
    createProductSchema,
    updateProductSchema,
    orderSchema,
  },
  customResponses: {
    ProductCreated: {
      description: "Product created successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              productId: { type: "string" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  },
});
```

### Built-in Response Templates

The following responses are automatically available:

- `Success` (200/201) - Standard success response
- `ValidationError` (400) - Request validation failures
- `Unauthorized` (401) - Authentication failures
- `Forbidden` (403) - Permission denied
- `NotFound` (404) - Resource not found
- `InternalError` (500) - Server errors

Use them with `$ref`:

```yaml
responses:
  200:
    $ref: "#/components/responses/Success"
  400:
    $ref: "#/components/responses/ValidationError"
```

### Helper Functions

#### `convertZodToOpenAPI(zodSchema, name)`

Converts a Zod schema to OpenAPI 3.0 JSON Schema.

```typescript
import { convertZodToOpenAPI } from "@charcoles/swagger";
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const openApiSchema = convertZodToOpenAPI(userSchema, "User");
```

#### `registerSchemas(schemas)`

Registers multiple Zod schemas at once.

```typescript
import { registerSchemas } from "@charcoles/swagger";

const components = registerSchemas({
  createUserSchema,
  updateUserSchema,
  loginSchema,
});
```

#### `getCommonResponses()`

Returns all built-in response templates.

```typescript
import { getCommonResponses } from "@charcoles/swagger";

const responses = getCommonResponses();
// { Success: {...}, ValidationError: {...}, Unauthorized: {...}, ... }
```

## Integration with Zod

@charcoles/swagger seamlessly integrates with your Zod validation schemas:

```typescript
// Define schema once
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

// Register in swagger config
setupSwagger(app, {
  schemas: { createUserSchema },
});

// Use in controller with validation
const createUser = async (req, res) => {
  const { body } = createUserSchema.parse({ body: req.body });
  // Your logic here
};

// Reference in documentation
/**
 * @swagger
 * /api/users:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createUserSchema'
 */
```

**Single source of truth!** Change your Zod schema, and both validation and documentation update automatically.

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import { setupSwagger, SwaggerOptions, OpenAPISpec } from "@charcoles/swagger";
import type { Application } from "express";

const app: Application = express();

const options: SwaggerOptions = {
  title: "My API",
  version: "1.0.0",
  schemas: {
    mySchema,
  },
};

const spec: OpenAPISpec = setupSwagger(app, options);
```

## JavaScript Support

Works perfectly with JavaScript projects too:

```javascript
const express = require("express");
const { setupSwagger } = require("@charcoles/swagger");
const { z } = require("zod");

const app = express();

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

setupSwagger(app, {
  title: "My JavaScript API",
  schemas: { userSchema },
});
```

## Examples

### Complete CRUD API

```typescript
import { z } from "zod";
import { setupSwagger } from "@charcoles/swagger";

// Define schemas
const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    published: z.boolean().default(false),
  }),
});

const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    published: z.boolean().optional(),
  }),
});

// Setup Swagger
setupSwagger(app, {
  title: "Blog API",
  schemas: {
    createPostSchema,
    updatePostSchema,
  },
});

// Document routes
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createPostSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/updatePostSchema'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
```

## Benefits

### Before @charcoles/swagger

```typescript
// Zod schema (for validation)
const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
  }),
});

// Swagger docs (manual duplication - 45 lines)
/**
 * @swagger
 * /api/users:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 ... 20+ more lines
 */
```

**Problems:**

- ❌ Schema defined twice
- ❌ 45+ lines of docs per endpoint
- ❌ Easy to get out of sync
- ❌ Copy-paste errors
- ❌ High maintenance burden

### After @charcoles/swagger

```typescript
// Zod schema (single source of truth)
const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
  }),
});

// Register once
setupSwagger(app, {
  schemas: { createUserSchema },
});

// Reference in docs (15 lines)
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createUserSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
```

**Benefits:**

- ✅ Schema defined once
- ✅ 15 lines of docs (70% reduction)
- ✅ Always in sync (impossible to drift)
- ✅ No duplication
- ✅ Easy to maintain

## Comparison

| Feature                 | @charcoles/swagger | swagger-jsdoc | tsoa   | NestJS |
| ----------------------- | ------------------ | ------------- | ------ | ------ |
| **Zero duplication**    | ✅                 | ❌            | ✅     | ✅     |
| **Framework agnostic**  | ✅                 | ✅            | ❌     | ❌     |
| **JavaScript support**  | ✅                 | ✅            | ❌     | ❌     |
| **Auto Zod conversion** | ✅                 | ❌            | ❌     | ⚠️     |
| **No build step**       | ✅                 | ✅            | ❌     | ✅     |
| **Lines of code**       | Very Low           | High          | Low    | Medium |
| **Learning curve**      | Easy               | Easy          | Medium | High   |

## Troubleshooting

### Schema not appearing in Swagger UI?

1. Verify the schema is imported in your config
2. Restart your server
3. Check console for errors during startup

### Zod schema not converting correctly?

- Use standard Zod primitives when possible
- Avoid complex `.transform()` or `.refine()` for documented schemas
- Check that `zod-to-json-schema` supports your Zod features

### Want more control?

Use the helper functions for custom conversions:

```typescript
import { convertZodToOpenAPI } from "@charcoles/swagger";

const customSchema = convertZodToOpenAPI(myZodSchema, "MySchema");
// Modify customSchema as needed
```

## License

ISC

## Author

Sheraz Manzoor

## Contributing

Issues and PRs welcome at [https://github.com/your-repo/charcole](https://github.com/your-repo/charcole)

---

**@charcoles/swagger** - Because life's too short to write schemas twice. 🎉
