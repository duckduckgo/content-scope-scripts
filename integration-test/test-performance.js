/**
 *  Tests for basic performance
 */
import { setup } from './helpers/harness.js'

describe('Runtime checks: should check basic performance', () => {
    let browser
    let server
    let teardown
    let setupServer
    let gotoAndWait
    beforeAll(async () => {
        ({ browser, setupServer, teardown, gotoAndWait } = await setup({ withExtension: true }))
        server = setupServer()
    })
    afterAll(async () => {
        await server?.close()
        await teardown()
    })

    it('Should perform within a resonable timeframe', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
            debug: true,
            site: {
                enabledFeatures: ['runtimeChecks', 'fingerprintingCanvas']
            },
            featureSettings: {
                runtimeChecks: {
                    taintCheck: 'enabled',
                    matchAllDomains: 'enabled',
                    matchAllStackDomains: 'disabled',
                    overloadInstanceOf: 'enabled',
                    stackDomains: [
                        {
                            domain: 'localhost'
                        }
                    ]
                }
            }
        })
        const perfResult = await page.evaluate(
            () => {
                return {
                    load: performance.getEntriesByName('load')[0].duration,
                    init: performance.getEntriesByName('init')[0].duration,
                    runtimeChecks: performance.getEntriesByName('runtimeChecksCallInit')[0].duration
                }
            })
        expect(perfResult.runtimeChecks).toBeLessThan(2)
        expect(perfResult.load).toBeLessThan(3)
        expect(perfResult.init).toBeLessThan(15)
    })
})
