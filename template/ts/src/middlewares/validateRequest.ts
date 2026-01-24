import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../utils/AppError.js";

/**
 * Request validation middleware
 *
 * Validates request body, query, and params against a Zod schema
 * Throws ValidationError if validation fails
 *
 * Example:
 * const schema = z.object({
 *   body: z.object({ name: z.string() }),
 *   query: z.object({ page: z.coerce.number().optional() }),
 * });
 *
 * router.post('/items', validateRequest(schema), handler)
 */
export const validateRequest = (schema: z.AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
          code: e.code,
        }));
        throw new ValidationError("Request validation failed", errors);
      }
      next(error);
    }
  };
};
