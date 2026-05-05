import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../payments.service.ts', () => ({
  createPayment: vi.fn(),
  refundPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  processWebhook: vi.fn(),
}))

vi.mock('../../../utils/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import * as controller from '../payments.controller.ts'
import * as service from '../payments.service.ts'

function buildMocks(overrides: Record<string, unknown> = {}) {
  const req = {
    body: {} as unknown,
    params: {} as Record<string, string>,
    headers: {} as Record<string, unknown>,
    ...overrides,
  }

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  const next = vi.fn()

  return { req, res, next }
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.PAYMENT_PROVIDER
})

describe('createPayment controller', () => {
  it('calls service.createPayment with validated body and responds 201', async () => {
    const result = {
      id: 'pi_test_123',
      clientSecret: 'secret_abc',
      status: 'requires_payment_method',
      amount: 999,
      currency: 'usd',
      metadata: {},
    }
    service.createPayment.mockResolvedValue(result)

    const { req, res, next } = buildMocks({ body: { amount: 999, currency: 'usd' } })

    await controller.createPayment(req as any, res as any, next)

    expect(service.createPayment).toHaveBeenCalledWith({ amount: 999, currency: 'usd', metadata: {} })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when schema validation fails', async () => {
    const { req, res, next } = buildMocks({ body: { amount: 'not-a-number', currency: 'usd' } })

    await controller.createPayment(req as any, res as any, next)

    expect(next).toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('calls next(err) when service.createPayment rejects', async () => {
    const error = new Error('stripe down')
    service.createPayment.mockRejectedValue(error)

    const { req, res, next } = buildMocks({ body: { amount: 999, currency: 'usd' } })

    await controller.createPayment(req as any, res as any, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('currency is lowercased by the schema', async () => {
    const result = {
      id: 'pi_test_123',
      clientSecret: 'secret_abc',
      status: 'requires_payment_method',
      amount: 100,
      currency: 'usd',
      metadata: {},
    }
    service.createPayment.mockResolvedValue(result)

    const { req, res, next } = buildMocks({ body: { amount: 100, currency: 'USD' } })

    await controller.createPayment(req as any, res as any, next)

    expect(service.createPayment).toHaveBeenCalledWith({ amount: 100, currency: 'usd', metadata: {} })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }))
    expect(next).not.toHaveBeenCalled()
  })
})

describe('refundPayment controller', () => {
  it('calls service.refundPayment with paymentId and optional amount, responds 200', async () => {
    const result = { id: 're_test_123', status: 'succeeded', amount: 500 }
    service.refundPayment.mockResolvedValue(result)

    const { req, res, next } = buildMocks({ body: { paymentId: 'pi_123', amount: 500 } })

    await controller.refundPayment(req as any, res as any, next)

    expect(service.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: 500 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls service.refundPayment with just paymentId when amount is omitted', async () => {
    const result = { id: 're_test_456', status: 'succeeded', amount: 0 }
    service.refundPayment.mockResolvedValue(result)

    const { req, res, next } = buildMocks({ body: { paymentId: 'pi_123' } })

    await controller.refundPayment(req as any, res as any, next)

    expect(service.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: undefined })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when paymentId is missing from body', async () => {
    const { req, res, next } = buildMocks({ body: { amount: 500 } })

    await controller.refundPayment(req as any, res as any, next)

    expect(next).toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('calls next(err) when service.refundPayment rejects', async () => {
    const error = new Error('refund failed')
    service.refundPayment.mockRejectedValue(error)

    const { req, res, next } = buildMocks({ body: { paymentId: 'pi_123', amount: 500 } })

    await controller.refundPayment(req as any, res as any, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('getPaymentStatus controller', () => {
  it('calls service.getPaymentStatus with req.params.paymentId and responds with result', async () => {
    const result = { id: 'pi_123', status: 'paid', amount: 999, currency: 'usd', metadata: {} }
    service.getPaymentStatus.mockResolvedValue(result)

    const { req, res, next } = buildMocks({ params: { paymentId: 'pi_123' } })

    await controller.getPaymentStatus(req as any, res as any, next)

    expect(service.getPaymentStatus).toHaveBeenCalledWith('pi_123')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }))
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when service rejects', async () => {
    const error = new Error('status lookup failed')
    service.getPaymentStatus.mockRejectedValue(error)

    const { req, res, next } = buildMocks({ params: { paymentId: 'pi_123' } })

    await controller.getPaymentStatus(req as any, res as any, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('handleWebhook controller', () => {
  it('reads stripe-signature header when PAYMENT_PROVIDER is stripe', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe'
    const result = { event: 'payment_intent.succeeded', data: {}, duplicate: false }
    service.processWebhook.mockResolvedValue(result)

    const { req, res, next } = buildMocks({
      headers: { 'stripe-signature': 'test-sig' },
      body: Buffer.from('{"id":"evt_123"}'),
    })

    await controller.handleWebhook(req as any, res as any, next)

    expect(service.processWebhook).toHaveBeenCalledWith(req.body, 'test-sig')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('reads x-signature header when PAYMENT_PROVIDER is lemonsqueezy', async () => {
    process.env.PAYMENT_PROVIDER = 'lemonsqueezy'
    const result = { event: 'order_created', data: {}, duplicate: false }
    service.processWebhook.mockResolvedValue(result)

    const { req, res, next } = buildMocks({
      headers: { 'x-signature': 'hmac-sig' },
      body: Buffer.from('{"id":"evt_456"}'),
    })

    await controller.handleWebhook(req as any, res as any, next)

    expect(service.processWebhook).toHaveBeenCalledWith(req.body, 'hmac-sig')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 200 { received: true, duplicate: true } for duplicate events', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe'
    const result = { event: 'payment_intent.succeeded', data: { id: 'evt_789' }, duplicate: true }
    service.processWebhook.mockResolvedValue(result)

    const { req, res, next } = buildMocks({
      headers: { 'stripe-signature': 'test-sig' },
      body: Buffer.from('{"id":"evt_789"}'),
    })

    await controller.handleWebhook(req as any, res as any, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true, duplicate: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('responds 400 when signature header is missing', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe'
    const { req, res, next } = buildMocks({ body: Buffer.from('{"id":"evt_000"}') })

    await controller.handleWebhook(req as any, res as any, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing webhook signature header' })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next(err) when processWebhook rejects', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe'
    const error = new Error('invalid signature')
    service.processWebhook.mockRejectedValue(error)

    const { req, res, next } = buildMocks({
      headers: { 'stripe-signature': 'test-sig' },
      body: Buffer.from('{"id":"evt_999"}'),
    })

    await controller.handleWebhook(req as any, res as any, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('passes req.body as raw Buffer to processWebhook', async () => {
    process.env.PAYMENT_PROVIDER = 'stripe'
    const result = { event: 'payment_intent.succeeded', data: {}, duplicate: false }
    service.processWebhook.mockResolvedValue(result)

    const { req, res, next } = buildMocks({
      headers: { 'stripe-signature': 'test-sig' },
      body: Buffer.from('{"id":"evt_buffer"}'),
    })

    await controller.handleWebhook(req as any, res as any, next)

    const rawArg = service.processWebhook.mock.calls[0][0]
    expect(Buffer.isBuffer(rawArg)).toBe(true)
    expect(rawArg.toString()).toBe('{"id":"evt_buffer"}')
    expect(next).not.toHaveBeenCalled()
  })
})
