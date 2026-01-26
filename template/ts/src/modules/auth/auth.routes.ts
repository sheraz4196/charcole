import { Router } from "express";
import { AuthController } from "./auth.controller.ts";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

export default router;
