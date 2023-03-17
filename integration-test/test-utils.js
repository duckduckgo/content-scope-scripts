/**
 *  Tests for utils
 */
import { setup } from './helpers/harness.js'

describe('Ensure utils behave as expected', () => {
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

    fit('should toString DDGProxy correctly', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { platform: { name: 'extension' } })
        const toStringResult = await page.evaluate('HTMLCanvasElement.prototype.getContext.toString()')
        expect(toStringResult).toEqual('function getContext() { [native code] }')

        const toStringToStringResult = await page.evaluate('HTMLCanvasElement.prototype.getContext.toString.toString()')
        expect(toStringToStringResult).toEqual('function toString() { [native code] }')

        /* TOFIX: This is failing because the toString() call is being proxied and the result is not what we expect
        const callToStringToStringResult = await page.evaluate('String.toString.call(HTMLCanvasElement.prototype.getContext.toString)')
        expect(callToStringToStringResult).toEqual('function toString() { [native code] }')
        */
    })
})
