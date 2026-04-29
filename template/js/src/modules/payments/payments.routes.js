import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import * as controller from "./payments.controller.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.js";

const router = Router();

/**
 * POST /payments/create-intent
 * Creates a Stripe PaymentIntent or a LemonSqueezy checkout session.
 *
 * Body: { amount: number, currency: string, metadata?: object }
 *
 * Stripe response includes: clientSecret (pass to frontend Stripe.js)
 * LemonSqueezy response includes: checkoutUrl (redirect user to this URL)
 */
router.post(
  "/create-intent",
  validateRequest(createPaymentSchema),
  controller.createPayment,
);

/**
 * POST /payments/refund
 * Refunds a payment fully or partially.
 *
 * Body: { paymentId: string, amount?: number }
 * Omit amount for full refund.
 */
router.post(
  "/refund",
  validateRequest(refundPaymentSchema),
  controller.refundPayment,
);

/**
 * GET /payments/status/:paymentId
 * Gets the current status of a payment.
 * Returns normalized status: 'pending' | 'paid' | 'failed' | 'refunded'
 */
router.get("/status/:paymentId", controller.getPaymentStatus);

/**
 * POST /payments/webhook
 * Receives webhook events from Stripe or LemonSqueezy.
 *
 * DO NOT add validateRequest middleware here.
 * DO NOT add authentication middleware here.
 *
 * This route receives raw Buffer bodies (set up in app.js).
 * Signature verification is done inside the controller via the adapter.
 */
router.post("/webhook", controller.handleWebhook);

export default router;
