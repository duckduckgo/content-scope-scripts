// @ts-check
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'node:path'

const CWD = new URL('.', import.meta.url).pathname
const contentScope = JSON.parse(readFileSync(join(CWD, 'remote.json'), 'utf8'))

test.describe('runtime checks', () => {
    test('Script that should not execute', async ({ page }, { project }) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>
          `
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = {
                features: {
                    runtimeChecks: {
                        'state': 'enabled',
                        'exceptions': [],
                        'settings': {
                            'taintCheck': 'enabled',
                            'matchAllDomains': 'disabled',
                            'matchAllStackDomains': 'enabled',
                            'overloadInstanceOf': 'enabled',
                            'elementRemovalTimeout': 1000,
                            'domains': [
                                {
                                    'domain': 'playwright.dev'
                                }
                            ],
                            'stackDomains': []
                        },
                        'hash': '32be9e17c1e346de2f37bed896eb0231'
                    }
                },
                unprotectedTemporary: [],
            }
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: 'macos' }
            }
        }, contentScope)
        await page.addInitScript({ path: 'build/apple/contentScope.js' })
        await page.goto('https://playwright.dev')
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
        expect(scriptResult).toMatchObject({
            scripty1: false,
            hadInspectorNode: true,
            instanceofResult: true,
            integrity: 'sha256-123',
            madeUpProp: 'val',
            type: 'application/evilscript'
        })
    })
    test('Script that should execute checking', async ({ page }, { project }) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>
          `
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = {
                features: {
                    runtimeChecks: {
                        'state': 'enabled',
                        'exceptions': [],
                        'settings': {
                            'taintCheck': 'enabled',
                            'matchAllDomains': 'disabled',
                            'matchAllStackDomains': 'enabled',
                            'overloadInstanceOf': 'enabled',
                            'elementRemovalTimeout': 1000,
                            'domains': [
                                {
                                    'domain': 'playwright.dev'
                                }
                            ],
                            'stackDomains': []
                        },
                        'hash': '32be9e17c1e346de2f37bed896eb0231'
                    }
                },
                unprotectedTemporary: [],
            }
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: 'macos' }
            }
        }, contentScope)
        await page.addInitScript({ path: 'build/apple/contentScope.js' })
        await page.goto('https://playwright.dev')
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
        expect(scriptResult2).toMatchObject({
            scripty2: true,
            hadInspectorNode: true,
            instanceofResult: true,
            madeUpProp: 'val',
            type: 'application/javascript'
        })
    })
    test('Invalid external script should trigger error listeners', async ({page}, {project}) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            if (request.url().startsWith('invalid://')) return route.continue();
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>`
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = {
                features: {
                    runtimeChecks: {
                        'state': 'enabled',
                        'exceptions': [],
                        'settings': {
                            'taintCheck': 'enabled',
                            'matchAllDomains': 'disabled',
                            'matchAllStackDomains': 'enabled',
                            'overloadInstanceOf': 'enabled',
                            'elementRemovalTimeout': 1000,
                            'domains': [
                                {
                                    'domain': 'playwright.dev'
                                }
                            ],
                            'stackDomains': []
                        },
                        'hash': '32be9e17c1e346de2f37bed896eb0231'
                    }
                },
                unprotectedTemporary: [],
            }
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: 'macos' }
            }
        }, contentScope)
        await page.addInitScript({ path: 'build/apple/contentScope.js' })
        await page.goto('https://playwright.dev')
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
        expect(scriptResult3).toMatchObject({
            listenerCount: 2,
            hadInspectorNode: true,
            instanceofResult: true,
            madeUpProp: 'val',
            type: 'application/javascript'
        })
    })
})
