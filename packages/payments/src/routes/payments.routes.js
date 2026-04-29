import { Router } from "express";
import express from "express";
import * as controller from "../controllers/payments.controller.js";

const router = Router();

router.post("/create-intent", controller.createPayment);
router.post("/refund", controller.refundPayment);
router.get("/status/:paymentId", controller.getPaymentStatus);
router.post("/webhook", controller.handleWebhook);

export default router;

export function setupPayments(app, options = {}) {
  const {
    provider,
    stripeSecretKey,
    stripeWebhookSecret,
    lemonSqueezyApiKey,
    lemonSqueezyWebhookSecret,
    lemonSqueezyStoreId,
    mountPath = "/payments",
  } = options;

  // Set env vars if provided
  if (provider) process.env.PAYMENT_PROVIDER = provider;
  if (stripeSecretKey) process.env.STRIPE_SECRET_KEY = stripeSecretKey;
  if (stripeWebhookSecret)
    process.env.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;
  if (lemonSqueezyApiKey) process.env.LEMONSQUEEZY_API_KEY = lemonSqueezyApiKey;
  if (lemonSqueezyWebhookSecret)
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = lemonSqueezyWebhookSecret;
  if (lemonSqueezyStoreId)
    process.env.LEMONSQUEEZY_STORE_ID = lemonSqueezyStoreId;

  // Register raw body middleware for webhook BEFORE mounting router
  app.use(`${mountPath}/webhook`, express.raw({ type: "application/json" }));

  // Mount the router
  app.use(mountPath, router);
}
