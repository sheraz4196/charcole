import { PaymentError } from "../errors/PaymentError.js";

export function getWebhookSignatureHeader(provider) {
  if (provider === "stripe") {
    return "stripe-signature";
  } else if (provider === "lemonsqueezy") {
    return "x-signature";
  } else {
    throw new PaymentError(
      "Unknown provider for webhook header",
      "CONFIG_ERROR",
    );
  }
}

export function extractSignature(req, provider) {
  const headerName = getWebhookSignatureHeader(provider);
  const signature = req.headers[headerName];
  if (!signature) {
    throw new PaymentError(
      "Webhook signature header missing",
      "WEBHOOK_INVALID",
      401,
    );
  }
  return signature;
}
