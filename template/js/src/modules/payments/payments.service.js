import { getAdapter } from "./payments.adapter.js";

const processedWebhookIds = new Set();

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
  const result = await adapter.verifyWebhook(rawBody, signature);

  const eventId = result.data?.id
    ? String(result.data.id)
    : `${result.event}-${Date.now()}`;

  if (processedWebhookIds.has(eventId)) {
    return { ...result, duplicate: true };
  }

  processedWebhookIds.add(eventId);
  return { ...result, duplicate: false };
}
