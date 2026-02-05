import { Application } from "express";

export interface SwaggerServer {
  url: string;
  description: string;
}

export interface SwaggerOptions {
  title?: string;
  version?: string;
  description?: string;
  path?: string;
  servers?: SwaggerServer[];
}

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: SwaggerServer[];
  components: {
    securitySchemes: {
      bearerAuth: {
        type: string;
        scheme: string;
        bearerFormat: string;
        description: string;
      };
    };
  };
  paths?: Record<string, any>;
}

export function setupSwagger(
  app: Application,
  options?: SwaggerOptions,
): OpenAPISpec;
