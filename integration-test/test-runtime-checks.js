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
                    taintCheck: 'enabled',
                    matchAllDomains: 'enabled',
                    matchAllStackDomains: 'enabled',
                    overloadInstanceOf: 'enabled'
                }
            }
        })
        // First, a script that will not execute
        const scriptResult = await page.evaluate(
            () => {
                window.scripty1Ran = false
                const scriptElement = document.createElement('script')
                scriptElement.innerText = 'window.scripty1Ran = true'
                scriptElement.id = 'scripty'
                scriptElement.setAttribute('type', 'application/evilscript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                scriptElement.integrity = 'sha256-123'
                scriptElement.madeUpProp = 'val'
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('#scripty')

                return {
                    scripty1: window.scripty1Ran,
                    hadInspectorNode,
                    instanceofResult,
                    integrity: scripty.integrity,
                    madeUpProp: scripty.madeUpProp,
                    type: scripty.getAttribute('type')
                }
            }
        )
        expect(scriptResult).toEqual({
            scripty1: false,
            hadInspectorNode: true,
            instanceofResult: true,
            integrity: 'sha256-123',
            madeUpProp: 'val',
            type: 'application/evilscript'
        })

        // And now with a script that will execute
        const scriptResult2 = await page.evaluate(
            () => {
                window.scripty2Ran = false
                const scriptElement = document.createElement('script')
                scriptElement.innerText = 'window.scripty2Ran = true'
                scriptElement.id = 'scripty2'
                scriptElement.setAttribute('type', 'application/javascript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                scriptElement.madeUpProp = 'val'
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('#scripty2')

                return {
                    scripty2: window.scripty2Ran,
                    hadInspectorNode,
                    instanceofResult,
                    madeUpProp: scripty.madeUpProp,
                    type: scripty.getAttribute('type')
                }
            }
        )
        expect(scriptResult2).toEqual({
            scripty2: true,
            hadInspectorNode: true,
            instanceofResult: true,
            madeUpProp: 'val',
            type: 'application/javascript'
        })
    })
})
