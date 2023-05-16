/**
 *  Tests for runtime checks
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

    it('Should be successful page script check', async () => {
        const pages = {
            'runtime-checks/pages/basic-run.html': 'runtime-checks/config/basic-run.json',
            'runtime-checks/pages/replace-element.html': 'runtime-checks/config/replace-element.json',
            'runtime-checks/pages/filter-props.html': 'runtime-checks/config/filter-props.json',
            'runtime-checks/pages/shadow-dom.html': 'runtime-checks/config/shadow-dom.json',
            'runtime-checks/pages/script-overload.html': 'runtime-checks/config/script-overload.json'
        }
        for (const pageName in pages) {
            const configName = pages[pageName]

            const port = server.address().port
            const page = await browser.newPage()
            const res = fs.readFileSync(process.cwd() + '/integration-test/test-pages/' + configName)
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

            await gotoAndWait(page, `http://localhost:${port}/${pageName}?automation=true`, processedConfig)
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
    })
})
