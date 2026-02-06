import { Application } from "express";
import { ZodType, ZodSchema } from "zod";

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
  // NEW: Auto-register Zod schemas
  schemas?: Record<string, ZodType<any>>;
  // NEW: Include common response templates (default: true)
  includeCommonResponses?: boolean;
  // NEW: Custom response schemas
  customResponses?: Record<string, any>;
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
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
  };
  paths?: Record<string, any>;
}

export function setupSwagger(
  app: Application,
  options?: SwaggerOptions,
): OpenAPISpec;

// Helper functions
export interface EndpointParameter {
  in: "path" | "query" | "header";
  name: string;
  required?: boolean;
  type?: string;
  description?: string;
}

export interface EndpointOptions {
  summary: string;
  description?: string;
  tags?: string[];
  schema?: string;
  responseSchema?: string;
  security?: boolean;
  params?: EndpointParameter[];
}

export interface SwaggerDocOptions {
  method: string;
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  requestSchema?: string;
  responseSchemaName?: string;
  security?: boolean;
  parameters?: EndpointParameter[];
}

/**
 * Convert Zod schema to OpenAPI JSON Schema
 */
export function convertZodToOpenAPI(
  zodSchema: ZodType<any>,
  name: string,
): object | null;

/**
 * Extract body schema from a Zod schema that has a .body property
 */
export function extractBodySchema(schema: ZodType<any>): ZodType<any> | null;

/**
 * Get common response schemas (Success, ValidationError, Unauthorized, etc.)
 */
export function getCommonResponses(): Record<string, any>;

/**
 * Detect security requirements from middleware chain
 */
export function detectSecurity(
  middlewares: Function[],
): Array<{ bearerAuth: [] }>;

/**
 * Create a Swagger documentation comment block
 */
export function createSwaggerDoc(options: SwaggerDocOptions): string;

/**
 * Register Zod schemas for auto-documentation
 */
export function registerSchemas(
  schemas: Record<string, ZodType<any>>,
): Record<string, any>;

/**
 * Simplified API for quick endpoint documentation
 */
export function endpoint(
  method: string,
  path: string,
  options?: EndpointOptions,
): Record<string, any>;
