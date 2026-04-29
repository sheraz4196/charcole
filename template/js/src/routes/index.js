import { Router } from "express";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  getHealth,
  createItem,
  createItemSchema,
} from "../modules/health/controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { requireAuth } from "../modules/auth/auth.middlewares.js";
import protectedRoutes from "./protected.js";
import authRoutes from "../modules/auth/auth.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

// Health check
router.get("/health", getHealth);

// Example: Create item with validation
router.post("/items", validateRequest(createItemSchema), createItem);

// 🔐 Auth routes
router.use("/auth", authRoutes);

// Payments routes — only loaded if the payments module was included during scaffolding
const paymentsRoutesPath = join(
  __dirname,
  "../modules/payments/payments.routes.js",
);
if (existsSync(paymentsRoutesPath)) {
  const { default: paymentsRoutes } = await import(paymentsRoutesPath);
  router.use("/payments", paymentsRoutes);
}

// 🔐 Protected routes (REQUIRED BEARER TOKEN FOR THEM)
router.use("/protected", protectedRoutes);

export default router;
