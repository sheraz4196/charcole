import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import { registerSchemas, getCommonResponses } from "./helpers.js";

export function setupSwagger(app, options = {}) {
  const defaultOptions = {
    title: "Charcole API",
    version: "1.0.0",
    description: "Auto-generated API documentation",
    path: "/api-docs",
    servers: [{ url: "http://localhost:3000", description: "Local server" }],
    // NEW: Auto-register Zod schemas
    schemas: {},
    // NEW: Include common response templates
    includeCommonResponses: true,
    // NEW: Custom response schemas
    customResponses: {},
  };

  const config = { ...defaultOptions, ...options };

  // Detect if running TypeScript or JavaScript by checking if src directory has .ts files
  const srcPath = path.join(process.cwd(), "src");
  const hasSrcDir = fs.existsSync(srcPath);

  let isTypeScript = false;
  if (hasSrcDir) {
    // Check if there are any .ts files in src directory
    const files = fs.readdirSync(srcPath);
    isTypeScript = files.some((file) => file.endsWith(".ts"));
  }

  // Determine file extensions to scan
  const fileExtension = isTypeScript ? "ts" : "js";

  // Build API paths based on project structure
  const apiPaths = [
    `${process.cwd()}/src/modules/**/*.${fileExtension}`,
    `${process.cwd()}/src/routes/**/*.${fileExtension}`,
  ];

  // NEW: Build components with auto-registered schemas
  const components = {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: your-token-here",
      },
    },
    schemas: {},
    responses: {},
  };

  // NEW: Register Zod schemas if provided
  if (config.schemas && Object.keys(config.schemas).length > 0) {
    try {
      const registeredSchemas = registerSchemas(config.schemas);
      components.schemas = { ...registeredSchemas };
      console.log(
        `✅ Auto-registered ${Object.keys(registeredSchemas).length} Zod schemas`,
      );
    } catch (error) {
      console.warn("⚠️  Failed to register some Zod schemas:", error.message);
    }
  }

  // NEW: Add common response templates
  if (config.includeCommonResponses) {
    components.responses = {
      ...getCommonResponses(),
      ...config.customResponses,
    };
  }

  const openApiSpec = swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers,
      components,
    },
    apis: apiPaths,
  });

  app.use(config.path, swaggerUi.serve, swaggerUi.setup(openApiSpec));

  console.log(
    `✅ Swagger UI available at http://localhost:${process.env.PORT || 3000}${config.path}`,
  );

  return openApiSpec;
}
