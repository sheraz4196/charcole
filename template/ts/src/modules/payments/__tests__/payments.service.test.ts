import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../payments.adapter.ts', () => ({
  getAdapter: vi.fn(),
  resetAdapter: vi.fn(),
}))

import { getAdapter } from '../payments.adapter.ts'
import * as service from '../payments.service.ts'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('payments.service', () => {
  it('delegates to adapter.createPayment and returns its result', async () => {
    const mockResult = {
      id: 'pi_test_123',
      clientSecret: 'secret_abc',
      status: 'requires_payment_method',
      amount: 999,
      currency: 'usd',
      metadata: {},
    }
    const adapter = { createPayment: vi.fn().mockResolvedValue(mockResult) }
    getAdapter.mockReturnValue(adapter)

    const result = await service.createPayment({ amount: 999, currency: 'usd' })

    expect(adapter.createPayment).toHaveBeenCalledWith({ amount: 999, currency: 'usd' })
    expect(result).toEqual(mockResult)
  })

  it('propagates errors from adapter.createPayment', async () => {
    const error = new Error('payment failed')
    const adapter = { createPayment: vi.fn().mockRejectedValue(error) }
    getAdapter.mockReturnValue(adapter)

    await expect(service.createPayment({ amount: 999, currency: 'usd' })).rejects.toThrow(error)
  })

  it('delegates to adapter.refundPayment with paymentId and amount', async () => {
    const mockResult = { id: 're_test_123', status: 'succeeded', amount: 500 }
    const adapter = { refundPayment: vi.fn().mockResolvedValue(mockResult) }
    getAdapter.mockReturnValue(adapter)

    const result = await service.refundPayment({ paymentId: 'pi_123', amount: 500 })

    expect(adapter.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: 500 })
    expect(result).toEqual(mockResult)
  })

  it('delegates to adapter.refundPayment without amount when not provided', async () => {
    const mockResult = { id: 're_test_124', status: 'succeeded', amount: 0 }
    const adapter = { refundPayment: vi.fn().mockResolvedValue(mockResult) }
    getAdapter.mockReturnValue(adapter)

    const result = await service.refundPayment({ paymentId: 'pi_123' })

    expect(adapter.refundPayment).toHaveBeenCalledWith({ paymentId: 'pi_123', amount: undefined })
    expect(result).toEqual(mockResult)
  })

  it('propagates adapter errors from refundPayment', async () => {
    const error = new Error('refund failed')
    const adapter = { refundPayment: vi.fn().mockRejectedValue(error) }
    getAdapter.mockReturnValue(adapter)

    await expect(service.refundPayment({ paymentId: 'pi_123', amount: 500 })).rejects.toThrow(error)
  })

  it('delegates to adapter.getPaymentStatus with the paymentId string', async () => {
    const mockResult = { id: 'pi_123', status: 'paid', amount: 999, currency: 'usd', metadata: {} }
    const adapter = { getPaymentStatus: vi.fn().mockResolvedValue(mockResult) }
    getAdapter.mockReturnValue(adapter)

    const result = await service.getPaymentStatus('pi_123')

    expect(adapter.getPaymentStatus).toHaveBeenCalledWith('pi_123')
    expect(result).toEqual(mockResult)
  })

  it('propagates adapter errors from getPaymentStatus', async () => {
    const error = new Error('status error')
    const adapter = { getPaymentStatus: vi.fn().mockRejectedValue(error) }
    getAdapter.mockReturnValue(adapter)

    await expect(service.getPaymentStatus('pi_123')).rejects.toThrow(error)
  })

  it('calls adapter.verifyWebhook and returns duplicate:false on first call', async () => {
    const adapter = { verifyWebhook: vi.fn().mockResolvedValue({ event: 'payment_intent.succeeded', data: { id: 'evt_001' } }) }
    getAdapter.mockReturnValue(adapter)

    const result = await service.processWebhook(Buffer.from('{"id":"evt_001"}'), 'sig')

    expect(adapter.verifyWebhook).toHaveBeenCalledWith(Buffer.from('{"id":"evt_001"}'), 'sig')
    expect(result.duplicate).toBe(false)
    expect(result.event).toBe('payment_intent.succeeded')
  })

  it('returns duplicate:true on second call with same event id', async () => {
    const event = { event: 'payment_intent.succeeded', data: { id: 'evt_002' } }
    const adapter = { verifyWebhook: vi.fn().mockResolvedValue(event) }
    getAdapter.mockReturnValue(adapter)

    const first = await service.processWebhook(Buffer.from('{"id":"evt_002"}'), 'sig')
    const second = await service.processWebhook(Buffer.from('{"id":"evt_002"}'), 'sig')

    expect(first.duplicate).toBe(false)
    expect(second.duplicate).toBe(true)
    expect(adapter.verifyWebhook).toHaveBeenCalledTimes(2)
  })

  it('treats events without id as unique using event+timestamp', async () => {
    const adapter = { verifyWebhook: vi.fn().mockResolvedValue({ event: 'some_event', data: {} }) }
    getAdapter.mockReturnValue(adapter)

    const first = await service.processWebhook(Buffer.from('{"id":"evt_none_1"}'), 'sig')
    await new Promise((resolve) => setTimeout(resolve, 1))
    const second = await service.processWebhook(Buffer.from('{"id":"evt_none_2"}'), 'sig')

    expect(first.duplicate).toBe(false)
    expect(second.duplicate).toBe(false)
    expect(adapter.verifyWebhook).toHaveBeenCalledTimes(2)
  })

  it('propagates PaymentError WEBHOOK_INVALID from adapter', async () => {
    const error = new Error('bad sig')
    const adapter = { verifyWebhook: vi.fn().mockRejectedValue(error) }
    getAdapter.mockReturnValue(adapter)

    await expect(service.processWebhook(Buffer.from('{"id":"evt_003"}'), 'sig')).rejects.toThrow(error)
  })
})
