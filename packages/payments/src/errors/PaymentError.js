export class PaymentError extends Error {
  constructor(message, code = "PAYMENT_ERROR", statusCode = 400) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
