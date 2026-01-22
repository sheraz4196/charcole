import { Router } from "express";

import {
  getHealth,
  createItem,
  createItemSchema,
} from "./modules/health/controller";
import { validateRequest } from "./middlewares/validateRequest";

const router = Router();

router.get("/health", getHealth);

router.post("/items", validateRequest(createItemSchema), createItem);

export default router;
