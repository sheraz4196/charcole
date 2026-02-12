# Swagger Documentation Guide

**@charcoles/swagger** - Effortless API documentation that eliminates duplication and dramatically reduces manual work.

## 🎯 What's New

The new @charcoles/swagger **automatically generates API schemas from your Zod validations**, eliminating the need to write the same schema twice. You now write **60-80% less documentation** while keeping perfect synchronization between your validation logic and API docs.

## 🚀 Quick Start

### 1. Register Your Zod Schemas (One-Time Setup)

In `src/config/swagger.config.ts`, import and register your Zod schemas:

```typescript
import { registerSchema, loginSchema } from "../modules/auth/auth.schemas.ts";
import { createItemSchema } from "../modules/health/controller.ts";

const swaggerConfig = {
  title: "My API",
  version: "1.0.1",
  // Auto-register schemas - they'll be  converted to OpenAPI automatically!
  schemas: {
    registerSchema,
    loginSchema,
    createItemSchema,
  },
};

export default swaggerConfig;
```

That's it! Your Zod schemas are now available as `$ref` in Swagger.

### 2. Use Schema References in Your Routes

**Before (Old Way - 76 lines):**

```typescript
/**
 * @swagger
 * /api/items:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: My Item
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   ... 50 more lines
 */
```

**After (New Way - 16 lines):**

```typescript
/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     tags:
 *       - Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createItemSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
```

**Result:** 60 lines eliminated! And your schema stays in sync automatically.

---

## 📚 Complete Examples

### Example 1: Simple GET Endpoint

```typescript
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */
export const getHealth = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: "healthy" }, 200, "Service is healthy");
});
```

**Just 9 lines!** Common responses like `Success`, `ValidationError`, `Unauthorized` are included automatically.

### Example 2: POST with Zod Validation

**Step 1:** Define your Zod schema (you're already doing this for validation):

```typescript
// src/modules/items/items.schemas.ts
export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    price: z.number().positive(),
  }),
});
```

**Step 2:** Register it in `swagger.config.ts`:

```typescript
import { createItemSchema } from "../modules/items/items.schemas.ts";

const swaggerConfig = {
  // ...
  schemas: {
    createItemSchema, // Auto-converted to OpenAPI!
  },
};
```

**Step 3:** Reference it in your endpoint:

```typescript
/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     tags:
 *       - Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createItemSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/items", createItem);
```

**No duplication!** Change your Zod schema once, and Swagger updates automatically.

### Example 3: Protected Endpoint with Authentication

```typescript
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
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/profile", requireAuth, getProfile);
```

### Example 4: Path Parameters

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", getUserById);
```

### Example 5: Query Parameters (Pagination, Filtering)

```typescript
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Search products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */
router.get("/products", getProducts);
```

---

## 🎁 Built-in Response Templates

These responses are **automatically available** - no configuration needed:

| Response Name     | Status  | When to Use                       |
| ----------------- | ------- | --------------------------------- |
| `Success`         | 200/201 | Successful operations             |
| `ValidationError` | 400     | Request validation failures       |
| `Unauthorized`    | 401     | Missing or invalid authentication |
| `Forbidden`       | 403     | Insufficient permissions          |
| `NotFound`        | 404     | Resource not found                |
| `InternalError`   | 500     | Server errors                     |

Use them with `$ref`:

```yaml
responses:
  200:
    $ref: "#/components/responses/Success"
  400:
    $ref: "#/components/responses/ValidationError"
```

---

## 🔧 Advanced Features

### Custom Response Schemas

If you need custom responses beyond the built-in ones:

```typescript
// In swagger.config.ts
const swaggerConfig = {
  // ...
  customResponses: {
    UserCreated: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              userId: { type: "string" },
              token: { type: "string" },
            },
          },
        },
      },
    },
  },
};
```

Then use it:

```yaml
responses:
  201:
    $ref: "#/components/responses/UserCreated"
```

### Helper Functions for Programmatic Documentation

For advanced use cases, you can use helper functions:

```typescript
import { convertZodToOpenAPI, endpoint } from "@charcoles/swagger";

// Convert a single Zod schema to JSON Schema
const jsonSchema = convertZodToOpenAPI(myZodSchema, "MySchema");

// Create endpoint documentation programmatically
const apiDef = endpoint("POST", "/api/users", {
  summary: "Create user",
  schema: "createUserSchema",
  responseSchema: "Success",
  security: true,
});
```

---

## 📖 Migration Guide

### Migrating from Old JSDoc Approach

**Old (Manual Schema):**

```typescript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 */
```

**New (Schema Reference):**

```typescript
// 1. Register the schema in swagger.config.ts
schemas: {
  registerSchema,  // Already defined in auth.schemas.ts
}

// 2. Use reference in JSDoc
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/registerSchema'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
```

---

## ✅ Best Practices

1. **Always register schemas in swagger.config.ts**
   - One central place for all schema registrations
   - Easy to see what's documented

2. **Use built-in response templates**
   - Consistency across your API
   - Less code to maintain

3. **Keep Zod schemas colocated with modules**
   - `modules/auth/auth.schemas.ts`
   - `modules/users/users.schemas.ts`

4. **Name schemas descriptively**
   - ✅ `createUserSchema`, `updateUserSchema`
   - ❌ `schema1`, `userSchema`

5. **One schema definition = One source of truth**
   - Define in Zod for validation
   - Auto-generate for Swagger
   - Never duplicate!

---

## 🆚 Comparison: Before vs After

| Aspect                 | Before            | After          | Improvement        |
| ---------------------- | ----------------- | -------------- | ------------------ |
| **Lines per endpoint** | 45-76 lines       | 10-20 lines    | **60-75% less**    |
| **Schema duplication** | Zod + Manual YAML | Zod only       | **0% duplication** |
| **Maintenance**        | Update 2 places   | Update 1 place | **50% less work**  |
| **Sync issues**        | Common            | Impossible     | **Always in sync** |
| **Response templates** | Copy-paste        | Built-in       | **Reusable**       |

---

## 🔍 Troubleshooting

### Schema not appearing in Swagger UI?

1. Check that the schema is imported in `swagger.config.ts`
2. Restart your server (schemas are loaded at startup)
3. Check browser console for errors

### Zod schema not converting correctly?

- Ensure you're using `zod-to-json-schema` compatible Zod features
- Complex transforms may not convert perfectly
- Use simpler Zod primitives when possible

### Want to see raw OpenAPI spec?

Visit `/api-docs.json` (if enabled) or check the console logs on startup.

---

## 📦 Using @charcoles/swagger in Non-Charcole Projects

Even if you didn't create your project with `create-charcole`, you can still use @charcoles/swagger!

```bash
npm install @charcoles/swagger zod
```

```typescript
import express from "express";
import { setupSwagger } from "@charcoles/swagger";
import { mySchema } from "./schemas";

const app = express();

setupSwagger(app, {
  title: "My API",
  version: "1.0.1",
  schemas: {
    mySchema, // Your Zod schemas
  },
});

app.listen(3000);
```

Works with any Express.js project!

---

## 🎓 Quick Reference

### Minimal Endpoint (GET)

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Short description
 *     tags: [Tag]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */
```

### With Request Body (POST/PUT/PATCH)

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     summary: Short description
 *     tags: [Tag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/schemaName'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
```

### Protected Endpoint

```typescript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
```

---

## 💡 Need Help?

Check the examples in:

- `src/modules/health/controller.ts` - GET/POST examples
- `src/modules/auth/auth.routes.ts` - Authentication endpoints
- `src/config/swagger.config.ts` - Schema registration

**Test your documentation:**

1. Start server: `npm start`
2. Visit: `http://localhost:3000/api-docs`
3. Try out endpoints directly in Swagger UI!

---

**Remember:** With @charcoles/swagger, you define your schemas once in Zod, and documentation happens automatically. No more duplication, no more sync issues, dramatically less effort! 🎉
