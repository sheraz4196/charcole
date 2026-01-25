import { Router } from "express";
import {
  getHealth,
  createItem,
  createItemSchema,
} from "../modules/health/controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { requireAuth } from "../modules/auth/auth.middlewares.js";
import protectedRoutes from "./protected.js";
import authRoutes from "../modules/auth/auth.routes.js";
const router = Router();

// Health check
router.get("/health", getHealth);

// Example: Create item with validation
router.post("/items", validateRequest(createItemSchema), createItem);

// 🔐 Auth routes
router.use("/auth", authRoutes);

// 🔐 Protected routes (REQUIRED BEARER TOKEN FOR THEM)
router.use("/protected", protectedRoutes);

export default router;
