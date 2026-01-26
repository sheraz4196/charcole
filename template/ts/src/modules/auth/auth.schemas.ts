import { z } from "zod";
import { USER_ROLES, AUTH_PROVIDERS } from "./auth.constants.ts";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const userSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  name: z.string().min(1).max(100),
  role: z.enum(USER_ROLES).default("user"),
  provider: z.enum(AUTH_PROVIDERS).default("credentials"),

  passwordHash: z.string().optional(), // credentials only
  isEmailVerified: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const jwtPayloadSchema = z.object({
  sub: z.string().uuid(), // user id
  email: emailSchema,
  role: z.enum(USER_ROLES),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const publicUserSchema = userSchema.omit({
  passwordHash: true,
});

// Generic validate function with proper typing
export const validate = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> => {
  return schema.parse(data);
};

// Export inferred types for use in other files
export type User = z.infer<typeof userSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
