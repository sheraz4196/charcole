export const PAYMENT_PROVIDERS = {
  STRIPE: "stripe",
  LEMONSQUEEZY: "lemonsqueezy",
};

export const PAYMENT_EVENTS = {
  // Stripe events
  STRIPE_PAYMENT_SUCCEEDED: "payment_intent.succeeded",
  STRIPE_PAYMENT_FAILED: "payment_intent.payment_failed",
  STRIPE_REFUND_CREATED: "charge.refunded",
  // LemonSqueezy events
  LS_ORDER_CREATED: "order_created",
  LS_ORDER_REFUNDED: "order_refunded",
  LS_SUBSCRIPTION_CANCELLED: "subscription_cancelled",
};

export const WEBHOOK_HEADERS = {
  stripe: "stripe-signature",
  lemonsqueezy: "x-signature",
};
