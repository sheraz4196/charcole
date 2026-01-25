import { AuthService } from "./auth.service.js";
import { Request, Response } from "express";

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.register(
        req.body,
        req.app.locals.userRepo,
      );

      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      res.status(400).json({ message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body, req.app.locals.userRepo);

      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      res.status(401).json({ message });
    }
  },
};
