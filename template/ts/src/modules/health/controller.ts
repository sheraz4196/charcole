import { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response.ts";
import { asyncHandler } from "../../middlewares/errorHandler.ts";
import { validateRequest } from "../../middlewares/validateRequest.ts";

const healthCheckSchema = z.object({
  query: z.object({}),
  params: z.object({}),
  body: z.object({}),
});

const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

type CreateItemBody = z.infer<typeof createItemSchema>["body"];

/**
 * Health check endpoint
 * Always returns healthy status (ping endpoint)
 */
export const getHealth = [
  validateRequest(healthCheckSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const response = {
      status: "healthy" as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    sendSuccess(res, response, 200, "Service is healthy");
  }),
];

/**
 * Example POST endpoint with validation
 * Demonstrates proper error handling with Zod validation
 */
export const createItem = [
  validateRequest(createItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.validatedData as { body: CreateItemBody };
    const { name, description } = validatedData.body;

    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description: description || null,
      createdAt: new Date().toISOString(),
    };

    sendSuccess(res, response, 201, "Item created successfully");
  }),
];

export { createItemSchema };
