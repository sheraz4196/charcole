import { describe, it, expect, vi, beforeEach } from "vitest";
import * as paymentsService from "../services/payments.service.js";
import { PaymentError } from "../errors/PaymentError.js";

vi.mock("../adapters/StripeAdapter.js");
vi.mock("../adapters/LemonSqueezyAdapter.js");

describe("payments.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentsService.resetAdapter();
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    delete process.env.LEMONSQUEEZY_STORE_ID;
  });

  it("getAdapter returns StripeAdapter when PAYMENT_PROVIDER=stripe", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const adapter = paymentsService.getAdapter();
    expect(
      vi.mocked(require("../adapters/StripeAdapter.js")).StripeAdapter,
    ).toHaveBeenCalledWith({
      secretKey: "sk_test_fake",
      webhookSecret: "whsec_fake",
    });
  });

  it("getAdapter returns LemonSqueezyAdapter when PAYMENT_PROVIDER=lemonsqueezy", () => {
    process.env.PAYMENT_PROVIDER = "lemonsqueezy";
    process.env.LEMONSQUEEZY_API_KEY = "api_fake";
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = "secret_fake";
    process.env.LEMONSQUEEZY_STORE_ID = "123";

    const adapter = paymentsService.getAdapter();
    expect(
      vi.mocked(require("../adapters/LemonSqueezyAdapter.js"))
        .LemonSqueezyAdapter,
    ).toHaveBeenCalledWith({
      apiKey: "api_fake",
      webhookSecret: "secret_fake",
      storeId: "123",
    });
  });

  it("getAdapter throws PROVIDER_NOT_CONFIGURED when env var not set", () => {
    expect(() => paymentsService.getAdapter()).toThrow(PaymentError);
    expect(() => paymentsService.getAdapter()).toMatchObject({
      code: "PROVIDER_NOT_CONFIGURED",
    });
  });

  it("getAdapter throws CONFIG_ERROR for unknown provider", () => {
    process.env.PAYMENT_PROVIDER = "unknown";
    expect(() => paymentsService.getAdapter()).toThrow(PaymentError);
    expect(() => paymentsService.getAdapter()).toMatchObject({
      code: "CONFIG_ERROR",
    });
  });

  it("getAdapter caches instance", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const adapter1 = paymentsService.getAdapter();
    const adapter2 = paymentsService.getAdapter();
    expect(adapter1).toBe(adapter2);
  });

  it("resetAdapter creates new instance", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const adapter1 = paymentsService.getAdapter();
    paymentsService.resetAdapter();
    const adapter2 = paymentsService.getAdapter();
    expect(adapter1).not.toBe(adapter2);
  });

  it("processWebhook returns duplicate: false on first call", async () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const mockAdapter = {
      verifyWebhook: vi.fn().mockResolvedValue({
        event: "payment_intent.succeeded",
        data: { id: "pi_123" },
      }),
    };
    vi.mocked(
      require("../adapters/StripeAdapter.js"),
    ).StripeAdapter.mockReturnValue(mockAdapter);

    const result = await paymentsService.processWebhook(
      Buffer.from("{}"),
      "sig",
    );
    expect(result.duplicate).toBe(false);
  });

  it("processWebhook returns duplicate: true on second call", async () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    const mockAdapter = {
      verifyWebhook: vi.fn().mockResolvedValue({
        event: "payment_intent.succeeded",
        data: { id: "pi_123" },
      }),
    };
    vi.mocked(
      require("../adapters/StripeAdapter.js"),
    ).StripeAdapter.mockReturnValue(mockAdapter);

    await paymentsService.processWebhook(Buffer.from("{}"), "sig");
    const result = await paymentsService.processWebhook(
      Buffer.from("{}"),
      "sig",
    );
    expect(result.duplicate).toBe(true);
  });
});
