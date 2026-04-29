import { getAdapter } from "./payments.adapter.ts";
import type {
  CreatePaymentParams,
  CreatePaymentResult,
  RefundParams,
  RefundResult,
  PaymentStatus,
  WebhookResult,
} from "./payments.types.ts";

const processedWebhookIds = new Set<string>();

export async function createPayment(
  params: CreatePaymentParams,
): Promise<CreatePaymentResult> {
  const adapter = getAdapter();
  return adapter.createPayment(params);
}

export async function refundPayment(
  params: RefundParams,
): Promise<RefundResult> {
  const adapter = getAdapter();
  return adapter.refundPayment(params);
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentStatus> {
  const adapter = getAdapter();
  return adapter.getPaymentStatus(paymentId);
}

export async function processWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<WebhookResult & { duplicate: boolean }> {
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
