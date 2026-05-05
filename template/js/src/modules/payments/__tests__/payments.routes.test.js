import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../payments.service.js', () => ({
  createPayment: vi.fn(),
  refundPayment: vi.fn(),
  getPaymentStatus: vi.fn(),
  processWebhook: vi.fn(),
}))

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

import paymentsRouter from '../payments.routes.js'
import * as service from '../payments.service.js'

function buildTestApp() {
  const app = express()
  app.use('/payments/webhook', express.raw({ type: 'application/json' }))
  app.use(express.json())
  app.use('/payments', paymentsRouter)
  app.use((err, req, res, next) => {
    res.status(err.statusCode ?? 500).json({ error: err.message, code: err.code })
  })
  return app
}

let app

beforeEach(() => {
  vi.clearAllMocks()
  process.env.PAYMENT_PROVIDER = 'stripe'
  app = buildTestApp()
})

afterEach(() => {
  delete process.env.PAYMENT_PROVIDER
})

describe('payments.routes', () => {
  describe('POST /payments/create-intent', () => {
    it('returns 201 with payment data on valid Stripe request', async () => {
      const result = {
        id: 'pi_test',
        clientSecret: 'secret_abc',
        status: 'requires_payment_method',
        amount: 999,
        currency: 'usd',
      }
      service.createPayment.mockResolvedValue(result)

      const response = await request(app)
        .post('/payments/create-intent')
        .send({ amount: 999, currency: 'usd' })

      expect(response.status).toBe(201)
      expect(response.body.data.id).toBe('pi_test')
      expect(response.body.data.clientSecret).toBe('secret_abc')
      expect(service.createPayment).toHaveBeenCalledWith({ amount: 999, currency: 'usd', metadata: {} })
    })

    it('returns 201 with checkoutUrl on valid LemonSqueezy request', async () => {
      const result = {
        id: 'ls_test',
        checkoutUrl: 'https://store.lemonsqueezy.com/checkout/buy',
        status: 'created',
        amount: 999,
        currency: 'usd',
      }
      service.createPayment.mockResolvedValue(result)

      const response = await request(app)
        .post('/payments/create-intent')
        .send({ amount: 999, currency: 'usd', metadata: { variantId: '12345' } })

      expect(response.status).toBe(201)
      expect(response.body.data.checkoutUrl).toBe('https://store.lemonsqueezy.com/checkout/buy')
      expect(service.createPayment).toHaveBeenCalledWith({
        amount: 999,
        currency: 'usd',
        metadata: { variantId: '12345' },
      })
    })

    it('returns 400 when amount is missing', async () => {
      const response = await request(app).post('/payments/create-intent').send({ currency: 'usd' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('returns 400 when amount is a float', async () => {
      const response = await request(app).post('/payments/create-intent').send({ amount: 9.99, currency: 'usd' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('returns 400 when currency is wrong length', async () => {
      const response = await request(app).post('/payments/create-intent').send({ amount: 100, currency: 'us' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('returns 500 when service throws', async () => {
      const error = new Error('service failure')
      error.statusCode = 500
      service.createPayment.mockRejectedValue(error)

      const response = await request(app).post('/payments/create-intent').send({ amount: 999, currency: 'usd' })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('service failure')
    })
  })

  describe('POST /payments/refund', () => {
    it('returns 200 with refund data on valid request', async () => {
      const result = { id: 're_123', status: 'succeeded', amount: 500 }
      service.refundPayment.mockResolvedValue(result)

      const response = await request(app).post('/payments/refund').send({ paymentId: 'pi_123', amount: 500 })

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(result)
      expect(service.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: 500 })
    })

    it('returns 200 when amount is omitted (full refund)', async () => {
      const result = { id: 're_124', status: 'succeeded', amount: 0 }
      service.refundPayment.mockResolvedValue(result)

      const response = await request(app).post('/payments/refund').send({ paymentId: 'pi_123' })

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual(result)
      expect(service.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: undefined })
    })

    it('returns 400 when paymentId is missing', async () => {
      const response = await request(app).post('/payments/refund').send({ amount: 500 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('returns error status when service rejects', async () => {
      const error = new Error('refund failed')
      error.statusCode = 500
      service.refundPayment.mockRejectedValue(error)

      const response = await request(app).post('/payments/refund').send({ paymentId: 'pi_123', amount: 500 })

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('refund failed')
    })
  })

  describe('GET /payments/status/:paymentId', () => {
    it('returns 200 with payment status for a valid paymentId', async () => {
      const result = { id: 'pi_test_123', status: 'paid', amount: 999, currency: 'usd', metadata: {} }
      service.getPaymentStatus.mockResolvedValue(result)

      const response = await request(app).get('/payments/status/pi_test_123')

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('paid')
      expect(service.getPaymentStatus).toHaveBeenCalledWith('pi_test_123')
    })

    it('passes the paymentId from URL params to service', async () => {
      const result = { id: 'pi_specific_id', status: 'paid', amount: 999, currency: 'usd', metadata: {} }
      service.getPaymentStatus.mockResolvedValue(result)

      const response = await request(app).get('/payments/status/pi_specific_id')

      expect(response.status).toBe(200)
      expect(service.getPaymentStatus).toHaveBeenCalledWith('pi_specific_id')
      expect(response.body.data.id).toBe('pi_specific_id')
    })

    it('returns error status when service rejects', async () => {
      const error = new Error('status error')
      error.statusCode = 500
      service.getPaymentStatus.mockRejectedValue(error)

      const response = await request(app).get('/payments/status/pi_error')

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('status error')
    })
  })

  describe('POST /payments/webhook', () => {
    it('returns 200 { received: true } for valid Stripe webhook', async () => {
      service.processWebhook.mockResolvedValue({ event: 'payment_intent.succeeded', data: {}, duplicate: false })

      const response = await request(app)
        .post('/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'stripe-sig')
        .send(Buffer.from('{"id":"evt_test_001"}'))

      expect(response.status).toBe(200)
      expect(response.body.received).toBe(true)
      expect(service.processWebhook).toHaveBeenCalled()
      const rawArg = service.processWebhook.mock.calls[0][0]
      expect(Buffer.isBuffer(rawArg)).toBe(true)
      expect(rawArg.toString()).toBe('{"id":"evt_test_001"}')
    })

    it('returns 200 { received: true, duplicate: true } for duplicate event', async () => {
      service.processWebhook.mockResolvedValue({ event: 'payment_intent.succeeded', data: {}, duplicate: true })

      const response = await request(app)
        .post('/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'stripe-sig')
        .send(Buffer.from('{"id":"evt_test_002"}'))

      expect(response.status).toBe(200)
      expect(response.body.received).toBe(true)
      expect(response.body.duplicate).toBe(true)
    })

    it('returns 400 when signature header is missing', async () => {
      const response = await request(app)
        .post('/payments/webhook')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{"id":"evt_test_003"}'))

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Missing webhook signature header')
    })

    it('does NOT require Authorization header', async () => {
      service.processWebhook.mockResolvedValue({ event: 'payment_intent.succeeded', data: {}, duplicate: false })

      const response = await request(app)
        .post('/payments/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'stripe-sig')
        .send(Buffer.from('{"id":"evt_test_004"}'))

      expect(response.status).toBe(200)
      expect(response.body.received).toBe(true)
    })
  })
})
