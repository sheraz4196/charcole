# Charcole v2.3.0 — Payments Module Implementation Plan

> **Audience**: AI coding agents + human engineers implementing this feature.
> **Goal**: Zero ambiguity. Every file, every decision, every edge case documented.

---

## Table of Contents

1. [Overview & Core Concept](#overview)
2. [Project Context & Current Architecture](#context)
3. [Feature Architecture Decision Records (ADRs)](#adrs)
4. [Detailed File Map — What Gets Created/Modified](#file-map)
5. [Package: `@charcoles/payments` — Deep Spec](#package-spec)
6. [Adapter Contracts (Exact Interfaces)](#adapter-contracts)
7. [Stripe Adapter — Implementation Guide](#stripe-adapter)
8. [LemonSqueezy Adapter — Implementation Guide](#lemonsqueezy-adapter)
9. [Template Integration — JS & TS](#template-integration)
10. [CLI Changes (`bin/index.js`)](#cli-changes)
11. [Environment Variables — Full Spec](#env-spec)
12. [Route & Endpoint Spec](#route-spec)
13. [Zod Schemas — Full Definitions](#zod-schemas)
14. [Error Handling Strategy](#error-handling)
15. [Webhook Handling — Security & Verification](#webhooks)
16. [Testing Strategy — Full Coverage Plan](#testing)
17. [Code Style Rules (Enforced)](#code-style)
18. [Swagger / OpenAPI Integration](#swagger)
19. [Migration Guide (Existing Projects)](#migration)
20. [Release Checklist](#release-checklist)
21. [AI Agent Instructions](#ai-agent-instructions)
22. [Common Pitfalls & How to Avoid Them](#pitfalls)

---

## 1. Overview & Core Concept {#overview}

Charcole v2.3.0 introduces a **payments module** — an optional, production-ready payment processing system that scaffolds into both JS and TS templates, and is also publishable as a standalone npm package (`@charcoles/payments`).

### What Gets Built

| Deliverable                         | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `packages/payments/`                | Standalone npm package `@charcoles/payments` |
| `template/js/src/modules/payments/` | JS template module                           |
| `template/ts/src/modules/payments/` | TS template module                           |
| CLI prompt update                   | New payments question in `bin/index.js`      |
| Env schema updates                  | Payment vars added to Zod env config         |
| Swagger docs                        | Payment endpoints auto-documented            |

### Why Two Providers

- **Stripe** — Global standard. Best DX, best docs, best ecosystem.
- **LemonSqueezy** — Stripe does not support Pakistani bank accounts for payouts. Pakistani developers building SaaS cannot receive Stripe payouts. LemonSqueezy uses a merchant-of-record model — developers sell through LemonSqueezy's entity and receive bank transfers. This is the correct solution for Pakistan and similar regions.

The system must support both providers through an **adapter pattern** so the codebase is identical regardless of which provider is active. Provider is selected at runtime via `PAYMENT_PROVIDER` env var.

---

## 2. Project Context & Current Architecture {#context}

### How the CLI Works Right Now

```
bin/index.js
  → prompts user (language, auth, swagger)
  → copies template/[lang]/ to target directory
  → if auth selected: copies template/[lang]/src/modules/auth/
  → if swagger selected: copies template/[lang]/src/modules/swagger/
  → merges module package.json into base package.json
  → merges dependencies
```

### How Optional Modules Currently Wire In

Routes use **conditional dynamic imports based on file existence**:

```js
// src/routes/index.js (current pattern)
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Auth routes — only load if module exists
const authRoutesPath = join(__dirname, "../modules/auth/auth.routes.js");
if (existsSync(authRoutesPath)) {
  const { default: authRoutes } = await import(authRoutesPath);
  router.use("/auth", authRoutes);
}
```

The payments module **must follow this exact pattern**. Do not hardcode imports. Do not change the pattern.

### The Module Package Pattern

Every optional module has its own `package.json` with dependencies it needs:

```json
// template/js/src/modules/auth/package.json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }
}
```

The CLI reads this and merges it into the project's root `package.json`. The payments module must follow this exact same pattern.

---

## 3. Architecture Decision Records (ADRs) {#adrs}

These decisions are **final**. Do not re-evaluate during implementation.

### ADR-001: Adapter Pattern (Not Strategy Pattern)

**Decision**: Use adapter pattern — each provider implements a common `PaymentAdapter` interface.

**Rationale**: Providers have wildly different APIs (Stripe uses intents, LemonSqueezy uses checkouts). An adapter normalizes them. Controllers and services talk only to the adapter interface — they never import Stripe or LemonSqueezy SDK directly.

**Interface location**: `packages/payments/src/adapters/PaymentAdapter.js` (JS), `.ts` (TS)

### ADR-002: Provider Selection at Boot, Not Per-Request

**Decision**: Provider is instantiated once at startup based on `PAYMENT_PROVIDER` env var. Not switchable per-request.

**Rationale**: Simplicity. No multi-tenancy requirement at this scope.

### ADR-003: No Database Layer in the Package

**Decision**: The package does not create database tables or manage payment records. It processes payments and returns results. Persistence is the app developer's responsibility.

**Rationale**: Charcole templates use in-memory repos. Adding a DB dependency would force a DB choice. This is out of scope.

**Exception**: Webhook event logs can be stored in-memory for deduplication during server lifetime.

### ADR-004: Webhooks Are First-Class Citizens

**Decision**: Webhook endpoints are included by default, not optional.

**Rationale**: Without webhooks, payment confirmation is unreliable (users close tabs, network drops). Webhooks are the only reliable payment confirmation method.

### ADR-005: LemonSqueezy for Regional Support, Not as Secondary

**Decision**: LemonSqueezy is a first-class adapter, equal to Stripe. No "fallback" language.

**Rationale**: For Pakistani developers, LemonSqueezy IS the primary provider. Framing it as regional/fallback is disrespectful to the use case.

### ADR-006: Zod Everywhere

**Decision**: All incoming request bodies, all env vars, all webhook payloads are validated with Zod before processing.

**Rationale**: Consistent with existing Charcole codebase.

### ADR-007: No Express Router Injection via Middleware

**Decision**: `setupPayments(app, options)` calls `app.use('/payments', paymentsRouter)` directly.

**Rationale**: Mirrors how `setupSwagger` works. Consistent pattern.

---

## 4. Detailed File Map {#file-map}

### Files to CREATE

```
packages/payments/
├── src/
│   ├── index.js                     # Public API: setupPayments(), createAdapter()
│   ├── index.d.ts                   # TypeScript definitions for standalone package
│   ├── adapters/
│   │   ├── PaymentAdapter.js        # Abstract interface (JSDoc annotated)
│   │   ├── StripeAdapter.js         # Stripe implementation
│   │   └── LemonSqueezyAdapter.js  # LemonSqueezy implementation
│   ├── controllers/
│   │   └── payments.controller.js  # Route handlers
│   ├── services/
│   │   └── payments.service.js     # Business logic layer
│   ├── schemas/
│   │   └── payments.schemas.js     # Zod request/response schemas
│   ├── routes/
│   │   └── payments.routes.js      # Express router
│   ├── errors/
│   │   └── PaymentError.js         # Custom error class
│   └── helpers/
│       └── webhookUtils.js         # Signature verification helpers
├── package.json
├── README.md
├── CHANGELOG.md
└── charcole-payments-1.0.0.tgz    # Built tarball (generated, not committed)

template/js/src/modules/payments/
├── package.json                     # { "dependencies": { "stripe": "^14", "@lemonsqueezy/lemonsqueezy-js": "^3" } }
├── payments.constants.js
├── payments.controller.js
├── payments.service.js
├── payments.schemas.js
├── payments.routes.js
└── payments.adapter.js             # Provider factory (reads PAYMENT_PROVIDER env)

template/ts/src/modules/payments/
├── package.json                     # Same deps
├── payments.constants.ts
├── payments.controller.ts
├── payments.service.ts
├── payments.schemas.ts
├── payments.routes.ts
├── payments.adapter.ts
└── payments.types.ts               # TS-only: all types/interfaces
```

### Files to MODIFY

```
bin/index.js
  → Add payments prompt (yes/no)
  → Add provider selection prompt (stripe / lemonsqueezy / both)
  → Add payments module copy logic
  → Add payments tarball copy (if standalone package used)

template/js/src/routes/index.js
  → Add conditional payments routes import

template/ts/src/routes/index.ts
  → Add conditional payments routes import

template/js/src/config/env.js
  → Add PAYMENT_PROVIDER, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
    LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET, LEMONSQUEEZY_STORE_ID

template/ts/src/config/env.ts
  → Same additions

template/js/.env.example
  → Add payment vars section

template/ts/.env.example
  → Add payment vars section

template/ts/.env
  → Add payment vars (empty values)

CHANGELOG.md (root)
  → Add v2.3.0 entry

README.md (root)
  → Add payments section

packages/payments/CHANGELOG.md
  → Initial v1.0.0 entry
```

---

## 5. Package: `@charcoles/payments` — Deep Spec {#package-spec}

### `packages/payments/package.json`

```json
{
  "name": "@charcoles/payments",
  "version": "1.0.0",
  "description": "Drop-in payment processing for Express apps. Stripe + LemonSqueezy.",
  "type": "module",
  "main": "./src/index.js",
  "types": "./src/index.d.ts",
  "exports": {
    ".": {
      "import": "./src/index.js",
      "types": "./src/index.d.ts"
    }
  },
  "files": ["src", "README.md", "CHANGELOG.md"],
  "scripts": {
    "build": "node build.js",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "peerDependencies": {
    "express": "^4.18.0 || ^5.0.0"
  },
  "dependencies": {
    "stripe": "^14.0.0",
    "@lemonsqueezy/lemonsqueezy-js": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "vitest": "^1.0.0",
    "express": "^4.18.0"
  },
  "keywords": ["payments", "stripe", "lemonsqueezy", "express", "charcole"],
  "license": "MIT"
}
```

### `packages/payments/src/index.js` — Public API

```js
export { setupPayments } from "./routes/payments.routes.js";
export { createAdapter } from "./adapters/PaymentAdapter.js";
export { StripeAdapter } from "./adapters/StripeAdapter.js";
export { LemonSqueezyAdapter } from "./adapters/LemonSqueezyAdapter.js";
export { PaymentError } from "./errors/PaymentError.js";
```

The `setupPayments(app, options)` function signature:

```js
/**
 * @param {import('express').Application} app
 * @param {Object} options
 * @param {'stripe' | 'lemonsqueezy'} options.provider
 * @param {string} [options.stripeSecretKey]
 * @param {string} [options.stripeWebhookSecret]
 * @param {string} [options.lemonSqueezyApiKey]
 * @param {string} [options.lemonSqueezyWebhookSecret]
 * @param {string} [options.lemonSqueezyStoreId]
 * @param {string} [options.mountPath='/payments']
 */
export function setupPayments(app, options) { ... }
```

---

## 6. Adapter Contracts (Exact Interfaces) {#adapter-contracts}

Every payment adapter **must** implement all of these methods. No exceptions.

### JS (JSDoc interface in `PaymentAdapter.js`)

```js
/**
 * @typedef {Object} CreatePaymentResult
 * @property {string} id - Provider-specific payment/checkout ID
 * @property {string} [clientSecret] - Stripe: client_secret for frontend
 * @property {string} [checkoutUrl] - LemonSqueezy: redirect URL
 * @property {string} status - 'pending' | 'requires_payment_method' | 'created'
 * @property {number} amount - Amount in smallest currency unit (cents)
 * @property {string} currency - ISO 4217 (e.g. 'usd', 'pkr')
 * @property {Object} metadata - Provider-specific raw response
 */

/**
 * @typedef {Object} RefundResult
 * @property {string} id - Refund ID
 * @property {string} status - 'succeeded' | 'pending' | 'failed'
 * @property {number} amount - Refunded amount in smallest unit
 */

/**
 * @typedef {Object} PaymentStatus
 * @property {string} id
 * @property {string} status - 'pending' | 'paid' | 'failed' | 'refunded'
 * @property {number} amount
 * @property {string} currency
 * @property {Object} metadata
 */

/**
 * Abstract PaymentAdapter interface.
 * All adapters must implement these methods.
 */
export class PaymentAdapter {
  /**
   * Create a payment intent (Stripe) or checkout session (LemonSqueezy).
   * @param {Object} params
   * @param {number} params.amount - Amount in smallest currency unit
   * @param {string} params.currency - ISO 4217
   * @param {Object} [params.metadata] - Arbitrary key-value metadata
   * @returns {Promise<CreatePaymentResult>}
   */
  async createPayment(params) {
    throw new Error("createPayment() must be implemented");
  }

  /**
   * Refund a payment.
   * @param {Object} params
   * @param {string} params.paymentId - ID from createPayment result
   * @param {number} [params.amount] - Partial refund amount. Full refund if omitted.
   * @returns {Promise<RefundResult>}
   */
  async refundPayment(params) {
    throw new Error("refundPayment() must be implemented");
  }

  /**
   * Get current payment status.
   * @param {string} paymentId
   * @returns {Promise<PaymentStatus>}
   */
  async getPaymentStatus(paymentId) {
    throw new Error("getPaymentStatus() must be implemented");
  }

  /**
   * Verify and parse a webhook payload.
   * @param {Buffer} rawBody - Raw request body (MUST be Buffer, not parsed JSON)
   * @param {string} signature - Provider signature header value
   * @returns {Promise<{ event: string, data: Object }>}
   * @throws {PaymentError} if signature verification fails
   */
  async verifyWebhook(rawBody, signature) {
    throw new Error("verifyWebhook() must be implemented");
  }
}
```

### TS (in `packages/payments/src/index.d.ts` and template `payments.types.ts`)

```ts
export interface CreatePaymentParams {
  amount: number; // smallest currency unit (e.g. cents)
  currency: string; // ISO 4217
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  id: string;
  clientSecret?: string; // Stripe only
  checkoutUrl?: string; // LemonSqueezy only
  status: "pending" | "requires_payment_method" | "created";
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface RefundParams {
  paymentId: string;
  amount?: number; // omit for full refund
}

export interface RefundResult {
  id: string;
  status: "succeeded" | "pending" | "failed";
  amount: number;
}

export interface PaymentStatus {
  id: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface WebhookResult {
  event: string;
  data: Record<string, unknown>;
}

export interface PaymentAdapter {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult>;
}

export interface SetupPaymentsOptions {
  provider: "stripe" | "lemonsqueezy";
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  lemonSqueezyApiKey?: string;
  lemonSqueezyWebhookSecret?: string;
  lemonSqueezyStoreId?: string;
  mountPath?: string; // default: '/payments'
}
```

---

## 7. Stripe Adapter — Implementation Guide {#stripe-adapter}

### File: `src/adapters/StripeAdapter.js`

```js
import Stripe from "stripe";
import { PaymentAdapter } from "./PaymentAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

export class StripeAdapter extends PaymentAdapter {
  #stripe;
  #webhookSecret;

  constructor({ secretKey, webhookSecret }) {
    super();
    if (!secretKey)
      throw new PaymentError("STRIPE_SECRET_KEY is required", "CONFIG_ERROR");
    if (!webhookSecret)
      throw new PaymentError(
        "STRIPE_WEBHOOK_SECRET is required",
        "CONFIG_ERROR",
      );
    this.#stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
    this.#webhookSecret = webhookSecret;
  }

  async createPayment({ amount, currency, metadata = {} }) {
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
  }

  async refundPayment({ paymentId, amount }) {
    const params = { payment_intent: paymentId };
    if (amount) params.amount = amount;

    const refund = await this.#stripe.refunds.create(params);

    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  }

  async getPaymentStatus(paymentId) {
    const intent = await this.#stripe.paymentIntents.retrieve(paymentId);

    const statusMap = {
      succeeded: "paid",
      requires_payment_method: "pending",
      requires_confirmation: "pending",
      processing: "pending",
      canceled: "failed",
      requires_action: "pending",
    };

    return {
      id: intent.id,
      status: statusMap[intent.status] ?? "pending",
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent,
    };
  }

  async verifyWebhook(rawBody, signature) {
    let event;
    try {
      event = this.#stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.#webhookSecret,
      );
    } catch (err) {
      throw new PaymentError(
        `Webhook signature verification failed: ${err.message}`,
        "WEBHOOK_INVALID",
      );
    }

    return {
      event: event.type, // e.g. 'payment_intent.succeeded'
      data: event.data.object, // the Stripe object
    };
  }
}
```

### Important Stripe Notes for AI Agents

1. **API version must be pinned** — Always use `apiVersion: "2024-06-20"`. Never use `latest`. Breaking changes happen.
2. **Webhook body must be raw Buffer** — Express `express.json()` middleware WILL break webhook verification if it parses the body first. The webhook route MUST use `express.raw({ type: 'application/json' })` as its middleware, not `express.json()`. This is the #1 Stripe integration mistake.
3. **`client_secret` is for frontend only** — Never log it, never store it in your DB, never return it from a GET endpoint.
4. **`amount` is in smallest currency unit** — USD: cents (100 = $1.00). PKR: paisas (100 = ₨1.00). This is Stripe's convention and must be communicated in API docs.
5. **Payment intents ≠ charges** — `createPaymentIntent` creates an intent. The charge happens when the frontend confirms it using the `client_secret`. The webhook `payment_intent.succeeded` is the reliable confirmation signal.

---

## 8. LemonSqueezy Adapter — Implementation Guide {#lemonsqueezy-adapter}

### File: `src/adapters/LemonSqueezyAdapter.js`

```js
import {
  lemonSqueezySetup,
  createCheckout,
  getOrder,
  createRefund,
  listWebhooks,
} from "@lemonsqueezy/lemonsqueezy-js";
import { createHmac } from "crypto";
import { PaymentAdapter } from "./PaymentAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";

export class LemonSqueezyAdapter extends PaymentAdapter {
  #apiKey;
  #webhookSecret;
  #storeId;

  constructor({ apiKey, webhookSecret, storeId }) {
    super();
    if (!apiKey)
      throw new PaymentError(
        "LEMONSQUEEZY_API_KEY is required",
        "CONFIG_ERROR",
      );
    if (!webhookSecret)
      throw new PaymentError(
        "LEMONSQUEEZY_WEBHOOK_SECRET is required",
        "CONFIG_ERROR",
      );
    if (!storeId)
      throw new PaymentError(
        "LEMONSQUEEZY_STORE_ID is required",
        "CONFIG_ERROR",
      );

    this.#apiKey = apiKey;
    this.#webhookSecret = webhookSecret;
    this.#storeId = storeId;

    lemonSqueezySetup({ apiKey });
  }

  async createPayment({ amount, currency, metadata = {} }) {
    // LemonSqueezy uses 'variants' (product variants) not raw amounts.
    // For generic payments, a "tip jar" or "custom amount" variant must exist in the store.
    // The variantId must be passed in metadata: metadata.variantId
    if (!metadata.variantId) {
      throw new PaymentError(
        "metadata.variantId is required for LemonSqueezy payments. Create a flexible-price product in your LS store.",
        "MISSING_VARIANT_ID",
      );
    }

    const checkout = await createCheckout(this.#storeId, metadata.variantId, {
      checkoutData: {
        custom: metadata,
        discounts: [],
      },
      productOptions: {
        enabledVariants: [Number(metadata.variantId)],
      },
    });

    if (checkout.error) {
      throw new PaymentError(checkout.error.message, "LS_CHECKOUT_FAILED");
    }

    return {
      id: checkout.data.data.id,
      checkoutUrl: checkout.data.data.attributes.url,
      status: "created",
      amount,
      currency,
      metadata: checkout.data.data,
    };
  }

  async refundPayment({ paymentId, amount }) {
    const refund = await createRefund({ orderId: paymentId });
    if (refund.error) {
      throw new PaymentError(refund.error.message, "LS_REFUND_FAILED");
    }
    return {
      id: refund.data.data.id,
      status: "pending",
      amount: amount ?? 0, // LS doesn't return amount in refund response
    };
  }

  async getPaymentStatus(paymentId) {
    const order = await getOrder(paymentId);
    if (order.error) {
      throw new PaymentError(order.error.message, "LS_ORDER_NOT_FOUND");
    }

    const attrs = order.data.data.attributes;
    const statusMap = {
      paid: "paid",
      pending: "pending",
      failed: "failed",
      refunded: "refunded",
    };

    return {
      id: String(order.data.data.id),
      status: statusMap[attrs.status] ?? "pending",
      amount: attrs.total,
      currency: attrs.currency,
      metadata: order.data.data,
    };
  }

  async verifyWebhook(rawBody, signature) {
    // LemonSqueezy uses HMAC-SHA256
    const hmac = createHmac("sha256", this.#webhookSecret);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (digest !== signature) {
      throw new PaymentError(
        "Webhook signature verification failed",
        "WEBHOOK_INVALID",
      );
    }

    const payload = JSON.parse(rawBody.toString());

    return {
      event: payload.meta.event_name, // e.g. 'order_created'
      data: payload.data,
    };
  }
}
```

### Important LemonSqueezy Notes for AI Agents

1. **LemonSqueezy uses products/variants, not raw amounts** — Unlike Stripe (where you pass any amount), LemonSqueezy requires a Product Variant ID. To accept variable amounts (like a custom invoice), the developer must create a "Pay What You Want" product in their LS dashboard and pass that variant's ID. Document this clearly in README and Swagger.

2. **Webhook header is `X-Signature`** — Not `Stripe-Signature`. Make sure the controller reads the right header: `req.headers['x-signature']`.

3. **LemonSqueezy orders have integer IDs** — Stripe uses string IDs like `pi_abc123`. LemonSqueezy uses numeric IDs like `12345`. Always coerce to string when returning from the adapter.

4. **LemonSqueezy checkout creates a hosted URL** — Unlike Stripe's `clientSecret` (which goes to a frontend element), LemonSqueezy returns a URL the user is redirected to. The frontend handling is completely different. Both must be documented clearly.

5. **`lemonSqueezySetup()` is global** — It sets a global API key. Call it once at startup. Do not call it per-request.

6. **LEMONSQUEEZY_STORE_ID is numeric** — It's the store ID from the LS dashboard URL: `app.lemonsqueezy.com/stores/[STORE_ID]`.

---

## 9. Template Integration — JS & TS {#template-integration}

### Module File: `payments.service.js` (JS Template)

```js
// template/js/src/modules/payments/payments.service.js
import { getAdapter } from "./payments.adapter.js";
import { PaymentError } from "./payments.adapter.js";

export async function createPayment({ amount, currency, metadata }) {
  const adapter = getAdapter();
  return adapter.createPayment({ amount, currency, metadata });
}

export async function refundPayment({ paymentId, amount }) {
  const adapter = getAdapter();
  return adapter.refundPayment({ paymentId, amount });
}

export async function getPaymentStatus(paymentId) {
  const adapter = getAdapter();
  return adapter.getPaymentStatus(paymentId);
}

export async function processWebhook(rawBody, signature) {
  const adapter = getAdapter();
  return adapter.verifyWebhook(rawBody, signature);
}
```

### Module File: `payments.adapter.js` (JS Template)

This is the **factory** — it reads `PAYMENT_PROVIDER` from env and returns the correct adapter. This is where the env validation happens for the adapter config.

```js
// template/js/src/modules/payments/payments.adapter.js
import { env } from "../../config/env.js";
import { StripeAdapter } from "@charcoles/payments/adapters/stripe";
import { LemonSqueezyAdapter } from "@charcoles/payments/adapters/lemonsqueezy";
import { PaymentError } from "@charcoles/payments";

let adapter = null;

export function getAdapter() {
  if (adapter) return adapter;

  if (env.PAYMENT_PROVIDER === "stripe") {
    adapter = new StripeAdapter({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });
  } else if (env.PAYMENT_PROVIDER === "lemonsqueezy") {
    adapter = new LemonSqueezyAdapter({
      apiKey: env.LEMONSQUEEZY_API_KEY,
      webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET,
      storeId: env.LEMONSQUEEZY_STORE_ID,
    });
  } else {
    throw new PaymentError(
      `Unknown PAYMENT_PROVIDER: ${env.PAYMENT_PROVIDER}`,
      "CONFIG_ERROR",
    );
  }

  return adapter;
}
```

### Module File: `payments.controller.js` (JS Template)

```js
// template/js/src/modules/payments/payments.controller.js
import * as paymentsService from "./payments.service.js";
import { sendSuccess } from "../../utils/response.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.js";

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
    const signature =
      provider === "stripe"
        ? req.headers["stripe-signature"]
        : req.headers["x-signature"];

    const result = await paymentsService.processWebhook(req.body, signature);
    // req.body is raw Buffer here (see route middleware)

    // TODO: Handle specific events here
    // result.event: 'payment_intent.succeeded' | 'order_created' | etc.
    // Persist to DB, send confirmation email, etc.

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};
```

### Module File: `payments.routes.js` (JS Template)

```js
// template/js/src/modules/payments/payments.routes.js
import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest.js";
import * as controller from "./payments.controller.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payments.schemas.js";

const router = Router();

// POST /payments/create-intent
router.post(
  "/create-intent",
  validateRequest(createPaymentSchema),
  controller.createPayment,
);

// POST /payments/refund
router.post(
  "/refund",
  validateRequest(refundPaymentSchema),
  controller.refundPayment,
);

// GET /payments/status/:paymentId
router.get("/status/:paymentId", controller.getPaymentStatus);

// POST /payments/webhook
// CRITICAL: raw body parsing must happen BEFORE express.json() for this route
// This is handled in app.js by mounting raw middleware BEFORE the global json middleware
router.post(
  "/webhook",
  // No validateRequest here — webhook bodies are provider-signed, not user input
  controller.handleWebhook,
);

export default router;
```

### CRITICAL: `app.js` Webhook Raw Body Setup

The webhook route requires a raw `Buffer` body, not a parsed JSON object. This requires special middleware ordering in `app.js`.

**Modify `template/js/src/app.js` to add:**

```js
// MUST come before express.json()
app.use("/payments/webhook", express.raw({ type: "application/json" }));

// Global JSON parsing (existing)
app.use(express.json());
```

**The raw middleware MUST be registered BEFORE `express.json()`.** This is non-negotiable and is the most common integration failure point.

> AI Agent Note: When modifying app.js, check if the payments module was selected before adding this middleware. Only add it if payments is included. Use the same file-existence check pattern as routes.

---

## 10. CLI Changes (`bin/index.js`) {#cli-changes}

### New Prompts to Add

Insert after the existing swagger prompt:

```js
// Add after swagger prompt
{
  type: "confirm",
  name: "includePayments",
  message: "Include payments module? (Stripe / LemonSqueezy)",
  initial: false,
},
{
  type: (prev) => (prev ? "select" : null),  // Only show if payments = true
  name: "paymentProvider",
  message: "Which payment provider will you use?",
  choices: [
    { title: "Stripe (global)", value: "stripe" },
    { title: "LemonSqueezy (Pakistan + global)", value: "lemonsqueezy" },
    { title: "Both (I'll switch via env var)", value: "both" },
  ],
  initial: 0,
},
```

### Module Copy Logic

Add after existing auth/swagger copy logic:

```js
if (answers.includePayments) {
  const paymentsSrc = join(templateDir, "src/modules/payments");
  const paymentsDest = join(targetDir, "src/modules/payments");
  await copyDir(paymentsSrc, paymentsDest);

  // Merge payments module dependencies
  const paymentsPackageJson = join(paymentsSrc, "package.json");
  await mergeDependencies(targetPackageJson, paymentsPackageJson);

  // Write PAYMENT_PROVIDER to .env.example comment
  // (env vars are empty — user fills them in)
}
```

### `templateHandler.js` — No Changes Required

The existing `copyDir` and `mergeDependencies` helpers should work. Verify they handle the payments module structure before modifying.

---

## 11. Environment Variables — Full Spec {#env-spec}

### All Payment-Related Env Vars

| Variable                      | Required      | Provider     | Description                        |
| ----------------------------- | ------------- | ------------ | ---------------------------------- |
| `PAYMENT_PROVIDER`            | YES           | Both         | `"stripe"` or `"lemonsqueezy"`     |
| `STRIPE_SECRET_KEY`           | If Stripe     | Stripe       | `sk_live_...` or `sk_test_...`     |
| `STRIPE_WEBHOOK_SECRET`       | If Stripe     | Stripe       | `whsec_...` from Stripe dashboard  |
| `STRIPE_PUBLISHABLE_KEY`      | No (frontend) | Stripe       | `pk_live_...` — for docs only      |
| `LEMONSQUEEZY_API_KEY`        | If LS         | LemonSqueezy | From LS API settings               |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | If LS         | LemonSqueezy | From LS webhook settings           |
| `LEMONSQUEEZY_STORE_ID`       | If LS         | LemonSqueezy | Numeric store ID from LS dashboard |

### `.env.example` Addition (both JS and TS templates)

```env
# ─── Payments ──────────────────────────────────────────────────────────────────
# PAYMENT_PROVIDER selects the active payment adapter.
# Options: "stripe" | "lemonsqueezy"
# Use "lemonsqueezy" if you're based in Pakistan (Stripe payouts don't work there).
PAYMENT_PROVIDER=

# Stripe — https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=   # Frontend only — safe to expose

# LemonSqueezy — https://app.lemonsqueezy.com/settings/api
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
```

### Zod Env Schema Addition (JS: `src/config/env.js`)

```js
// Add to existing env schema object:
PAYMENT_PROVIDER: z.enum(["stripe", "lemonsqueezy"]).optional(),

// Stripe (optional at schema level — validated at adapter init)
STRIPE_SECRET_KEY: z.string().optional(),
STRIPE_WEBHOOK_SECRET: z.string().optional(),

// LemonSqueezy
LEMONSQUEEZY_API_KEY: z.string().optional(),
LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
LEMONSQUEEZY_STORE_ID: z.string().optional(),
```

**Important**: Keep all payment vars as `.optional()` in the Zod schema. The adapter constructors enforce required fields based on selected provider. This prevents the server from crashing on startup when payments module isn't configured yet (dev experience).

---

## 12. Route & Endpoint Spec {#route-spec}

### All Endpoints

| Method | Path                          | Auth Required        | Body                | Description                       |
| ------ | ----------------------------- | -------------------- | ------------------- | --------------------------------- |
| `POST` | `/payments/create-intent`     | Yes (JWT)            | `CreatePaymentBody` | Create payment intent or checkout |
| `POST` | `/payments/refund`            | Yes (JWT)            | `RefundBody`        | Refund a payment                  |
| `GET`  | `/payments/status/:paymentId` | Yes (JWT)            | —                   | Get payment status                |
| `POST` | `/payments/webhook`           | No (signature-based) | Raw Buffer          | Receive provider webhook          |

### Request/Response Examples

**POST /payments/create-intent**

```json
// Request
{
  "amount": 2999,
  "currency": "usd",
  "metadata": {
    "orderId": "order_123",
    "userId": "user_456",
    "variantId": "78901"  // LemonSqueezy only
  }
}

// Response (Stripe)
{
  "success": true,
  "data": {
    "id": "pi_3abc...",
    "clientSecret": "pi_3abc..._secret_xyz",
    "status": "requires_payment_method",
    "amount": 2999,
    "currency": "usd"
  }
}

// Response (LemonSqueezy)
{
  "success": true,
  "data": {
    "id": "abc123",
    "checkoutUrl": "https://store.lemonsqueezy.com/checkout/buy/...",
    "status": "created",
    "amount": 2999,
    "currency": "usd"
  }
}
```

**POST /payments/webhook**

```
// No JSON body — raw Buffer
// Headers:
//   stripe-signature: t=...,v1=...      (Stripe)
//   x-signature: abc123def456...        (LemonSqueezy)

// Response (always 200 — never return 4xx to webhooks unless signature fails)
{ "received": true }
```

---

## 13. Zod Schemas — Full Definitions {#zod-schemas}

### `payments.schemas.js` (JS Template)

```js
import { z } from "zod"

export const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .int("amount must be an integer (smallest currency unit)")
    .positive("amount must be positive")
    .max(99999999, "amount exceeds maximum allowed"),

  currency: z
    .string({ required_error: "currency is required" })
    .length(3, "currency must be a 3-letter ISO 4217 code")
    .toLowerCase(),

  metadata: z
    .record(z.string())
    .optional()
    .default({}),
})

export const refundPaymentSchema = z.object({
  paymentId: z
    .string({ required_error: "paymentId is required" })
    .min(1, "paymentId cannot be empty"),

  amount: z
    .number()
    .int("amount must be an integer")
    .positive("amount must be positive")
    .optional(),
})

export const webhookQuerySchema = z.object({
  // No body validation — webhook bodies are raw Buffer
  // Signature is validated by the adapter
})

// Type exports for TS version
export type CreatePaymentBody = z.infer<typeof createPaymentSchema>
export type RefundPaymentBody = z.infer<typeof refundPaymentSchema>
```

---

## 14. Error Handling Strategy {#error-handling}

### Custom Error Class: `PaymentError`

```js
// packages/payments/src/errors/PaymentError.js
export class PaymentError extends Error {
  constructor(message, code = "PAYMENT_ERROR", statusCode = 400) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

### Error Codes Reference

| Code                      | HTTP | Meaning                                    |
| ------------------------- | ---- | ------------------------------------------ |
| `CONFIG_ERROR`            | 500  | Missing required env var or adapter config |
| `WEBHOOK_INVALID`         | 401  | Webhook signature verification failed      |
| `STRIPE_ERROR`            | 402  | Stripe API returned an error               |
| `LS_CHECKOUT_FAILED`      | 400  | LemonSqueezy checkout creation failed      |
| `LS_REFUND_FAILED`        | 400  | LemonSqueezy refund failed                 |
| `LS_ORDER_NOT_FOUND`      | 404  | LemonSqueezy order not found               |
| `MISSING_VARIANT_ID`      | 400  | LemonSqueezy variantId not in metadata     |
| `PROVIDER_NOT_CONFIGURED` | 500  | PAYMENT_PROVIDER env var not set           |
| `PAYMENT_ERROR`           | 400  | Generic payment error                      |

### How `PaymentError` Integrates with Existing `errorHandler.js`

The existing Charcole error handler checks `err.statusCode`. `PaymentError` sets this correctly. **No changes to `errorHandler.js` are needed** if `PaymentError` extends the base error class correctly.

Verify this by checking `template/*/src/middlewares/errorHandler.*` — if it uses `err.statusCode`, `PaymentError` will work without changes.

---

## 15. Webhook Handling — Security & Verification {#webhooks}

### The Raw Body Problem (Critical)

HTTP middleware in Express parses the body as JSON. Stripe/LemonSqueezy signature verification requires the **original raw bytes**. Once `express.json()` parses the body, the raw bytes are gone. The solution:

```js
// app.js — ORDER MATTERS
app.use("/payments/webhook", express.raw({ type: "application/json" }));
// ^ Register BEFORE express.json()
app.use(express.json());
// ^ Global JSON parsing for all other routes
```

When `express.raw()` runs first on `/payments/webhook`, `req.body` is a `Buffer`. The global `express.json()` does NOT re-process routes already handled.

### Idempotency — Duplicate Webhook Prevention

Webhook providers retry on failure. The same event can arrive multiple times. Without deduplication, a `payment_intent.succeeded` event could trigger multiple order fulfillments.

**Minimum implementation**: In-memory `Set` of processed event IDs. Clears on server restart (acceptable for v2.3.0 scope).

```js
// In payments.service.js
const processedWebhookIds = new Set();

export async function processWebhook(rawBody, signature) {
  const adapter = getAdapter();
  const { event, data } = await adapter.verifyWebhook(rawBody, signature);

  const eventId = data.id ?? `${event}-${Date.now()}`;

  if (processedWebhookIds.has(eventId)) {
    return { event, data, duplicate: true };
  }

  processedWebhookIds.add(eventId);
  return { event, data, duplicate: false };
}
```

**Production note** (document in README): For production, use Redis or a database table to persist processed event IDs.

### Webhook Events to Handle (Document, Not Implement)

| Stripe Event                    | LemonSqueezy Event       | Meaning            |
| ------------------------------- | ------------------------ | ------------------ |
| `payment_intent.succeeded`      | `order_created`          | Payment confirmed  |
| `payment_intent.payment_failed` | `order_refunded`         | Payment failed     |
| `charge.dispute.created`        | —                        | Chargeback created |
| `customer.subscription.deleted` | `subscription_cancelled` | Subscription ended |

The controller logs these events. Actual business logic (fulfill order, send email) is the developer's responsibility.

---

## 16. Testing Strategy — Full Coverage Plan {#testing}

### Test Framework: Vitest

All tests use Vitest. Match the pattern of any existing tests in the repo.

### Test File Locations

```
packages/payments/
└── src/
    └── __tests__/
        ├── StripeAdapter.test.js
        ├── LemonSqueezyAdapter.test.js
        ├── payments.service.test.js
        └── webhookUtils.test.js

template/js/src/modules/payments/
└── __tests__/
    ├── payments.controller.test.js
    └── payments.routes.test.js
```

### Unit Tests: StripeAdapter

```js
// StripeAdapter.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StripeAdapter } from "../adapters/StripeAdapter.js";

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc",
          status: "requires_payment_method",
          amount: 2999,
          currency: "usd",
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: "pi_test_123",
          status: "succeeded",
          amount: 2999,
          currency: "usd",
        }),
      },
      refunds: {
        create: vi.fn().mockResolvedValue({
          id: "re_test_456",
          status: "succeeded",
          amount: 2999,
        }),
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_test_123" } },
        }),
      },
    })),
  };
});

describe("StripeAdapter", () => {
  let adapter;

  beforeEach(() => {
    adapter = new StripeAdapter({
      secretKey: "sk_test_fake",
      webhookSecret: "whsec_fake",
    });
  });

  it("creates a payment intent", async () => {
    const result = await adapter.createPayment({
      amount: 2999,
      currency: "usd",
    });
    expect(result.id).toBe("pi_test_123");
    expect(result.clientSecret).toBeDefined();
    expect(result.status).toBe("requires_payment_method");
  });

  it("refunds a payment", async () => {
    const result = await adapter.refundPayment({ paymentId: "pi_test_123" });
    expect(result.id).toBe("re_test_456");
    expect(result.status).toBe("succeeded");
  });

  it("maps payment status correctly", async () => {
    const result = await adapter.getPaymentStatus("pi_test_123");
    expect(result.status).toBe("paid"); // "succeeded" maps to "paid"
  });

  it("verifies a valid webhook", async () => {
    const result = await adapter.verifyWebhook(
      Buffer.from('{"test": true}'),
      "t=123,v1=abc",
    );
    expect(result.event).toBe("payment_intent.succeeded");
  });

  it("throws PaymentError for invalid webhook signature", async () => {
    const { StripeAdapter } = await import("../adapters/StripeAdapter.js");
    // Force constructEvent to throw
    // ...
  });

  it("throws CONFIG_ERROR when secretKey is missing", () => {
    expect(() => new StripeAdapter({ webhookSecret: "whsec_fake" })).toThrow(
      "STRIPE_SECRET_KEY is required",
    );
  });
});
```

### Unit Tests: LemonSqueezyAdapter (pattern only)

Test all 4 adapter methods with mocked `@lemonsqueezy/lemonsqueezy-js` functions. Test that HMAC verification throws on invalid signatures.

### Integration Tests: CLI Generation

```js
// Test that selecting payments generates correct files
it("generates payments module when selected", async () => {
  const result = await runCLI({ payments: true, provider: "stripe" });
  expect(result.files).toContain("src/modules/payments/payments.routes.js");
  expect(result.packageJson.dependencies).toHaveProperty("stripe");
});

it("does not generate payments module when not selected", async () => {
  const result = await runCLI({ payments: false });
  expect(result.files).not.toContain("src/modules/payments");
});
```

### Integration Tests: HTTP Endpoints

Use `supertest` to test routes with a real Express app and mocked adapters.

```js
it("POST /payments/create-intent returns 201 with payment data", async () => {
  const res = await request(app)
    .post("/payments/create-intent")
    .set("Authorization", `Bearer ${testToken}`)
    .send({ amount: 2999, currency: "usd" });

  expect(res.status).toBe(201);
  expect(res.body.data.id).toBeDefined();
});

it("POST /payments/webhook returns 200 without auth", async () => {
  const res = await request(app)
    .post("/payments/webhook")
    .set("stripe-signature", mockSignature)
    .set("Content-Type", "application/json")
    .send(Buffer.from('{"id": "evt_test"}'));

  expect(res.status).toBe(200);
  expect(res.body.received).toBe(true);
});
```

---

## 17. Code Style Rules (Enforced) {#code-style}

These rules **must** be followed by AI agents generating code. Do not deviate.

### JS Template Rules

- No semicolons
- 2 spaces indentation
- ES modules (`import/export`)
- `async/await` — never `.then()`
- Arrow functions for callbacks and inline functions
- Named exports for controllers/services, default export for router
- No `console.log` in production code — use the `logger` utility
- Error handling: always `try/catch` in controllers, always `next(err)`

### TS Template Rules

- Semicolons at end of statements
- Explicit return types on all exported functions
- No `any` — use `unknown` if type is truly unknown, then narrow
- Interfaces for object shapes, `type` for unions/intersections
- `readonly` on interface properties where mutation isn't intended

### Naming Conventions

| Type             | Convention                  | Example               |
| ---------------- | --------------------------- | --------------------- |
| Variables        | camelCase                   | `paymentResult`       |
| Functions        | camelCase                   | `createPayment`       |
| Classes          | PascalCase                  | `StripeAdapter`       |
| Interfaces/Types | PascalCase                  | `PaymentAdapter`      |
| Constants        | UPPER_CASE                  | `PAYMENT_PROVIDER`    |
| Files            | kebab-case or dot-separated | `payments.service.js` |
| Directories      | kebab-case                  | `payments/`           |

### Import Order

```js
// 1. Node built-ins
import { createHmac } from "crypto";
import { existsSync } from "fs";

// 2. External packages
import Stripe from "stripe";
import { z } from "zod";

// 3. Internal absolute (config, utils)
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// 4. Internal relative (same module)
import { PaymentAdapter } from "./PaymentAdapter.js";
import { PaymentError } from "../errors/PaymentError.js";
```

---

## 18. Swagger / OpenAPI Integration {#swagger}

### Auto-Documentation

If the `swagger` module is also selected during CLI setup, payment endpoints must be documented. Add JSDoc comments to `payments.routes.js` following the existing swagger pattern in `SWAGGER_GUIDE.md`.

### Swagger Comments Template

```js
/**
 * @swagger
 * /payments/create-intent:
 *   post:
 *     summary: Create a payment intent or checkout session
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, currency]
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in smallest currency unit (cents for USD, paisas for PKR)
 *                 example: 2999
 *               currency:
 *                 type: string
 *                 description: ISO 4217 currency code
 *                 example: usd
 *               metadata:
 *                 type: object
 *                 description: Optional metadata. LemonSqueezy requires variantId here.
 *     responses:
 *       201:
 *         description: Payment intent created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
```

Add equivalent comments for `/refund`, `/status/:paymentId`, and `/webhook`.

---

## 19. Migration Guide (Existing Projects) {#migration}

For developers who already have a Charcole project and want to add payments:

### Step 1 — Install Package

```bash
npm install @charcoles/payments
```

### Step 2 — Add Env Vars

Copy the payment section from `.env.example` into your `.env`:

```env
PAYMENT_PROVIDER=lemonsqueezy
LEMONSQUEEZY_API_KEY=your_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_secret_here
LEMONSQUEEZY_STORE_ID=12345
```

### Step 3 — Update `app.js`/`app.ts`

```js
// Add BEFORE express.json()
import { setupPayments } from "@charcoles/payments";
app.use("/payments/webhook", express.raw({ type: "application/json" }));

// After express.json() and other middleware
setupPayments(app);
```

### Step 4 — Update Env Schema

Add payment vars to `src/config/env.js`:

```js
PAYMENT_PROVIDER: z.enum(["stripe", "lemonsqueezy"]).optional(),
LEMONSQUEEZY_API_KEY: z.string().optional(),
// etc.
```

### Step 5 — Test

```bash
curl -X POST http://localhost:3000/payments/create-intent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 999, "currency": "usd", "metadata": {"variantId": "12345"}}'
```

---

## 20. Release Checklist {#release-checklist}

### Pre-Release

- [ ] All unit tests pass: `npm run test:run` in `packages/payments/`
- [ ] All integration tests pass
- [ ] Generated JS project starts without errors
- [ ] Generated TS project starts without errors (no type errors)
- [ ] Both providers tested with real test credentials
- [ ] Stripe webhook tested with `stripe listen --forward-to localhost:3000/payments/webhook`
- [ ] LemonSqueezy webhook tested with ngrok or similar tunnel
- [ ] `setupPayments()` works in a blank Express app (independence test)
- [ ] Swagger UI shows all payment endpoints when swagger module is also selected

### Documentation

- [ ] `packages/payments/README.md` — Full setup guide for standalone use
- [ ] Payment section added to root `README.md`
- [ ] `template/*/lib/swagger/SWAGGER_GUIDE.md` updated with payment examples
- [ ] Migration guide reviewed and tested

### Release

- [ ] `packages/payments/package.json` version set to `1.0.0`
- [ ] Root `package.json` version bumped to `2.3.0`
- [ ] Root `CHANGELOG.md` entry added for `v2.3.0`
- [ ] `packages/payments/CHANGELOG.md` entry added for `v1.0.0`
- [ ] `npm run build` in `packages/payments/` produces tarball
- [ ] `npm publish` for `@charcoles/payments`
- [ ] Charcole `v2.3.0` tagged and published

---

## 21. AI Agent Instructions {#ai-agent-instructions}

You are implementing the payments module for Charcole v2.3.0. Read this entire document before writing a single line of code.

### Before Starting Any Task

1. Read the existing file you're modifying before making changes
2. Never overwrite existing functionality — add to it
3. Follow the code style rules in Section 17 exactly
4. Run tests after every significant change
5. The webhook raw body setup is the #1 integration failure point — always verify it's correct

### Implementation Order (Strict)

Follow this order. Do not parallelize phases that depend on each other.

```
Phase 1 — Package Foundation
  1.1  Create packages/payments/ directory structure
  1.2  Implement PaymentError class
  1.3  Implement PaymentAdapter interface
  1.4  Implement StripeAdapter (with all 4 methods)
  1.5  Implement LemonSqueezyAdapter (with all 4 methods)
  1.6  Implement setupPayments() function
  1.7  Write and pass unit tests for both adapters
  1.8  Verify standalone usage works in a test Express app

Phase 2 — JS Template
  2.1  Create template/js/src/modules/payments/ files
  2.2  Modify template/js/src/app.js (webhook raw body)
  2.3  Modify template/js/src/routes/index.js (conditional import)
  2.4  Modify template/js/src/config/env.js (add payment vars)
  2.5  Modify template/js/.env.example (add payment vars)

Phase 3 — TS Template
  3.1  Create template/ts/src/modules/payments/ files
  3.2  Modify template/ts/src/app.ts (webhook raw body)
  3.3  Modify template/ts/src/routes/index.ts (conditional import)
  3.4  Modify template/ts/src/config/env.ts (add payment vars)
  3.5  Modify template/ts/.env.example (add payment vars)
  3.6  Verify no TypeScript compilation errors

Phase 4 — CLI
  4.1  Modify bin/index.js (add prompts + copy logic)
  4.2  Test CLI generation with payments selected
  4.3  Test CLI generation with payments NOT selected (regression)

Phase 5 — Tests & Docs
  5.1  Write integration tests for generated projects
  5.2  Update Swagger guide
  5.3  Update root README
  5.4  Write packages/payments/README.md

Phase 6 — Release Prep
  6.1  Update CHANGELOG files
  6.2  Bump version numbers
  6.3  Build tarball
```

### Decision Rules for AI Agents

| Situation                                  | Rule                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| File already exists                        | Read it first, then modify. Never overwrite.                                   |
| Unsure about a type                        | Use `unknown` in TS, add JSDoc in JS. Never use `any`.                         |
| Unsure about error handling                | Throw `PaymentError` with a specific code. Never `throw new Error()` directly. |
| Need to add to app.js                      | Add ABOVE the existing middleware, not below. Webhook raw body must be first.  |
| Provider-specific logic needed             | Put it in the adapter. Never in the controller or service.                     |
| Test is failing                            | Fix the code, not the test.                                                    |
| Template doesn't have a type for something | Create it in `payments.types.ts`. Don't modify existing type files.            |

### What NOT to Do

- Do NOT add database integration (no Prisma, no knex, no pg)
- Do NOT hardcode API keys anywhere
- Do NOT change the `errorHandler.js` middleware
- Do NOT change how existing routes (auth, health) work
- Do NOT use `console.log` — use the `logger` utility
- Do NOT add payment module imports that are unconditional in `routes/index.*` — use the `existsSync` pattern
- Do NOT assume `req.body` is a Buffer in non-webhook routes
- Do NOT use CommonJS (`require`) — use ES modules everywhere

---

## 22. Common Pitfalls & How to Avoid Them {#pitfalls}

### Pitfall 1: Webhook Raw Body

**Problem**: `express.json()` parses the body before the webhook handler runs, destroying the raw bytes needed for signature verification.

**Solution**: Register `express.raw({ type: 'application/json' })` on the webhook path BEFORE `express.json()` in `app.js`. This is documented in Section 9 and must be done in both JS and TS templates.

**How to verify**: `typeof req.body === 'object' && Buffer.isBuffer(req.body)` should be true in the webhook controller.

---

### Pitfall 2: LemonSqueezy Requires Product Variants

**Problem**: You try to create a payment with just `amount` and `currency`, but LemonSqueezy throws a 422 because it doesn't accept raw amounts.

**Solution**: Document clearly that LemonSqueezy requires `metadata.variantId`. Add validation in `createPaymentSchema` or the adapter constructor. Include setup instructions in README for creating a "custom amount" product in the LS dashboard.

---

### Pitfall 3: Status Code Mismatch

**Problem**: Stripe and LemonSqueezy use different status strings. Stripe: `succeeded`, `requires_payment_method`. LemonSqueezy: `paid`, `pending`.

**Solution**: The adapter normalizes all statuses to the `PaymentStatus.status` union: `'pending' | 'paid' | 'failed' | 'refunded'`. Use the `statusMap` objects in each adapter. The controller and service only ever see the normalized statuses.

---

### Pitfall 4: Webhook 4xx Response Causes Retries

**Problem**: If the webhook endpoint returns a 4xx, providers will retry the webhook. This can create a retry storm if there's a bug.

**Solution**: The webhook controller should return 200 for signature failures only after logging the error. Only return 4xx/5xx for genuine server errors. This is why the controller catches errors and returns `{ received: true }` even for some failure cases.

**Exception**: Return 401 for invalid signatures — this is correct behavior and providers expect it.

---

### Pitfall 5: TypeScript `strict` Mode

**Problem**: The TS template likely has `"strict": true` in `tsconfig.json`. Partial implementations with missing method bodies will fail compilation.

**Solution**: Implement ALL methods on ALL adapters. No `// TODO` stubs in production code. If a method is genuinely not supported (e.g., LemonSqueezy doesn't support partial refunds via API), throw a `PaymentError` with `NOT_SUPPORTED` code.

---

### Pitfall 6: Adapter Singleton and Test Isolation

**Problem**: `getAdapter()` caches the adapter in a module-level variable. Tests that change `PAYMENT_PROVIDER` between test cases will get the wrong adapter.

**Solution**: Export a `resetAdapter()` function that sets the cached adapter to `null`. Call it in `beforeEach` in tests.

```js
// payments.adapter.js
let adapter = null;
export function resetAdapter() {
  adapter = null;
}
```

---

_End of plan-2.3.0-enhanced.md — Charcole v2.3.0 Payments Module_
