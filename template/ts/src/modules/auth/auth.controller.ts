import { AuthService } from "./auth.service.js";

export const AuthController = {
  async register(req, res) {
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
      res.status(400).json({ message: err.message });
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body, req.app.locals.userRepo);

      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  },
};
