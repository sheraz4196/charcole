import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";

export function setupSwagger(app, options = {}) {
  const defaultOptions = {
    title: "Charcole API",
    version: "1.0.0",
    description: "Auto-generated API documentation",
    path: "/api-docs",
    servers: [{ url: "http://localhost:3000", description: "Local server" }],
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

  const openApiSpec = swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter your JWT token in the format: your-token-here",
          },
        },
      },
    },
    apis: apiPaths,
  });

  app.use(config.path, swaggerUi.serve, swaggerUi.setup(openApiSpec));

  console.log(
    `✅ Swagger UI available at http://localhost:${process.env.PORT || 3000}${config.path}`,
  );

  return openApiSpec;
}
