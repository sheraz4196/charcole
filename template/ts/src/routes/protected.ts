import { Router } from "express";
import { requireAuth } from "../modules/auth/auth.middlewares.ts";

const router = Router();

/**
 * @swagger
 * /api/protected/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's information
 *     tags:
 *       - Protected
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are authenticated
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user_123abc
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

export default router;
