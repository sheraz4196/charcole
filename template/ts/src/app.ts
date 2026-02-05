import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { userRepo } from "./repositories/user.repo.ts";
import { env } from "./config/env.ts";
import { requestLogger } from "./middlewares/requestLogger.ts";
import {
  errorHandler,
  asyncHandler,
  NotFoundError,
} from "./middlewares/errorHandler.ts";
import { sendSuccess } from "./utils/response.ts";
import { logger } from "./utils/logger.ts";
import routes from "./routes/index.ts";
import swaggerOptions from "./config/swagger.config.ts";
import { setupSwagger } from "@charcole/swagger";

export const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(env.REQUEST_TIMEOUT);
  res.setTimeout(env.REQUEST_TIMEOUT);
  next();
});

app.use(requestLogger);

setupSwagger(app, swaggerOptions);

app.use("/api", routes);

app.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(
      res,
      {
        message: "Welcome to Charcole API",
        version: "2.0.0",
        environment: env.NODE_ENV,
      },
      200,
      "API is online",
    );
  }),
);

app.use((req: Request) => {
  throw new NotFoundError(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
  });
});

app.use(errorHandler);

logger.info("Express app configured successfully");
app.locals.userRepo = userRepo;
