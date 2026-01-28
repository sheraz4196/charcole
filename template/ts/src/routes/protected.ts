import { Router } from "express";
import { requireAuth } from "../modules/auth/auth.middlewares.ts";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

export default router;
