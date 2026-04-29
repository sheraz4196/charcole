import Stripe from "stripe";
import { PaymentAdapter } from "./PaymentAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

export class StripeAdapter extends PaymentAdapter {
  #stripe;
  #webhookSecret;

  constructor({ secretKey, webhookSecret }) {
    super();
    if (!secretKey) {
      throw new PaymentError("Stripe secret key is required", "CONFIG_ERROR");
    }
    if (!webhookSecret) {
      throw new PaymentError(
        "Stripe webhook secret is required",
        "CONFIG_ERROR",
      );
    }
    this.#stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
    this.#webhookSecret = webhookSecret;
  }

  async createPayment({ amount, currency, metadata = {} }) {
    try {
      const intent = await this.#stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      return {
        id: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        metadata: intent,
      };
    } catch (error) {
      throw new PaymentError(
        `Stripe createPayment failed: ${error.message}`,
        "STRIPE_ERROR",
      );
    }
  }

  async refundPayment({ paymentId, amount }) {
    try {
      const params = { payment_intent: paymentId };
      if (amount) {
        params.amount = amount;
      }
      const refund = await this.#stripe.refunds.create(params);
      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      };
    } catch (error) {
      throw new PaymentError(
        `Stripe refundPayment failed: ${error.message}`,
        "STRIPE_ERROR",
      );
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const intent = await this.#stripe.paymentIntents.retrieve(paymentId);
      const statusMap = {
        succeeded: "paid",
        requires_payment_method: "pending",
        requires_confirmation: "pending",
        processing: "pending",
        canceled: "failed",
        requires_action: "pending",
      };
      const normalizedStatus = statusMap[intent.status] || "pending";
      return {
        id: intent.id,
        status: normalizedStatus,
        amount: intent.amount,
        currency: intent.currency,
        metadata: intent,
      };
    } catch (error) {
      throw new PaymentError(
        `Stripe getPaymentStatus failed: ${error.message}`,
        "STRIPE_ERROR",
      );
    }
  }

  async verifyWebhook(rawBody, signature) {
    try {
      const event = this.#stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.#webhookSecret,
      );
      return {
        event: event.type,
        data: event.data.object,
      };
    } catch (error) {
      throw new PaymentError(
        "Invalid webhook signature",
        "WEBHOOK_INVALID",
        401,
      );
    }
  }
}
