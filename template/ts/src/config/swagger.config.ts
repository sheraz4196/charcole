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
};

export type SwaggerConfig = typeof swaggerConfig;

export default swaggerConfig;
