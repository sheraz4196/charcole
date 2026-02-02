import express from "express";
import { userRepo } from "./repositories/user.repo.js";
import cors from "cors";
import { env } from "./config/env.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "./config/constants.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import {
  errorHandler,
  asyncHandler,
  NotFoundError,
} from "./middlewares/errorHandler.js";
import { sendSuccess } from "./utils/response.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";

export const app = express();
let swaggerSetup = null;
(async () => {
  try {
    const { setupSwagger } = await import("@charcole/swagger");
    const { default: swaggerConfig } =
      await import("./config/swagger.config.js");

    swaggerSetup = setupSwagger(app, swaggerConfig);
    console.log("✅ Swagger documentation enabled at /api-docs");
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "ℹ️  Swagger not installed. To add: npm install @charcole/swagger",
      );
    }
  }
})();

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

// Root health endpoint
app.get(
  "/",
  asyncHandler(async (req, res) => {
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
app.use((req, res, next) => {
  throw new NotFoundError(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
  });
});

// Global error handler (MUST be last)
app.use(errorHandler);

logger.info("Express app configured successfully");

app.locals.userRepo = userRepo;
