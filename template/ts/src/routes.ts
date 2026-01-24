import { Router } from "express";

import {
  getHealth,
  createItem,
  createItemSchema,
} from "./modules/health/controller.js";
import { validateRequest } from "./middlewares/validateRequest.js";

const router = Router();

router.get("/health", getHealth);

router.post("/items", validateRequest(createItemSchema), createItem);

export default router;
