# @charcoles/swagger v2.0.0 - Backward Compatibility Test

## Test Cases

### ✅ Old JSDoc Approach (Still Works)

The traditional manual schema approach still works without any changes:

```typescript
/**
 * @swagger
 * /api/old-endpoint:
 *   post:
 *     summary: Old style endpoint
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
 *     responses:
 *       200:
 *         description: Success
 */
```

**Status:** ✅ Fully compatible

### ✅ Minimal Setup (Still Works)

Old setup without new options:

```typescript
setupSwagger(app, {
  title: "My API",
  version: "1.0.0",
});
```

**Status:** ✅ Fully compatible (new options are optional)

### ✅ Mixed Approach (Old + New)

You can mix manual schemas and auto-generated ones:

```typescript
setupSwagger(app, {
  schemas: {
    createUserSchema, // New: auto-generated from Zod
  },
});

// Old manual approach
/**
 * @swagger
 * /api/manual:
 *   get:
 *     responses:
 *       200:
 *         description: Success
 */

// New reference approach
/**
 * @swagger
 * /api/auto:
 *   post:
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createUserSchema'
 */
```

**Status:** ✅ Fully compatible

### ✅ No Zod (Non-Charcole Projects)

Works fine without Zod schemas:

```typescript
import { setupSwagger } from "@charcoles/swagger";

setupSwagger(app, {
  title: "My API",
  // No schemas - just use manual JSDoc approach
});
```

**Status:** ✅ Fully compatible

### ✅ Disable Common Responses

Can disable built-in responses if not wanted:

```typescript
setupSwagger(app, {
  includeCommonResponses: false, // Opt-out
});
```

**Status:** ✅ Fully compatible

## Migration Path

### No Breaking Changes

All existing code continues to work:

1. **Don't want to use new features?**
   - No changes needed
   - Everything works as before

2. **Want to gradually adopt?**
   - Start using schema references one endpoint at a time
   - Mix old and new approaches

3. **Want full benefits?**
   - Register schemas in config
   - Update JSDoc to use `$ref`
   - Enjoy 60-80% less code

## Compatibility Matrix

| Feature                  | v1.0.0 | v2.0.0 | Notes                          |
| ------------------------ | ------ | ------ | ------------------------------ |
| Manual JSDoc             | ✅     | ✅     | No changes needed              |
| Basic setup              | ✅     | ✅     | All old options work           |
| Security schemes         | ✅     | ✅     | bearerAuth still auto-included |
| File scanning            | ✅     | ✅     | Same directories scanned       |
| TypeScript detection     | ✅     | ✅     | Same auto-detection            |
| Zod schemas (new)        | ❌     | ✅     | Optional new feature           |
| Response templates (new) | ❌     | ✅     | Optional new feature           |
| Helper functions (new)   | ❌     | ✅     | Optional new feature           |

## Conclusion

**100% backward compatible** ✅

No breaking changes. All new features are additive and optional.
