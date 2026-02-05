import { z } from "zod";
import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";

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
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     uptime:
 *                       type: number
 *                       example: 123.45
 *                     timestamp:
 *                       type: string
 *                       format: date-time
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
 *                 example: This is an example item
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Item created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: abc123def
 *                     name:
 *                       type: string
 *                       example: My Item
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: This is an example item
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 */
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
