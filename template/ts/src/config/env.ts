import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGIN: z.string().default("*"),
  REQUEST_TIMEOUT: z.coerce.number().default(30000),
});

type EnvSchema = z.infer<typeof envSchema>;

const parseEnv = (): EnvSchema => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error("❌ Failed to parse environment variables:", error);
    }
    process.exit(1);
  }
};

const parsedEnv = parseEnv();

export const env = {
  ...parsedEnv,
  isDevelopment: parsedEnv.NODE_ENV === "development",
  isProduction: parsedEnv.NODE_ENV === "production",
  isTest: parsedEnv.NODE_ENV === "test",
} as const;

export type Env = typeof env;
