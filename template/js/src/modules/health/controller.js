import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

/**
 * Health check endpoint
 * Always returns healthy status (ping endpoint)
 */
export const getHealth = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    {
      status: "healthy",
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

export const createItem = asyncHandler(async (req, res) => {
  const { name, description } = req.validatedData.body;

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
