import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
export function setupSwagger(app, options = {}) {
  const defaultOptions = {
    title: "Charcole API",
    version: "1.0.0",
    description: "Auto-generated API documentation",
    path: "/api-docs",
    servers: [{ url: "http://localhost:3000", description: "Local server" }],
  };

  const config = { ...defaultOptions, ...options };

  const openApiSpec = swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
      },
      servers: config.servers,
    },
    apis: [
      `${process.cwd()}/src/modules/**/*.js`,
      `${process.cwd()}/src/routes/**/*.js`,
    ],
  });

  app.use(config.path, swaggerUi.serve, swaggerUi.setup(openApiSpec));

  console.log(
    `✅ Swagger UI available at http://localhost:${process.env.PORT || 3000}${config.path}`,
  );

  return openApiSpec;
}
