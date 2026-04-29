export interface CreatePaymentParams {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  id: string;
  clientSecret?: string;
  checkoutUrl?: string;
  status: "pending" | "requires_payment_method" | "created";
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface RefundParams {
  paymentId: string;
  amount?: number;
}

export interface RefundResult {
  id: string;
  status: "succeeded" | "pending" | "failed";
  amount: number;
}

export interface PaymentStatus {
  id: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface WebhookResult {
  event: string;
  data: Record<string, unknown>;
}

export interface PaymentAdapter {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult>;
}

export interface SetupPaymentsOptions {
  provider: "stripe" | "lemonsqueezy";
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  lemonSqueezyApiKey?: string;
  lemonSqueezyWebhookSecret?: string;
  lemonSqueezyStoreId?: string;
  mountPath?: string;
}

export declare function setupPayments(
  app: any,
  options?: SetupPaymentsOptions,
): void;
export declare function createAdapter(
  options: SetupPaymentsOptions,
): PaymentAdapter;
export declare class StripeAdapter implements PaymentAdapter {
  constructor(options: { secretKey: string; webhookSecret: string });
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult>;
}
export declare class LemonSqueezyAdapter implements PaymentAdapter {
  constructor(options: {
    apiKey: string;
    webhookSecret: string;
    storeId: string;
  });
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult>;
}
export declare class PaymentError extends Error {
  code: string;
  statusCode: number;
}
export declare function resetAdapter(): void;
