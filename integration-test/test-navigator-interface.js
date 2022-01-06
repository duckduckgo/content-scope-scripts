/**
 *  Tests for injecting navigator.duckduckgo into the page
 */
import { setup } from './helpers/harness.js'

describe('Ensure navigator interface is injected', () => {
    let browser
    let server
    let teardown
    let setupServer
    beforeAll(async () => {
        ({ browser, setupServer, teardown } = await setup())
        server = setupServer()
    })
    afterAll(async () => {
        await server.close()
        await teardown()
    })

    it('should expose navigator.navigator.isDuckDuckGo(): Promise<boolean> and platform === "extension"', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'networkidle0' })

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
