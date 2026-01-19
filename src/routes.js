import { Router } from "express";
import { getHealth } from "./modules/health/controller.js";

const router = Router();

router.get("/health", getHealth);

export default router;
