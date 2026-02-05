# Swagger Documentation Guide

This guide explains how to automatically document your APIs in the Swagger UI.

## Overview

All APIs are automatically documented using JSDoc comments with `@swagger` annotations. The swagger documentation is generated from comments in your route and controller files.

## How It Works

The swagger package automatically scans these directories for `@swagger` comments:
- `src/modules/**/*.ts` - All module files (controllers, routes)
- `src/routes/**/*.ts` - All route files

When you add `@swagger` comments to your code, they automatically appear in the Swagger UI at `/api-docs`.

## Basic Example

Here's how to document a simple GET endpoint:

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  // Your implementation
});
```

## POST Endpoint with Request Body

Document POST endpoints with request bodies:

```javascript
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
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
export const createUser = asyncHandler(async (req, res) => {
  // Your implementation
});
```

## Protected Endpoints (Requires Authentication)

For endpoints that require authentication, add the `security` field:

```javascript
/**
 * @swagger
 * /api/protected/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", requireAuth, getProfile);
```

## Path Parameters

Document endpoints with path parameters:

```javascript
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
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);
```

## Query Parameters

Document query parameters for filtering, pagination, etc:

```javascript
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get("/", getProducts);
```

## Important Notes

### 1. **Automatic Discovery**
- Just add `@swagger` comments above your route handlers or in route files
- No configuration needed - it's automatically picked up
- Restart your server to see new documentation

### 2. **Tags**
- Use tags to group related endpoints
- Example: `tags: - Users`, `tags: - Products`
- All endpoints with the same tag are grouped together in Swagger UI

### 3. **Response Schemas**
- Always document the response structure
- Include both success and error responses
- Use realistic examples

### 4. **Request Validation**
- If you're using Zod validation, make sure your swagger docs match the schema
- Document all required fields and their constraints

### 5. **File Location**
- You can add `@swagger` comments in:
  - Controller files (e.g., `src/modules/users/users.controller.js`)
  - Route files (e.g., `src/routes/users.js`)
  - Either location works - choose what's clearest for your project

## Testing Your Documentation

1. Start your server: `npm start`
2. Visit: `http://localhost:3000/api-docs`
3. Try out your APIs directly from the Swagger UI!

## Common Patterns

### Full CRUD Example

```javascript
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Success
 *   post:
 *     summary: Create a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
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
 *         description: Success
 *       404:
 *         description: Not found
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
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
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
 *         description: Deleted
 */
```

## Quick Reference

| Field | Description | Required |
|-------|-------------|----------|
| `summary` | Short description of endpoint | Yes |
| `description` | Detailed description | No |
| `tags` | Group endpoints together | Recommended |
| `security` | Authentication requirement | For protected routes |
| `parameters` | Path/query parameters | If applicable |
| `requestBody` | Request body schema | For POST/PUT/PATCH |
| `responses` | Possible responses | Yes |

## Need Help?

Check out the existing examples in:
- `src/modules/health/controller.js` - Basic GET/POST examples
- `src/modules/auth/auth.routes.js` - Authentication examples
- `src/routes/protected.js` - Protected route example

---

**Remember**: Every time you create a new route, just add a `@swagger` comment above it, and it will automatically appear in the Swagger UI!
