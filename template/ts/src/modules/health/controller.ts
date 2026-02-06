import { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.ts";
import { asyncHandler } from "../../middlewares/errorHandler.ts";

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */
export const getHealth = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      status: "healthy" as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    200,
    "Service is healthy",
  );
});

/**
 * Example POST endpoint with validation
 * Demonstrates proper error handling with Zod validation
 */
export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
  }),
});

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     description: Example endpoint demonstrating validation with Zod
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
export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createItemSchema.parse({ body: req.body });
  const { name, description } = parsed.body;

  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 10));

  sendSuccess(
    res,
    {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: description || null,
      createdAt: new Date().toISOString(),
    },
    201,
    "Item created successfully",
  );
});
