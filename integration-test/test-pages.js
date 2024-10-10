/**
 *  Tests for shared pages
 */
import { processConfig } from '../src/utils.js'
import { setup } from './helpers/harness.js'
import * as fs from 'fs'
import polyfillProcessGlobals from '../unit-test/helpers/pollyfil-for-process-globals.js'

describe('Test integration pages', () => {
    let browser
    let server
    let teardown
    let setupIntegrationPagesServer
    let gotoAndWait
    beforeAll(async () => {
        ({ browser, setupIntegrationPagesServer, teardown, gotoAndWait } = await setup({ withExtension: true }))
        server = setupIntegrationPagesServer()
    })
    afterAll(async () => {
        await server?.close()
        await teardown()
    })

    /**
     * @param {string} pageName
     * @param {string} configPath
     * @param {string} [evalBeforeInit]
     */
    async function testPage (pageName, configPath, evalBeforeInit) {
        const port = server.address().port
        const page = await browser.newPage()
        const res = fs.readFileSync(configPath)
        // @ts-expect-error - JSON.parse returns any
        const config = JSON.parse(res)
        polyfillProcessGlobals()

        /** @type {import('../src/utils.js').UserPreferences} */
        const userPreferences = {
            platform: {
                name: 'extension'
            },
            sessionKey: 'test'
        }
        const processedConfig = processConfig(config, /* userList */ [], /* preferences */ userPreferences/*, platformSpecificFeatures = [] */)

        await gotoAndWait(page, `http://localhost:${port}/${pageName}?automation=true`, processedConfig, evalBeforeInit)
        // Check page results
        const pageResults = await page.evaluate(
            () => {
                let res
                const promise = new Promise(resolve => {
                    res = resolve
                })
                // @ts-expect-error - results is not defined in the type definition
                if (window.results) {
                    // @ts-expect-error - results is not defined in the type definition
                    res(window.results)
                } else {
                    window.addEventListener('results-ready', (e) => {
                        // @ts-expect-error - e.detail is not defined in the type definition
                        res(e.detail)
                    })
                }
                return promise
            }
        )
        for (const key in pageResults) {
            for (const result of pageResults[key]) {
                expect(result.result).withContext(key + ':\n ' + result.name).toEqual(result.expected)
            }
        }
    }

    it('Web compat shims correctness', async () => {
        await testPage(
            'webcompat/pages/shims.html',
            `${process.cwd()}/integration-test/test-pages/webcompat/config/shims.json`
        )
    })

    it('Properly modifies localStorage entries', async () => {
        await testPage(
            'webcompat/pages/modify-localstorage.html',
            `${process.cwd()}/integration-test/test-pages/webcompat/config/modify-localstorage.json`
        )
    })
})
