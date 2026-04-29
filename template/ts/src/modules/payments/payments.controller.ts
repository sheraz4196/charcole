import { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.ts";
import { sendSuccess } from "../../utils/response.ts";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.ts";
import { PAYMENT_EVENTS, WEBHOOK_HEADERS } from "./payments.constants.ts";
import { logger } from "../../utils/logger.ts";

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validated = createPaymentSchema.parse(req.body);
    const result = await paymentsService.createPayment(validated);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const refundPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validated = refundPaymentSchema.parse(req.body);
    const result = await paymentsService.refundPayment(validated);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await paymentsService.getPaymentStatus(req.params.paymentId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const provider = process.env.PAYMENT_PROVIDER;
    const headerName =
      provider === "stripe"
        ? WEBHOOK_HEADERS.stripe
        : WEBHOOK_HEADERS.lemonsqueezy;

    const signature = req.headers[headerName] as string | undefined;

    if (!signature) {
      res.status(400).json({ error: "Missing webhook signature header" });
      return;
    }

    const rawBody = req.body as Buffer;
    const result = await paymentsService.processWebhook(rawBody, signature);

    if (result.duplicate) {
      logger.info(
        `Duplicate webhook event received and ignored: ${result.event}`,
      );
      res.status(200).json({ received: true, duplicate: true });
      return;
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
