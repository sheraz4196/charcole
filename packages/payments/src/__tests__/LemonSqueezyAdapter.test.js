import { describe, it, expect, vi, beforeEach } from "vitest";
import { LemonSqueezyAdapter } from "../adapters/LemonSqueezyAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

vi.mock("@lemonsqueezy/lemonsqueezy-js", () => {
  return {
    lemonSqueezySetup: vi.fn(),
    createCheckout: vi.fn(),
    getOrder: vi.fn(),
    createRefund: vi.fn(),
  };
});

describe("LemonSqueezyAdapter", () => {
  let adapter;
  let mockLS;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLS = vi.mocked(require("@lemonsqueezy/lemonsqueezy-js"));
    adapter = new LemonSqueezyAdapter({
      apiKey: "api_fake",
      webhookSecret: "secret_fake",
      storeId: "123",
    });
  });

  it("creates a checkout", async () => {
    mockLS.createCheckout.mockResolvedValue({
      error: null,
      data: {
        data: {
          id: 456,
          attributes: {
            url: "https://checkout.fake",
          },
        },
      },
    });

    const result = await adapter.createPayment({
      amount: 1000,
      currency: "usd",
      metadata: { variantId: "789" },
    });

    expect(result.id).toBe("456");
    expect(result.checkoutUrl).toBe("https://checkout.fake");
    expect(result.status).toBe("created");
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe("usd");
  });

  it("throws MISSING_VARIANT_ID when variantId absent", async () => {
    await expect(
      adapter.createPayment({
        amount: 1000,
        currency: "usd",
        metadata: {},
      }),
    ).rejects.toThrow(PaymentError);
    await expect(
      adapter.createPayment({
        amount: 1000,
        currency: "usd",
        metadata: {},
      }),
    ).rejects.toMatchObject({
      code: "MISSING_VARIANT_ID",
    });
  });

  it("throws LS_CHECKOUT_FAILED when API returns error", async () => {
    mockLS.createCheckout.mockResolvedValue({
      error: { message: "Invalid variant" },
    });

    await expect(
      adapter.createPayment({
        amount: 1000,
        currency: "usd",
        metadata: { variantId: "789" },
      }),
    ).rejects.toThrow(PaymentError);
    await expect(
      adapter.createPayment({
        amount: 1000,
        currency: "usd",
        metadata: { variantId: "789" },
      }),
    ).rejects.toMatchObject({
      code: "LS_CHECKOUT_FAILED",
    });
  });

  it("refunds a payment", async () => {
    mockLS.createRefund.mockResolvedValue({
      error: null,
      data: {
        data: {
          id: 789,
          attributes: {
            status: "completed",
            amount: 500,
          },
        },
      },
    });

    const result = await adapter.refundPayment({
      paymentId: "456",
    });

    expect(result.id).toBe("789");
    expect(result.status).toBe("completed");
    expect(result.amount).toBe(500);
  });

  it("gets payment status", async () => {
    mockLS.getOrder.mockResolvedValue({
      error: null,
      data: {
        data: {
          id: 456,
          attributes: {
            status: "paid",
            total: 1000,
            currency: "usd",
          },
        },
      },
    });

    const result = await adapter.getPaymentStatus("456");

    expect(result.id).toBe("456");
    expect(result.status).toBe("paid");
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe("usd");
  });

  it("throws LS_ORDER_NOT_FOUND when order not found", async () => {
    mockLS.getOrder.mockResolvedValue({
      error: { message: "Order not found" },
    });

    await expect(adapter.getPaymentStatus("999")).rejects.toThrow(PaymentError);
    await expect(adapter.getPaymentStatus("999")).rejects.toMatchObject({
      code: "LS_ORDER_NOT_FOUND",
    });
  });

  it("verifies webhook", async () => {
    const rawBody = Buffer.from(
      JSON.stringify({
        meta: { event_name: "order_created" },
        data: { id: "123" },
      }),
    );

    const result = await adapter.verifyWebhook(rawBody, "correct_signature");

    expect(result.event).toBe("order_created");
    expect(result.data.id).toBe("123");
  });

  it("throws WEBHOOK_INVALID on wrong signature", async () => {
    const rawBody = Buffer.from("{}");

    await expect(
      adapter.verifyWebhook(rawBody, "wrong_signature"),
    ).rejects.toThrow(PaymentError);
    await expect(
      adapter.verifyWebhook(rawBody, "wrong_signature"),
    ).rejects.toMatchObject({
      code: "WEBHOOK_INVALID",
      statusCode: 401,
    });
  });

  it("throws CONFIG_ERROR when apiKey missing", () => {
    expect(
      () =>
        new LemonSqueezyAdapter({
          webhookSecret: "secret_fake",
          storeId: "123",
        }),
    ).toThrow(PaymentError);
    expect(
      () =>
        new LemonSqueezyAdapter({
          webhookSecret: "secret_fake",
          storeId: "123",
        }),
    ).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });

  it("throws CONFIG_ERROR when webhookSecret missing", () => {
    expect(
      () =>
        new LemonSqueezyAdapter({
          apiKey: "api_fake",
          storeId: "123",
        }),
    ).toThrow(PaymentError);
    expect(
      () =>
        new LemonSqueezyAdapter({
          apiKey: "api_fake",
          storeId: "123",
        }),
    ).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });

  it("throws CONFIG_ERROR when storeId missing", () => {
    expect(
      () =>
        new LemonSqueezyAdapter({
          apiKey: "api_fake",
          webhookSecret: "secret_fake",
        }),
    ).toThrow(PaymentError);
    expect(
      () =>
        new LemonSqueezyAdapter({
          apiKey: "api_fake",
          webhookSecret: "secret_fake",
        }),
    ).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });
});
