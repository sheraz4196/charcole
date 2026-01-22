import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger";
import {
  errorHandler,
  asyncHandler,
  NotFoundError,
} from "./middlewares/errorHandler";
import { sendSuccess } from "./utils/response";
import { logger } from "./utils/logger";
import routes from "./routes";

export const app = express();

// Trust proxy (important for prod / reverse proxies)
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request timeout
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(env.REQUEST_TIMEOUT);
  res.setTimeout(env.REQUEST_TIMEOUT);
  next();
});

// Request logging
app.use(requestLogger);

// API routes
app.use("/api", routes);

// Root endpoint
app.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(
      res,
      {
        message: "Welcome to Charcole API",
        version: "1.0.0",
        environment: env.NODE_ENV,
      },
      200,
      "API is online",
    );
  }),
);

// 404 handler
app.use((req: Request) => {
  throw new NotFoundError(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

logger.info("Express app configured successfully");
