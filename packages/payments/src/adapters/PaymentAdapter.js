/**
 * @typedef {Object} CreatePaymentResult
 * @property {string} id - Provider-specific payment/checkout ID
 * @property {string} [clientSecret] - Stripe: client_secret for frontend
 * @property {string} [checkoutUrl] - LemonSqueezy: redirect URL
 * @property {string} status - 'pending' | 'requires_payment_method' | 'created'
 * @property {number} amount - Amount in smallest currency unit (cents)
 * @property {string} currency - ISO 4217 (e.g. 'usd', 'pkr')
 * @property {Object} metadata - Provider-specific raw response
 */

/**
 * @typedef {Object} RefundResult
 * @property {string} id - Refund ID
 * @property {string} status - 'succeeded' | 'pending' | 'failed'
 * @property {number} amount - Refunded amount in smallest unit
 */

/**
 * @typedef {Object} PaymentStatus
 * @property {string} id
 * @property {string} status - 'pending' | 'paid' | 'failed' | 'refunded'
 * @property {number} amount
 * @property {string} currency
 * @property {Object} metadata
 */

/**
 * @typedef {Object} WebhookResult
 * @property {string} event
 * @property {Object} data
 */

/**
 * Abstract PaymentAdapter interface.
 * All adapters must implement these methods.
 */
export class PaymentAdapter {
  /**
   * Create a payment intent (Stripe) or checkout session (LemonSqueezy).
   * @param {Object} params
   * @param {number} params.amount - Amount in smallest currency unit
   * @param {string} params.currency - ISO 4217 currency code
   * @param {Object} [params.metadata] - Additional metadata
   * @returns {Promise<CreatePaymentResult>}
   */
  async createPayment(params) {
    throw new Error("createPayment() must be implemented");
  }

  /**
   * Refund a payment.
   * @param {Object} params
   * @param {string} params.paymentId - Payment ID to refund
   * @param {number} [params.amount] - Amount to refund (omit for full refund)
   * @returns {Promise<RefundResult>}
   */
  async refundPayment(params) {
    throw new Error("refundPayment() must be implemented");
  }

  /**
   * Get current payment status.
   * @param {string} paymentId
   * @returns {Promise<PaymentStatus>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error("getPaymentStatus() must be implemented");
  }

  /**
   * Verify and parse a webhook payload.
   * @param {Buffer} rawBody - Raw webhook body as Buffer
   * @param {string} signature - Webhook signature from header
   * @returns {Promise<WebhookResult>}
   */
  async verifyWebhook(rawBody, signature) {
    throw new Error("verifyWebhook() must be implemented");
  }
}

/**
 * Factory function to create an adapter instance.
 * @param {Object} options
 * @param {'stripe' | 'lemonsqueezy'} options.provider
 * @param {string} [options.stripeSecretKey]
 * @param {string} [options.stripeWebhookSecret]
 * @param {string} [options.lemonSqueezyApiKey]
 * @param {string} [options.lemonSqueezyWebhookSecret]
 * @param {string} [options.lemonSqueezyStoreId]
 * @returns {PaymentAdapter}
 */
export function createAdapter(options) {
  const { provider } = options;
  if (provider === "stripe") {
    return new StripeAdapter({
      secretKey: options.stripeSecretKey,
      webhookSecret: options.stripeWebhookSecret,
    });
  } else if (provider === "lemonsqueezy") {
    return new LemonSqueezyAdapter({
      apiKey: options.lemonSqueezyApiKey,
      webhookSecret: options.lemonSqueezyWebhookSecret,
      storeId: options.lemonSqueezyStoreId,
    });
  } else {
    throw new PaymentError("Unknown provider", "CONFIG_ERROR");
  }
}
