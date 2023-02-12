/**
 *  Tests for runtime checks
 */
import { setup } from './helpers/harness.js'

describe('Runtime checks', () => {
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

    it('should allow element modification', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
            site: {
                enabledFeatures: ['runtimeChecks']
            },
            featureSettings: {
                runtimeChecks: {
                    domains: [
                        {
                            matchAll: true
                        }
                    ],
                    interestingHosts: [
                        `localhost:${port}`
                    ],
                    overloadInstanceOf: 'enabled'
                }
            }
        })
        const scriptResult = await page.evaluate(
            () => {
                const scriptElement = document.createElement('script')
                scriptElement.innerText = 'console.log(1)'
                scriptElement.id = 'scripty'
                scriptElement.setAttribute('type', 'application/evilscript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                scriptElement.integrity = 'sha256-123'
                scriptElement.madeUpProp = 'val'

                const scripty = document.querySelector('#scripty')

                return {
                    hadInspectorNode,
                    integrity: scripty.integrity,
                    madeUpProp: scripty.madeUpProp,
                    type: scripty.getAttribute('type')
                }
            }
        )
        expect(scriptResult).toEqual({
            hadInspectorNode: true,
            integrity: 'sha256-123',
            madeUpProp: 'val',
            type: 'application/evilscript'
        })
    })
})
