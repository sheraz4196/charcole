import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Convert Zod schema to OpenAPI JSON Schema
 * @param {import('zod').ZodType} zodSchema - Zod schema to convert
 * @param {string} name - Schema name for reference
 * @returns {Object} OpenAPI-compatible JSON Schema
 */
export function convertZodToOpenAPI(zodSchema, name) {
  if (!zodSchema) return null;

  try {
    // Convert Zod to JSON Schema
    const jsonSchema = zodToJsonSchema(zodSchema, {
      name,
      target: "openApi3",
      $refStrategy: "none",
    });

    // Remove $schema property as it's not needed in OpenAPI components
    if (jsonSchema.$schema) {
      delete jsonSchema.$schema;
    }

    // Handle case where zodToJsonSchema returns a $ref with definitions
    // This happens with complex nested schemas
    if (jsonSchema.$ref && jsonSchema.definitions) {
      // Extract the actual schema from definitions
      const refName = jsonSchema.$ref.split("/").pop();
      if (jsonSchema.definitions[refName]) {
        const actualSchema = jsonSchema.definitions[refName];
        // Remove $schema from the extracted definition too
        if (actualSchema.$schema) {
          delete actualSchema.$schema;
        }
        return actualSchema;
      }
    }

    // Remove definitions if present (OpenAPI handles these at component level)
    if (jsonSchema.definitions) {
      delete jsonSchema.definitions;
    }

    return jsonSchema;
  } catch (error) {
    console.warn(`Failed to convert Zod schema "${name}":`, error.message);
    return null;
  }
}

/**
 * Extract body schema from a Zod schema that has a .body property
 * Common pattern: z.object({ body: z.object({ ... }) })
 * @param {import('zod').ZodType} schema - Zod schema
 * @returns {import('zod').ZodType|null} Body schema if found
 */
export function extractBodySchema(schema) {
  if (!schema) return null;

  try {
    // Check if schema has a .body property (common pattern)
    if (schema._def && schema._def.shape && schema._def.shape().body) {
      return schema._def.shape().body;
    }
  } catch (error) {
    // If extraction fails, return original schema
  }

  return schema;
}

/**
 * Generate common response schemas
 * @returns {Object} OpenAPI response components
 */
export function getCommonResponses() {
  return {
    Success: {
      description: "Success",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              message: {
                type: "string",
                example: "Operation successful",
              },
              data: {
                type: "object",
              },
            },
          },
        },
      },
    },
    ValidationError: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false,
              },
              message: {
                type: "string",
                example: "Validation failed",
              },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                    },
                    message: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    Unauthorized: {
      description: "Unauthorized - Invalid or missing token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false,
              },
              message: {
                type: "string",
                example: "Unauthorized",
              },
            },
          },
        },
      },
    },
    Forbidden: {
      description: "Forbidden - Insufficient permissions",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false,
              },
              message: {
                type: "string",
                example: "Forbidden",
              },
            },
          },
        },
      },
    },
    NotFound: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false,
              },
              message: {
                type: "string",
                example: "Resource not found",
              },
            },
          },
        },
      },
    },
    InternalError: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false,
              },
              message: {
                type: "string",
                example: "Internal server error",
              },
            },
          },
        },
      },
    },
  };
}

/**
 * Detect security requirements from middleware chain
 * @param {Array} middlewares - Array of middleware functions
 * @returns {Array} Security requirements
 */
export function detectSecurity(middlewares) {
  if (!Array.isArray(middlewares)) return [];

  const securityRequirements = [];

  for (const middleware of middlewares) {
    const name = middleware.name || "";

    // Check for authentication middleware
    if (
      name.includes("auth") ||
      name.includes("Auth") ||
      name.includes("requireAuth") ||
      name.includes("authenticate") ||
      name.includes("jwt") ||
      name.includes("JWT")
    ) {
      securityRequirements.push({ bearerAuth: [] });
      break; // Only add once
    }
  }

  return securityRequirements;
}

/**
 * Create a minimal Swagger doc helper
 * Generates a @swagger comment block from simple options
 * @param {Object} options - Documentation options
 * @returns {string} JSDoc comment block
 */
export function createSwaggerDoc(options) {
  const {
    method = "get",
    path,
    summary,
    description,
    tags = [],
    requestSchema,
    responseSchemaName,
    security = false,
    parameters = [],
  } = options;

  let doc = `/**\n * @swagger\n * ${path}:\n *   ${method.toLowerCase()}:\n`;

  if (summary) {
    doc += ` *     summary: ${summary}\n`;
  }

  if (description) {
    doc += ` *     description: ${description}\n`;
  }

  if (tags.length > 0) {
    doc += ` *     tags:\n`;
    tags.forEach((tag) => {
      doc += ` *       - ${tag}\n`;
    });
  }

  if (security) {
    doc += ` *     security:\n *       - bearerAuth: []\n`;
  }

  if (parameters.length > 0) {
    doc += ` *     parameters:\n`;
    parameters.forEach((param) => {
      doc += ` *       - in: ${param.in}\n`;
      doc += ` *         name: ${param.name}\n`;
      if (param.required) {
        doc += ` *         required: true\n`;
      }
      doc += ` *         schema:\n`;
      doc += ` *           type: ${param.type || "string"}\n`;
      if (param.description) {
        doc += ` *         description: ${param.description}\n`;
      }
    });
  }

  if (
    requestSchema &&
    (method === "post" || method === "put" || method === "patch")
  ) {
    doc += ` *     requestBody:\n`;
    doc += ` *       required: true\n`;
    doc += ` *       content:\n`;
    doc += ` *         application/json:\n`;
    doc += ` *           schema:\n`;
    doc += ` *             $ref: '#/components/schemas/${requestSchema}'\n`;
  }

  doc += ` *     responses:\n`;
  if (responseSchemaName) {
    doc += ` *       200:\n`;
    doc += ` *         $ref: '#/components/responses/${responseSchemaName}'\n`;
  } else {
    doc += ` *       200:\n`;
    doc += ` *         description: Success\n`;
  }

  if (method === "post" || method === "put" || method === "patch") {
    doc += ` *       400:\n`;
    doc += ` *         $ref: '#/components/responses/ValidationError'\n`;
  }

  if (security) {
    doc += ` *       401:\n`;
    doc += ` *         $ref: '#/components/responses/Unauthorized'\n`;
  }

  doc += ` */`;

  return doc;
}

/**
 * Register Zod schemas for auto-documentation
 * @param {Object} schemas - Object containing Zod schemas
 * @returns {Object} OpenAPI components schemas
 */
export function registerSchemas(schemas) {
  const components = {};

  for (const [name, schema] of Object.entries(schemas)) {
    if (!schema) continue;

    // Extract body schema if it exists
    const actualSchema = extractBodySchema(schema) || schema;

    // Convert to OpenAPI
    const converted = convertZodToOpenAPI(actualSchema, name);
    if (converted) {
      components[name] = converted;
    }
  }

  return components;
}

/**
 * Simplified API for quick endpoint documentation
 * @param {string} method - HTTP method
 * @param {string} path - Endpoint path
 * @param {Object} options - Documentation options
 * @returns {Object} OpenAPI path object
 */
export function endpoint(method, path, options = {}) {
  const {
    summary,
    description,
    tags = [],
    schema,
    responseSchema,
    security = false,
    params = [],
  } = options;

  const pathItem = {
    summary,
    description,
    tags,
  };

  if (security) {
    pathItem.security = [{ bearerAuth: [] }];
  }

  if (params.length > 0) {
    pathItem.parameters = params;
  }

  if (schema && (method === "post" || method === "put" || method === "patch")) {
    pathItem.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${schema}` },
        },
      },
    };
  }

  pathItem.responses = {
    200: responseSchema
      ? { $ref: `#/components/responses/${responseSchema}` }
      : { description: "Success" },
  };

  if (method === "post" || method === "put" || method === "patch") {
    pathItem.responses["400"] = {
      $ref: "#/components/responses/ValidationError",
    };
  }

  if (security) {
    pathItem.responses["401"] = {
      $ref: "#/components/responses/Unauthorized",
    };
  }

  return { [path]: { [method.toLowerCase()]: pathItem } };
}
