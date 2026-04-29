import { env } from "../../config/env.ts";
import {
  StripeAdapter,
  LemonSqueezyAdapter,
  PaymentError,
} from "@charcoles/payments";
import type { PaymentAdapter } from "./payments.types.ts";

let adapter: PaymentAdapter | null = null;

export function getAdapter(): PaymentAdapter {
  if (adapter) {
    return adapter;
  }

  const provider = env.PAYMENT_PROVIDER;

  if (!provider) {
    const error = new PaymentError(
      'PAYMENT_PROVIDER env var is not set. Set it to "stripe" or "lemonsqueezy".',
    );
    error.code = "PROVIDER_NOT_CONFIGURED";
    error.statusCode = 500;
    throw error;
  }

  if (provider === "stripe") {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      const error = new PaymentError(
        "Stripe configuration is incomplete. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.",
      );
      error.code = "CONFIG_ERROR";
      error.statusCode = 500;
      throw error;
    }

    adapter = new StripeAdapter({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    }) as unknown as PaymentAdapter;
  } else if (provider === "lemonsqueezy") {
    if (
      !env.LEMONSQUEEZY_API_KEY ||
      !env.LEMONSQUEEZY_WEBHOOK_SECRET ||
      !env.LEMONSQUEEZY_STORE_ID
    ) {
      const error = new PaymentError(
        "LemonSqueezy configuration is incomplete. Set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET, and LEMONSQUEEZY_STORE_ID.",
      );
      error.code = "CONFIG_ERROR";
      error.statusCode = 500;
      throw error;
    }

    adapter = new LemonSqueezyAdapter({
      apiKey: env.LEMONSQUEEZY_API_KEY,
      webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET,
      storeId: env.LEMONSQUEEZY_STORE_ID,
    }) as unknown as PaymentAdapter;
  } else {
    const error = new PaymentError(
      `Unknown PAYMENT_PROVIDER: "${provider}". Use "stripe" or "lemonsqueezy".`,
    );
    error.code = "CONFIG_ERROR";
    error.statusCode = 500;
    throw error;
  }

  return adapter;
}

export function resetAdapter(): void {
  adapter = null;
}
