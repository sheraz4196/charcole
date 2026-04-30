# @charcoles/payments

Drop-in payment processing for Express apps. Supports Stripe and LemonSqueezy for regional payments (Pakistan, etc.).

## Installation

```bash
npm install @charcoles/payments
```

## Quick Start

### Standalone Express App

```js
import express from "express";
import { setupPayments } from "@charcoles/payments";

const app = express();

// IMPORTANT: Register webhook raw body middleware BEFORE express.json()
app.use("/payments/webhook", express.raw({ type: "application/json" }));

// Global JSON parsing for other routes
app.use(express.json());

// Setup payments
setupPayments(app, {
  provider: "lemonsqueezy",
  lemonSqueezyApiKey: process.env.LEMONSQUEEZY_API_KEY,
  lemonSqueezyWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  lemonSqueezyStoreId: process.env.LEMONSQUEEZY_STORE_ID,
});

app.listen(3000);
```

### Environment Variables

| Variable                      | Stripe | LemonSqueezy | Description                        |
| ----------------------------- | ------ | ------------ | ---------------------------------- |
| `PAYMENT_PROVIDER`            | ✅     | ✅           | `"stripe"` or `"lemonsqueezy"`     |
| `STRIPE_SECRET_KEY`           | ✅     | ❌           | `sk_live_...` or `sk_test_...`     |
| `STRIPE_WEBHOOK_SECRET`       | ✅     | ❌           | `whsec_...` from Stripe dashboard  |
| `LEMONSQUEEZY_API_KEY`        | ❌     | ✅           | From LS API settings               |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | ❌     | ✅           | From LS webhook settings           |
| `LEMONSQUEEZY_STORE_ID`       | ❌     | ✅           | Numeric store ID from LS dashboard |

### Stripe Configuration

```js
setupPayments(app, {
  provider: "stripe",
  stripeSecretKey: "sk_live_...",
  stripeWebhookSecret: "whsec_...",
});
```

### LemonSqueezy Configuration

```js
setupPayments(app, {
  provider: "lemonsqueezy",
  lemonSqueezyApiKey: "your_api_key",
  lemonSqueezyWebhookSecret: "your_webhook_secret",
  lemonSqueezyStoreId: "12345",
});
```

## API Endpoints

### POST /payments/create-intent

Create a payment intent or checkout session.

**Request:**

```json
{
  "amount": 2999,
  "currency": "usd",
  "metadata": {
    "orderId": "order_123"
  }
}
```

**Response (Stripe):**

```json
{
  "success": true,
  "data": {
    "id": "pi_3abc...",
    "clientSecret": "pi_..._secret_...",
    "status": "requires_payment_method",
    "amount": 2999,
    "currency": "usd"
  }
}
```

**Response (LemonSqueezy):**

```json
{
  "success": true,
  "data": {
    "id": "12345",
    "checkoutUrl": "https://app.lemonsqueezy.com/checkout/...",
    "status": "created",
    "amount": 2999,
    "currency": "usd"
  }
}
```

### POST /payments/refund

Refund a payment.

**Request:**

```json
{
  "paymentId": "pi_3abc...",
  "amount": 1500
}
```

### GET /payments/status/:paymentId

Get payment status.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pi_3abc...",
    "status": "paid",
    "amount": 2999,
    "currency": "usd"
  }
}
```

### POST /payments/webhook

Receive provider webhooks. Returns `{"received": true}`.

## LemonSqueezy Notes

### Regional Support

LemonSqueezy is included specifically for developers in regions where Stripe payouts are not available (e.g., Pakistan). LemonSqueezy uses a merchant-of-record model, so you sell through their entity and receive bank transfers.

### Variant IDs Required

Unlike Stripe (which accepts raw amounts), LemonSqueezy requires a Product Variant ID. Create a "Pay What You Want" product in your LemonSqueezy dashboard and pass the variant ID in `metadata.variantId`:

```json
{
  "amount": 10000,
  "currency": "pkr",
  "metadata": {
    "variantId": "12345"
  }
}
```

### Raw Body Middleware Warning

⚠️ **Critical**: Webhook endpoints require raw `Buffer` bodies for signature verification. Always register `express.raw({ type: 'application/json' })` on the webhook path **before** `express.json()`:

```js
// ✅ Correct order
app.use("/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json()); // Global JSON parsing

// ❌ Wrong order — webhooks will fail
app.use(express.json());
app.use("/payments/webhook", express.raw({ type: "application/json" }));
```

## TypeScript Support

Full TypeScript definitions included:

```ts
import {
  setupPayments,
  PaymentAdapter,
  StripeAdapter,
} from "@charcoles/payments";

interface MyOptions {
  provider: "stripe";
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

setupPayments(app, options);
```

## Error Handling

All errors are `PaymentError` instances with specific codes:

- `CONFIG_ERROR`: Missing required configuration
- `WEBHOOK_INVALID`: Invalid webhook signature
- `STRIPE_ERROR`: Stripe API error
- `LS_CHECKOUT_FAILED`: LemonSqueezy checkout creation failed
- `LS_REFUND_FAILED`: LemonSqueezy refund failed
- `LS_ORDER_NOT_FOUND`: LemonSqueezy order not found
- `MISSING_VARIANT_ID`: LemonSqueezy variantId not provided
- `PROVIDER_NOT_CONFIGURED`: PAYMENT_PROVIDER env var missing

## License

ISC
