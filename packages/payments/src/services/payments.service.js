import { StripeAdapter } from "../adapters/StripeAdapter.js";
import { LemonSqueezyAdapter } from "../adapters/LemonSqueezyAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

let adapter = null;
const processedWebhookIds = new Set();

export function getAdapter() {
  if (adapter) return adapter;

  const provider = process.env.PAYMENT_PROVIDER;
  if (!provider) {
    throw new PaymentError(
      "PAYMENT_PROVIDER environment variable is required",
      "PROVIDER_NOT_CONFIGURED",
    );
  }

  if (provider === "stripe") {
    adapter = new StripeAdapter({
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    });
  } else if (provider === "lemonsqueezy") {
    adapter = new LemonSqueezyAdapter({
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
    });
  } else {
    throw new PaymentError(`Unknown provider: ${provider}`, "CONFIG_ERROR");
  }

  return adapter;
}

export function resetAdapter() {
  adapter = null;
}

export async function createPayment({ amount, currency, metadata }) {
  const adapter = getAdapter();
  return adapter.createPayment({ amount, currency, metadata });
}

export async function refundPayment({ paymentId, amount }) {
  const adapter = getAdapter();
  return adapter.refundPayment({ paymentId, amount });
}

export async function getPaymentStatus(paymentId) {
  const adapter = getAdapter();
  return adapter.getPaymentStatus(paymentId);
}

export async function processWebhook(rawBody, signature) {
  const adapter = getAdapter();
  const { event, data } = await adapter.verifyWebhook(rawBody, signature);

  const eventId = data.id ?? `${event}-${Date.now()}`;

  if (processedWebhookIds.has(eventId)) {
    return { event, data, duplicate: true };
  }

  processedWebhookIds.add(eventId);
  return { event, data, duplicate: false };
}
