import * as paymentsService from "../services/payments.service.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "../schemas/payments.schemas.js";
import { extractSignature } from "../helpers/webhookUtils.js";
import { PaymentError } from "../errors/PaymentError.js";

export const createPayment = async (req, res, next) => {
  try {
    const validated = createPaymentSchema.parse(req.body);
    const result = await paymentsService.createPayment(validated);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const validated = refundPaymentSchema.parse(req.body);
    const result = await paymentsService.refundPayment(validated);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentsService.getPaymentStatus(req.params.paymentId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const provider = process.env.PAYMENT_PROVIDER;
    const signature = extractSignature(req, provider);
    const result = await paymentsService.processWebhook(req.body, signature);
    console.log(`Webhook received: ${result.event}`);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};
