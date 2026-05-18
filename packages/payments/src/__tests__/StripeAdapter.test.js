import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stripe before importing the adapter so the adapter picks up the mock
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
      refunds: {
        create: vi.fn(),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

import { StripeAdapter } from "../adapters/StripeAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

describe("StripeAdapter", () => {
  let adapter;
  let mockStripe;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStripe = new (vi.mocked(require("stripe").default))();
    adapter = new StripeAdapter({
      secretKey: "sk_test_fake",
      webhookSecret: "whsec_fake",
    });
  });

  it("creates a payment intent", async () => {
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: "pi_abc123",
      client_secret: "secret_fake",
      status: "requires_payment_method",
      amount: 1000,
      currency: "usd",
    });

    const result = await adapter.createPayment({
      amount: 1000,
      currency: "usd",
      metadata: { orderId: "123" },
    });

    expect(result.id).toBe("pi_abc123");
    expect(result.clientSecret).toBe("secret_fake");
    expect(result.status).toBe("requires_payment_method");
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe("usd");
  });

  it("refunds a payment", async () => {
    mockStripe.refunds.create.mockResolvedValue({
      id: "rf_abc123",
      status: "succeeded",
      amount: 500,
    });

    const result = await adapter.refundPayment({
      paymentId: "pi_abc123",
      amount: 500,
    });

    expect(result.id).toBe("rf_abc123");
    expect(result.status).toBe("succeeded");
    expect(result.amount).toBe(500);
  });

  it("gets payment status", async () => {
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_abc123",
      status: "succeeded",
      amount: 1000,
      currency: "usd",
    });

    const result = await adapter.getPaymentStatus("pi_abc123");

    expect(result.id).toBe("pi_abc123");
    expect(result.status).toBe("paid");
    expect(result.amount).toBe(1000);
    expect(result.currency).toBe("usd");
  });

  it("verifies webhook", async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_abc123" } },
    });

    const result = await adapter.verifyWebhook(Buffer.from("{}"), "signature");

    expect(result.event).toBe("payment_intent.succeeded");
    expect(result.data.id).toBe("pi_abc123");
  });

  it("throws WEBHOOK_INVALID on bad signature", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await expect(
      adapter.verifyWebhook(Buffer.from("{}"), "bad"),
    ).rejects.toThrow(PaymentError);
    await expect(
      adapter.verifyWebhook(Buffer.from("{}"), "bad"),
    ).rejects.toMatchObject({
      code: "WEBHOOK_INVALID",
      statusCode: 401,
    });
  });

  it("throws CONFIG_ERROR when secretKey missing", () => {
    expect(() => new StripeAdapter({ webhookSecret: "whsec_fake" })).toThrow(
      PaymentError,
    );
    expect(
      () => new StripeAdapter({ webhookSecret: "whsec_fake" }),
    ).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });

  it("throws CONFIG_ERROR when webhookSecret missing", () => {
    expect(() => new StripeAdapter({ secretKey: "sk_test_fake" })).toThrow(
      PaymentError,
    );
    expect(
      () => new StripeAdapter({ secretKey: "sk_test_fake" }),
    ).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });
});
