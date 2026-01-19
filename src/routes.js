import { Router } from "express";
import {
  getHealth,
  createItem,
  createItemSchema,
} from "./modules/health/controller.js";
import { validateRequest } from "./middlewares/validateRequest.js";

const router = Router();

// Health check
router.get("/health", getHealth);

// Example: Create item with validation
router.post("/items", validateRequest(createItemSchema), createItem);

export default router;
