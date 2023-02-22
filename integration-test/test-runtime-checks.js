/**
 *  Tests for runtime checks
 */
import { setup } from './helpers/harness.js'

describe('Runtime checks: should allow element modification', () => {
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

    it('Script that should not execute', async () => {
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
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.scripty1Ran = false
                const scriptElement = document.createElement('script')
                scriptElement.innerText = 'window.scripty1Ran = true'
                scriptElement.id = 'scripty'
                scriptElement.setAttribute('type', 'application/evilscript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                scriptElement.integrity = 'sha256-123'
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                scriptElement.madeUpProp = 'val'
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('#scripty')

                return {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    scripty1: window.scripty1Ran,
                    hadInspectorNode,
                    instanceofResult,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    integrity: scripty.integrity,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
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
    })

    it('Script that should execute checking', async () => {
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
        // And now with a script that will execute
        const scriptResult2 = await page.evaluate(
            () => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.scripty2Ran = false
                const scriptElement = document.createElement('script')
                scriptElement.innerText = 'window.scripty2Ran = true'
                scriptElement.id = 'scripty2'
                scriptElement.setAttribute('type', 'application/javascript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                scriptElement.madeUpProp = 'val'
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('#scripty2')

                return {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    scripty2: window.scripty2Ran,
                    hadInspectorNode,
                    instanceofResult,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
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

    it('Invalid external script should trigger error listeners', async () => {
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
        // External scripts
        const scriptResult3 = await page.evaluate(
            async () => {
                const scriptElement = document.createElement('script')
                scriptElement.id = 'scripty3'
                scriptElement.src = 'invalid://url'
                scriptElement.setAttribute('type', 'application/javascript')

                let listenerCount = 0
                let resolver = null
                const promise = new Promise(resolve => {
                    resolver = resolve
                })
                scriptElement.onerror = () => {
                    listenerCount++
                    resolver()
                }

                let resolver2 = null
                const promise2 = new Promise(resolve => {
                    resolver2 = resolve
                })
                scriptElement.addEventListener('error', () => {
                    listenerCount++
                    resolver2()
                })

                document.body.appendChild(scriptElement)
                await Promise.all([promise, promise2])

                const hadInspectorNode = !!document.querySelector('ddg-runtime-checks')
                // Continue to modify the script element after it has been added to the DOM
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                scriptElement.madeUpProp = 'val'
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('#scripty3')

                return {
                    listenerCount,
                    hadInspectorNode,
                    instanceofResult,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    madeUpProp: scripty.madeUpProp,
                    type: scripty.getAttribute('type')
                }
            }
        )
        expect(scriptResult3).toEqual({
            listenerCount: 2,
            hadInspectorNode: true,
            instanceofResult: true,
            madeUpProp: 'val',
            type: 'application/javascript'
        })
    })
})
