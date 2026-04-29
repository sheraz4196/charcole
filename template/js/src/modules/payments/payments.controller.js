import * as paymentsService from "./payments.service.js";
import { sendSuccess } from "../../utils/response.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.js";
import { WEBHOOK_HEADERS, PAYMENT_EVENTS } from "./payments.constants.js";
import { logger } from "../../utils/logger.js";

export const createPayment = async (req, res, next) => {
  try {
    const validated = createPaymentSchema.parse(req.body);
    const result = await paymentsService.createPayment(validated);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const validated = refundPaymentSchema.parse(req.body);
    const result = await paymentsService.refundPayment(validated);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentsService.getPaymentStatus(req.params.paymentId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const provider = process.env.PAYMENT_PROVIDER;
    const headerName = WEBHOOK_HEADERS[provider];
    const signature = req.headers[headerName];

    if (!signature) {
      return res
        .status(400)
        .json({ error: "Missing webhook signature header" });
    }

    const result = await paymentsService.processWebhook(req.body, signature);

    if (result.duplicate) {
      logger.info(
        `Duplicate webhook event received and ignored: ${result.event}`,
      );
      return res.status(200).json({ received: true, duplicate: true });
    }

    logger.info(`Webhook event received: ${result.event}`);

    switch (result.event) {
      case PAYMENT_EVENTS.STRIPE_PAYMENT_SUCCEEDED:
      case PAYMENT_EVENTS.LS_ORDER_CREATED:
        logger.info("Payment confirmed. Add your fulfillment logic here.");
        break;

      case PAYMENT_EVENTS.STRIPE_PAYMENT_FAILED:
        logger.warn("Payment failed. Add your failure handling logic here.");
        break;

      case PAYMENT_EVENTS.LS_ORDER_REFUNDED:
      case PAYMENT_EVENTS.STRIPE_REFUND_CREATED:
        logger.info("Refund processed. Add your refund handling logic here.");
        break;

      default:
        logger.info(`Unhandled webhook event: ${result.event}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};
