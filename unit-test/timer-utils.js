import fc from 'fast-check'
import { DEFAULT_RETRY_CONFIG, retry } from '../src/timer-utils.js'

describe('retry function tests', () => {
    it('should always catch errors if the retried function always throws', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 1, max: 10 }).map(n => ({ ...DEFAULT_RETRY_CONFIG, maxAttempts: n })), async (config) => {
                const errorFunction = jasmine.createSpy('errorFunction', () => {
                    throw new Error('Always fails') // A function that always throws an error
                }).and.callThrough()

                const { result, exceptions } = await retry(errorFunction, config)

                // The result of our retry operation should be undefined since we always fail
                expect(result).toBe(undefined)

                // The error function should have been called config.maxAttempts times
                expect(errorFunction.calls.count()).toEqual(config.maxAttempts)

                // Size of errors should be equal to maxAttempts because the function always fails
                expect(exceptions.length).toEqual(config.maxAttempts)
            }))
    })
    it('should assign lastResult correctly and stop retrying when success is obtained', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 1, max: 10 }).map(n => ({ ...DEFAULT_RETRY_CONFIG, maxAttempts: n })), async (config) => {
                let callCount = 0
                const successfulFunction = jasmine.createSpy('successfulFunction', () => {
                    callCount += 1
                    // The function fails for the first (n-1) times and succeeds on the nth time
                    if (callCount === config.maxAttempts) {
                        return { success: 'Function succeeded' }
                    } else {
                        return { error: { message: 'something went wrong' } }
                    }
                }).and.callThrough()

                const { result, exceptions } = await retry(successfulFunction, config)

                // Expect retry to return a successful result
                expect(result).toEqual({ success: 'Function succeeded' })

                // The error function should have been called config.maxAttempts times
                expect(successfulFunction.calls.count()).toEqual(config.maxAttempts)

                // Last attempt wouldn't be a fail so minus 1 from the errors
                expect(exceptions).toEqual([])
            }))
    })
    it('should return last result if a function is never successful', async () => {
        await fc.assert(
            fc.asyncProperty(fc.integer({ min: 1, max: 10 }).map(n => ({ ...DEFAULT_RETRY_CONFIG, maxAttempts: n })), async (config) => {
                const errorFunction = jasmine.createSpy('successfulFunction', () => {
                    return { error: { message: 'something went wrong' } }
                }).and.callThrough()

                const { result, exceptions } = await retry(errorFunction, config)

                // should be just the last error as a result
                if (result && !('error' in result)) throw new Error('unreachable')

                expect(result?.error.message).toEqual('something went wrong')

                // should be empty since nothing threw
                expect(exceptions).toEqual([])
            }))
    })
})
