import { env } from "../../config/env.js";
import {
  StripeAdapter,
  LemonSqueezyAdapter,
  PaymentError,
} from "@charcoles/payments";

let adapter = null;

export function getAdapter() {
  if (adapter) return adapter;

  const provider = env.PAYMENT_PROVIDER;

  if (!provider) {
    throw new PaymentError(
      'PAYMENT_PROVIDER env var is not set. Set it to "stripe" or "lemonsqueezy".',
      "PROVIDER_NOT_CONFIGURED",
      500,
    );
  }

  if (provider === "stripe") {
    adapter = new StripeAdapter({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });
  } else if (provider === "lemonsqueezy") {
    adapter = new LemonSqueezyAdapter({
      apiKey: env.LEMONSQUEEZY_API_KEY,
      webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET,
      storeId: env.LEMONSQUEEZY_STORE_ID,
    });
  } else {
    throw new PaymentError(
      `Unknown PAYMENT_PROVIDER: "${provider}". Use "stripe" or "lemonsqueezy".`,
      "CONFIG_ERROR",
      500,
    );
  }

  return adapter;
}

export function resetAdapter() {
  adapter = null;
}
