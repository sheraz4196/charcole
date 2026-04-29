import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .int("amount must be an integer (smallest currency unit, e.g. cents)")
    .positive("amount must be positive")
    .max(99999999, "amount exceeds maximum"),

  currency: z
    .string({ required_error: "currency is required" })
    .length(3, "currency must be a 3-letter ISO 4217 code (e.g. usd, pkr)")
    .toLowerCase(),

  metadata: z.record(z.string()).optional().default({}),
});

export const refundPaymentSchema = z.object({
  paymentId: z
    .string({ required_error: "paymentId is required" })
    .min(1, "paymentId cannot be empty"),

  amount: z
    .number()
    .int("amount must be an integer")
    .positive("amount must be positive")
    .optional(),
});
