/**
 *  Tests for runtime checks
 */
import { processConfig } from '../src/utils.js'
import { setup } from './helpers/harness.js'
import fs from 'fs'

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

    it('Script that should not execute', async () => {
        const pages = {
            'runtime-checks/pages/basic-run.html': 'runtime-checks/config/basic-run.json',
            'runtime-checks/pages/filter-props.html': 'runtime-checks/config/filter-props.json'
        }
        for (const pageName in pages) {
            const configName = pages[pageName]

            const port = server.address().port
            const page = await browser.newPage()
            const res = fs.readFileSync(process.cwd() + '/integration-test/test-pages/' + configName)
            const config = JSON.parse(res)
            // Pollyfill for globalThis methods needed in processConfig
            globalThis.document = {
                referrer: 'http://localhost:8080',
                location: {
                    href: 'http://localhost:8080',
                    ancestorOrigins: {
                        length: 0
                    }
                }
            }
            globalThis.location = {
                href: 'http://localhost:8080',
                ancestorOrigins: {
                    length: 0
                }
            }

            const processedConfig = processConfig(config, /* userList */ [], /* preferences */ {}/*, platformSpecificFeatures = []*/)

            await gotoAndWait(page, `http://localhost:${port}/${pageName}?automation=true`, processedConfig)
            // Check page results
            const pageResults = await page.evaluate(
                async () => {
                    let res
                    const promise = new Promise(resolve => {
                        res = resolve
                    })
                    if (window.results) {
                        res(window.results)
                    } else {
                        window.addEventListener('results-ready', (e) => {
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
