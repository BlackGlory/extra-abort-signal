import { describe, test, it, expect, vi } from 'vitest'
import { withAbortSignal } from '@src/with-abort-signal.js'
import { AbortController } from '@src/abort-controller.js'
import { getErrorPromise } from 'return-style'
import { passAsync } from '@blackglory/pass'

describe('withAbortSignal', () => {
  describe('signal is Falsy', () => {
    test('resolved', async () => {
      const value = 1
      const fn = () => Promise.resolve(value)

      const result = await withAbortSignal(false, fn)

      expect(result).toBe(value)
    })

    test('rejected', async () => {
      const customError = new Error('custom error')
      const fn = () => Promise.reject(customError)

      const err = await getErrorPromise(withAbortSignal(false, fn))

      expect(err).toBe(customError)
    })
  })

  describe('signal isnt Falsy', () => {
    describe('signal already aborted', () => {
      it('throws reason and fn is not called', async () => {
        const customReason = new Error('custom reason')
        const fn = vi.fn(passAsync)
        const controller = new AbortController()
        controller.abort(customReason)

        const err = await getErrorPromise(withAbortSignal(controller.signal, fn))

        expect(err).toBe(customReason)
        expect(fn).not.toBeCalled()
      })
    })

    describe('signal is aborted after promise is resolved', () => {
      it('returns promise result', async () => {
        const customReason = new Error('custom reason')
        const value = 1
        const fn = () => Promise.resolve(value)
        const controller = new AbortController()

        setTimeout(() => controller.abort(customReason), 500)
        const result = await withAbortSignal(controller.signal, fn)

        expect(result).toBe(value)
      })
    })

    describe('signal is aborted after promise is rejected', () => {
      it('returns promise result', async () => {
        const customError = new Error('custom error')
        const customReason = new Error('custom reason')
        const fn = () => Promise.reject(customError)
        const controller = new AbortController()

        setTimeout(() => controller.abort(customReason), 500)
        const err = await getErrorPromise(withAbortSignal(controller.signal, fn))

        expect(err).toBe(customError)
      })
    })

    describe('signal is aborted before promise is resolved', () => {
      it('throws reason and fn is called', async () => {
        const customReason = new Error('custom reason')
        const fn = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
        const controller = new AbortController()

        setTimeout(() => controller.abort(customReason), 500)
        const err = await getErrorPromise(withAbortSignal(controller.signal, fn))

        expect(err).toBe(customReason)
        expect(fn).toBeCalled()
      })
    })

    describe('signal is aborted after promise is rejected', () => {
      it('throws reason and fn is called', async () => {
        const customError = new Error('custom error')
        const customReason = new Error('custom reason')
        const fn = vi.fn(() => new Promise((_, reject) => reject(customError)))
        const controller = new AbortController()

        setTimeout(() => controller.abort(customReason), 500)
        const err = await getErrorPromise(withAbortSignal(controller.signal, fn))

        expect(err).toBe(customError)
        expect(fn).toBeCalled()
      })
    })
  })
})
