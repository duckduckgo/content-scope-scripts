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
                const hadInspectorNode = scriptElement === document.querySelector('ddg-runtime-checks')
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
                    // @ts-expect-error - error TS18047: 'scripty' is possibly 'null'.
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

    it('Script that should filter props and attributes', async () => {
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
        const scriptResult5 = await page.evaluate(
            () => {
                // @ts-expect-error Undefined property for testing
                window.scripty5Ran = false
                const myScript = document.createElement('script')
                myScript.innerText = 'window.scripty5Ran = true'
                Object.setPrototypeOf(myScript, HTMLScriptElement.prototype)
                document.body.appendChild(myScript)
                // @ts-expect-error Undefined property for testing
                return window.scripty5Ran
            })
        expect(scriptResult5).toBe(true)
    })

    it('Script should support trusted types', async () => {
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
        const scriptResult6 = await page.evaluate(
            () => {
                // @ts-expect-error Trusted types are not defined on all browsers
                const policy = window.trustedTypes.createPolicy('test', {
                    createScriptURL: (url) => url
                })
                const myScript = document.createElement('script')
                myScript.src = policy.createScriptURL('http://example.com')
                const srcVal = myScript.src

                myScript.setAttribute('src', policy.createScriptURL('http://example2.com'))
                const srcVal2 = myScript.getAttribute('src')
                const srcVal3 = myScript.src

                document.body.appendChild(myScript)

                // After append
                myScript.setAttribute('src', policy.createScriptURL('http://example3.com'))
                const srcVal4 = myScript.getAttribute('src')
                const srcVal5 = myScript.src

                myScript.src = policy.createScriptURL('http://example4.com')
                const srcVal6 = myScript.getAttribute('src')
                const srcVal7 = myScript.src
                return {
                    srcVal,
                    srcVal2,
                    srcVal3,
                    srcVal4,
                    srcVal5,
                    srcVal6,
                    srcVal7
                }
            })
        expect(scriptResult6).toEqual({
            srcVal: 'http://example.com',
            srcVal2: 'http://example2.com',
            srcVal3: 'http://example2.com',
            srcVal4: 'http://example3.com/',
            srcVal5: 'http://example3.com/',
            srcVal6: 'http://example4.com/',
            srcVal7: 'http://example4.com/'
        })
    })

    it('Script using parent prototype should execute checking', async () => {
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
        const scriptResult = await page.evaluate(
            () => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.scriptDocumentPrototypeRan = false
                const scriptElement = Document.prototype.createElement.call(window.document, 'script')
                scriptElement.innerText = 'window.scriptDocumentPrototypeRan = true'
                scriptElement.id = 'scriptDocumentPrototype'
                scriptElement.setAttribute('type', 'application/javascript')
                document.body.appendChild(scriptElement)
                const hadInspectorNode = scriptElement === document.querySelector('ddg-runtime-checks')
                const instanceofResult = scriptElement instanceof HTMLScriptElement
                const scripty = document.querySelector('script#scriptDocumentPrototype')

                return {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    scriptRan: window.scriptDocumentPrototypeRan,
                    hadInspectorNode,
                    instanceofResult,
                    // @ts-expect-error - scripty is possibly null
                    type: scripty.getAttribute('type')
                }
            }
        )
        expect(scriptResult).toEqual({
            scriptRan: true,
            hadInspectorNode: true,
            instanceofResult: true,
            type: 'application/javascript'
        })
    })

    it('Verify stack tracing', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        await gotoAndWait(page, `http://localhost:${port}/runtimeChecks/index.html`, {
            site: {
                enabledFeatures: ['runtimeChecks']
            },
            featureSettings: {
                runtimeChecks: {
                    taintCheck: 'enabled',
                    matchAllDomains: 'enabled',
                    matchAllStackDomains: 'disabled',
                    stackDomains: [
                        {
                            domain: 'localhost'
                        }
                    ],
                    tagModifiers: {
                        script: {
                            filters: {
                                // verify the runtime check did run for the stack traced script and filtered the attribute
                                attribute: ['magicalattribute']
                            }
                        }
                    }
                }
            }
        })
        // And now with a script that will execute
        const pageResults = await page.evaluate(
            async () => {
                window.dispatchEvent(new Event('initialize'))
                await new Promise(resolve => {
                    window.addEventListener('initializeFinished', () => {
                        // @ts-expect-error - error TS2810: Expected 1 argument, but got 0. 'new Promise()' needs a JSDoc hint to produce a 'resolve' that can be called without arguments.
                        resolve()
                    })
                })
                const scripty = document.querySelector('script#script2')

                return {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    script1: window.script1Ran,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    script2: window.script2Ran,
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    magicalProperty: scripty.magicalProperty
                }
            }
        )
        expect(pageResults).toEqual({
            script1: true,
            script2: true
            // no magical property
        })
    })
})
