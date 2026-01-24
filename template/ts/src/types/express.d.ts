import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      validatedData?: Record<string, any>;
    }
  }
}
