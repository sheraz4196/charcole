import { PaymentError } from "./src/errors/PaymentError.js";
import { StripeAdapter } from "./src/adapters/StripeAdapter.js";

// Test 1: PaymentError works
const err = new PaymentError("test", "TEST_CODE", 400);
console.assert(err.name === "PaymentError", "FAIL: PaymentError.name");
console.assert(err.code === "TEST_CODE", "FAIL: PaymentError.code");
console.assert(err.statusCode === 400, "FAIL: PaymentError.statusCode");
console.log("✅ PaymentError works");

// Test 2: StripeAdapter rejects missing config
try {
  new StripeAdapter({});
  console.log("❌ StripeAdapter should have thrown");
} catch (e) {
  console.assert(e.code === "CONFIG_ERROR", "FAIL: wrong error code");
  console.log("✅ StripeAdapter rejects missing config");
}

console.log("\nSmoke test complete.");
