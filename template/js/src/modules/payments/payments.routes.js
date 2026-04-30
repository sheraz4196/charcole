import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import * as controller from "./payments.controller.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.js";

const router = Router();

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create a payment intent or checkout session
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, currency]
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in smallest currency unit (cents for USD, paisas for PKR)
 *                 example: 2999
 *               currency:
 *                 type: string
 *                 description: ISO 4217 currency code
 *                 example: usd
 *               metadata:
 *                 type: object
 *                 description: Optional metadata. LemonSqueezy requires variantId here.
 *     responses:
 *       201:
 *         description: Payment intent created
 *       400:
 *         description: Validation error
 */
router.post(
  "/create-intent",
  validateRequest(createPaymentSchema),
  controller.createPayment,
);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Refund a payment
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: pi_123456789
 *               amount:
 *                 type: integer
 *                 description: Optional refund amount in smallest currency unit
 *                 example: 2999
 *     responses:
 *       200:
 *         description: Refund processed
 *       400:
 *         description: Validation error
 */
router.post(
  "/refund",
  validateRequest(refundPaymentSchema),
  controller.refundPayment,
);

/**
 * @swagger
 * /api/payments/status/{paymentId}:
 *   get:
 *     summary: Get payment status
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *       404:
 *         description: Payment not found
 */
router.get("/status/:paymentId", controller.getPaymentStatus);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Receive payment provider webhook events
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Missing signature header
 */
router.post("/webhook", controller.handleWebhook);

export default router;
