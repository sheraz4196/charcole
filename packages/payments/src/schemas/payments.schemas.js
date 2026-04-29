import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .int({ message: "amount must be an integer" })
    .positive({ message: "amount must be positive" })
    .max(99999999, "amount exceeds maximum allowed"),

  currency: z
    .string({ required_error: "currency is required" })
    .length(3, "currency must be 3 characters")
    .toLowerCase(),

  metadata: z.record(z.string()).default({}),
});

export const refundPaymentSchema = z.object({
  paymentId: z
    .string({ required_error: "paymentId is required" })
    .min(1, "paymentId cannot be empty"),

  amount: z.number().int().positive().optional(),
});
