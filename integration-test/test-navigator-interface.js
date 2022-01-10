/**
 *  Tests for injecting navigator.duckduckgo into the page
 */
import { setup } from './helpers/harness.js'

describe('Ensure navigator interface is injected', () => {
    let browser
    let server
    let teardown
    let setupServer
    let gotoAndWait
    beforeAll(async () => {
        ({ browser, setupServer, teardown, gotoAndWait } = await setup({ withExtension: true }))
        server = await setupServer()
    })
    afterAll(async () => {
        await teardown()
    })

    it('should expose navigator.navigator.isDuckDuckGo(): Promise<boolean> and platform === "extension"', async () => {
        const page = await browser.newPage()
        await gotoAndWait(page, `${server.address}/blank.html`, { platform: { name: 'extension' } })
        const isDuckDuckGoResult = await page.evaluate(
            () => {
                const fn = navigator.duckduckgo?.isDuckDuckGo
                const isPromise = fn.constructor.name === 'Promise' || fn.constructor.name === 'AsyncFunction'
                return isPromise && fn()
            }
        )
        expect(isDuckDuckGoResult).toEqual(true)

        const platformResult = await page.evaluate('navigator.duckduckgo.platform === \'extension\'')
        expect(platformResult).toEqual(true)
    })
})
