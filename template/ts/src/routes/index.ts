import { Router } from "express";
import {
  getHealth,
  createItem,
  createItemSchema,
} from "../modules/health/controller.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import protectedRoutes from "./protected.ts";
import authRoutes from "../modules/auth/auth.routes.ts";
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
