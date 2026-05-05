import { describe, it, expect } from 'vitest'
import { createPaymentSchema, refundPaymentSchema } from '../payments.schemas.js'

describe('createPaymentSchema', () => {
  it('parses valid input correctly', () => {
    const result = createPaymentSchema.parse({ amount: 999, currency: 'usd' })

    expect(result).toEqual({ amount: 999, currency: 'usd', metadata: {} })
  })

  it('lowercases currency automatically', () => {
    const result = createPaymentSchema.parse({ amount: 100, currency: 'USD' })

    expect(result.currency).toBe('usd')
  })

  it('rejects non-integer amount', () => {
    expect(() => createPaymentSchema.parse({ amount: 9.99, currency: 'usd' })).toThrow()
  })

  it('rejects negative amount', () => {
    expect(() => createPaymentSchema.parse({ amount: -100, currency: 'usd' })).toThrow()
  })

  it('rejects zero amount', () => {
    expect(() => createPaymentSchema.parse({ amount: 0, currency: 'usd' })).toThrow()
  })

  it('rejects amount over maximum', () => {
    expect(() => createPaymentSchema.parse({ amount: 100000000, currency: 'usd' })).toThrow()
  })

  it('rejects currency longer than 3 chars', () => {
    expect(() => createPaymentSchema.parse({ amount: 100, currency: 'usdx' })).toThrow()
  })

  it('rejects currency shorter than 3 chars', () => {
    expect(() => createPaymentSchema.parse({ amount: 100, currency: 'us' })).toThrow()
  })

  it('rejects missing amount', () => {
    expect(() => createPaymentSchema.parse({ currency: 'usd' })).toThrow(/amount is required/)
  })

  it('rejects missing currency', () => {
    expect(() => createPaymentSchema.parse({ amount: 100 })).toThrow(/currency is required/)
  })

  it('accepts metadata as key-value string pairs', () => {
    const result = createPaymentSchema.parse({
      amount: 100,
      currency: 'usd',
      metadata: { orderId: '123', userId: '456' },
    })

    expect(result.metadata).toEqual({ orderId: '123', userId: '456' })
  })

  it('rejects metadata with non-string values', () => {
    expect(() =>
      createPaymentSchema.parse({ amount: 100, currency: 'usd', metadata: { count: 5 } }),
    ).toThrow()
  })
})

describe('refundPaymentSchema', () => {
  it('parses paymentId correctly', () => {
    const result = refundPaymentSchema.parse({ paymentId: 'pi_abc123' })

    expect(result).toEqual({ paymentId: 'pi_abc123', amount: undefined })
  })

  it('accepts optional partial refund amount', () => {
    const result = refundPaymentSchema.parse({ paymentId: 'pi_abc123', amount: 500 })

    expect(result.amount).toBe(500)
  })

  it('rejects empty paymentId', () => {
    expect(() => refundPaymentSchema.parse({ paymentId: '' })).toThrow()
  })

  it('rejects missing paymentId', () => {
    expect(() => refundPaymentSchema.parse({})).toThrow(/paymentId is required/)
  })

  it('rejects non-integer refund amount', () => {
    expect(() => refundPaymentSchema.parse({ paymentId: 'pi_abc', amount: 9.99 })).toThrow()
  })

  it('rejects negative refund amount', () => {
    expect(() => refundPaymentSchema.parse({ paymentId: 'pi_abc', amount: -100 })).toThrow()
  })
})
