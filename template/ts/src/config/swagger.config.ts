import { registerSchema, loginSchema } from "../modules/auth/auth.schemas.ts";
import { createItemSchema } from "../modules/health/controller.ts";

const swaggerConfig = {
  title: process.env.APP_NAME || "Charcole API",
  version: process.env.APP_VERSION || "1.0.0",
  description: "Production-ready Node.js Express API",
  path: "/api-docs",
  servers: [
    {
      url: process.env.APP_URL || "http://localhost:3000",
      description:
        process.env.NODE_ENV === "production"
          ? "Production server"
          : "Development server",
    },
  ],
  // NEW: Auto-register Zod schemas - no more manual duplication!
  schemas: {
    registerSchema,
    loginSchema,
    createItemSchema,
  },
  // Common response templates are included by default
  includeCommonResponses: true,
};

export type SwaggerConfig = typeof swaggerConfig;

export default swaggerConfig;
