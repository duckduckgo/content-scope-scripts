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
        server = setupServer()
    })
    afterAll(async () => {
        await server?.close()
        await teardown()
    })

    it('should expose navigator.navigator.isDuckDuckGo(): Promise<boolean> and platform === "extension"', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { platform: { name: 'extension' } })
        const isDuckDuckGoResult = await page.evaluate(
            () => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                const fn = navigator.duckduckgo?.isDuckDuckGo
                return fn()
            }
        )
        expect(isDuckDuckGoResult).toEqual(true)

        const platformResult = await page.evaluate('navigator.duckduckgo.platform === \'extension\'')
        expect(platformResult).toEqual(true)
    })
})
