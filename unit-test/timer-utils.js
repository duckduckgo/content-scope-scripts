import fc from 'fast-check'
import { DEFAULT_RETRY_CONFIG, retry } from '../src/timer-utils.js'

describe('retry function tests', () => {
    // This represents the default arguments to the `retry` helper function
    const defaultProps = () => fc.integer({ min: 1, max: 10 })
        .map(n => ({ ...DEFAULT_RETRY_CONFIG, maxAttempts: n }))

    it('should catch errors if the retried function always throws', async () => {
        await fc.assert(
            fc.asyncProperty(defaultProps(), async (config) => {
                const errorFunction = jasmine.createSpy('errorFunction', () => {
                    // A function that always throws an error
                    throw new Error('Always fails')
                }).and.callThrough()

                const { result, exceptions } = await retry(errorFunction, config)

                // result should be undefined since we always throw
                expect(result).toBe(undefined)

                // should have been called config.maxAttempts times
                expect(errorFunction.calls.count()).toEqual(config.maxAttempts)

                // Size of errors should be equal to maxAttempts because the function always fails
                expect(exceptions.length).toEqual(config.maxAttempts)
            }))
    })
    it('should assign lastResult correctly and stop retrying when success is obtained', async () => {
        await fc.assert(
            fc.asyncProperty(defaultProps(), async (config) => {
                let callCount = 0
                const successfulFunction = jasmine.createSpy('successfulFunction', () => {
                    callCount += 1
                    // The function fails for the first (n-1) times and succeeds on the last try
                    if (callCount === config.maxAttempts) {
                        return { success: 'Function succeeded' }
                    } else {
                        return { error: { message: 'something went wrong' } }
                    }
                }).and.callThrough()

                const { result, exceptions } = await retry(successfulFunction, config)

                // Expect retry to eventually return a successful result
                expect(result).toEqual({ success: 'Function succeeded' })

                // should have been called config.maxAttempts times
                expect(successfulFunction.calls.count()).toEqual(config.maxAttempts)

                // no exceptions were thrown, so this should be empty
                expect(exceptions).toEqual([])
            }))
    })
    it('should return last result if a function is never successful', async () => {
        await fc.assert(
            fc.asyncProperty(defaultProps(), async (config) => {
                const errorFunction = jasmine.createSpy('successfulFunction', () => {
                    return { error: { message: 'something went wrong' } }
                }).and.callThrough()

                const { result, exceptions } = await retry(errorFunction, config)

                // this line just helps typescript understand that we're expecting 'result.error'
                if (result && !('error' in result)) throw new Error('unreachable')

                // should be just the last error as a `result`
                expect(result?.error.message).toEqual('something went wrong')

                // should be empty since nothing threw
                expect(exceptions).toEqual([])
            }))
    })
})
