import {
  lemonSqueezySetup,
  createCheckout,
  getOrder,
  createRefund,
} from "@lemonsqueezy/lemonsqueezy.js";
import { createHmac } from "crypto";
import { PaymentAdapter } from "./PaymentAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

export class LemonSqueezyAdapter extends PaymentAdapter {
  #apiKey;
  #webhookSecret;
  #storeId;

  constructor({ apiKey, webhookSecret, storeId }) {
    super();
    if (!apiKey) {
      throw new PaymentError(
        "LemonSqueezy API key is required",
        "CONFIG_ERROR",
      );
    }
    if (!webhookSecret) {
      throw new PaymentError(
        "LemonSqueezy webhook secret is required",
        "CONFIG_ERROR",
      );
    }
    if (!storeId) {
      throw new PaymentError(
        "LemonSqueezy store ID is required",
        "CONFIG_ERROR",
      );
    }
    this.#apiKey = apiKey;
    this.#webhookSecret = webhookSecret;
    this.#storeId = storeId;
    lemonSqueezySetup({ apiKey });
  }

  async createPayment({ amount, currency, metadata = {} }) {
    if (!metadata.variantId) {
      throw new PaymentError(
        "variantId is required in metadata for LemonSqueezy",
        "MISSING_VARIANT_ID",
      );
    }
    try {
      const checkout = await createCheckout(this.#storeId, metadata.variantId, {
        checkoutOptions: {
          embed: false,
          media: false,
          logo: false,
        },
        checkoutData: {
          custom: metadata,
        },
      });
      if (checkout.error) {
        throw new PaymentError(
          `LemonSqueezy checkout failed: ${checkout.error.message}`,
          "LS_CHECKOUT_FAILED",
        );
      }
      return {
        id: String(checkout.data.data.id),
        checkoutUrl: checkout.data.data.attributes.url,
        status: "created",
        amount,
        currency,
        metadata: checkout.data,
      };
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        `LemonSqueezy createPayment failed: ${error.message}`,
        "LS_CHECKOUT_FAILED",
      );
    }
  }

  async refundPayment({ paymentId, amount }) {
    try {
      const refund = await createRefund({ orderId: paymentId });
      if (refund.error) {
        throw new PaymentError(
          `LemonSqueezy refund failed: ${refund.error.message}`,
          "LS_REFUND_FAILED",
        );
      }
      return {
        id: String(refund.data.data.id),
        status: refund.data.data.attributes.status,
        amount: refund.data.data.attributes.amount,
      };
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        `LemonSqueezy refundPayment failed: ${error.message}`,
        "LS_REFUND_FAILED",
      );
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const order = await getOrder(paymentId);
      if (order.error) {
        throw new PaymentError(
          `LemonSqueezy order not found: ${order.error.message}`,
          "LS_ORDER_NOT_FOUND",
        );
      }
      const statusMap = {
        paid: "paid",
        pending: "pending",
        failed: "failed",
        refunded: "refunded",
      };
      const normalizedStatus =
        statusMap[order.data.data.attributes.status] || "pending";
      return {
        id: String(order.data.data.id),
        status: normalizedStatus,
        amount: order.data.data.attributes.total,
        currency: order.data.data.attributes.currency,
        metadata: order.data,
      };
    } catch (error) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        `LemonSqueezy getPaymentStatus failed: ${error.message}`,
        "LS_ORDER_NOT_FOUND",
      );
    }
  }

  async verifyWebhook(rawBody, signature) {
    const expectedSignature = createHmac("sha256", this.#webhookSecret)
      .update(rawBody)
      .digest("hex");
    if (signature !== expectedSignature) {
      throw new PaymentError(
        "Invalid webhook signature",
        "WEBHOOK_INVALID",
        401,
      );
    }
    const payload = JSON.parse(rawBody.toString());
    return {
      event: payload.meta.event_name,
      data: payload.data,
    };
  }
}
