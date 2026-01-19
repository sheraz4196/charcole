import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "./config/constants.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sendError } from "./utils/response.js";
import { logger } from "./utils/logger.js";
import routes from "./routes.js";

export const app = express();

// Trust proxy
app.set("trust proxy", 1);

// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request timeout
app.use((req, res, next) => {
  req.setTimeout(env.REQUEST_TIMEOUT);
  res.setTimeout(env.REQUEST_TIMEOUT);
  next();
});

// Request logging
app.use(requestLogger);

// API Routes
app.use("/api", routes);

// Health check root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Charcole API",
    version: "1.0.0",
    environment: env.NODE_ENV,
  });
});

// 404 handler
app.use((req, res) => {
  sendError(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
});

// Global error handler (must be last)
app.use(errorHandler);

logger.info("Express app configured");
