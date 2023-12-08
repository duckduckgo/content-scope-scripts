/**
 *  Tests for injecting navigator.duckduckgo into the page
 */
import { setup } from './helpers/harness.js'

describe('Ensure safari interface is injected', () => {
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

    it('should expose window.safari when enabled', async () => {
        const port = server.address().port
        const page = await browser.newPage()

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
        const noSafari = await page.evaluate(() => {
            return 'safari' in window
        })
        expect(noSafari).toEqual(false)

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
            site: {
                enabledFeatures: ['webCompat']
            },
            featureSettings: {
                webCompat: {
                    safariObject: 'enabled'
                }
            }
        })
        const hasSafari = await page.evaluate(() => {
            return 'safari' in window
        })
        expect(hasSafari).toEqual(true)

        const pushNotificationToString = await page.evaluate(() => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.safari.pushNotification.toString()
        })
        expect(pushNotificationToString).toEqual('[object SafariRemoteNotification]')

        const pushNotificationPermission = await page.evaluate(() => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.safari.pushNotification.permission('test')
        })
        expect(pushNotificationPermission.deviceToken).toEqual(null)
        expect(pushNotificationPermission.permission).toEqual('denied')

        const pushNotificationRequestPermissionThrow = await page.evaluate(() => {
            try {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.safari.pushNotification.requestPermission('test', 'test.com')
            } catch (e) {
                return e.message
            }
        })
        expect(pushNotificationRequestPermissionThrow).toEqual('Invalid \'callback\' value passed to safari.pushNotification.requestPermission(). Expected a function.')

        const pushNotificationRequestPermission = await page.evaluate(() => {
            const response = new Promise((resolve) => {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                window.safari.pushNotification.requestPermission('test', 'test.com', {}, (data) => {
                    resolve(data)
                })
            })
            return response
        })
        expect(pushNotificationRequestPermission.deviceToken).toEqual(null)
        expect(pushNotificationRequestPermission.permission).toEqual('denied')
    })
})

describe('Ensure Notification and Permissions interface is injected', () => {
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

    it('should expose window.Notification when enabled', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        // Fake the Notification API not existing in this browser
        const removeNotificationScript = `
            delete window.Notification
        `
        function checkForNotification () {
            return 'Notification' in window
        }
        function checkObjectDescriptorSerializedValue () {
            const descriptor = Object.getOwnPropertyDescriptor(window, 'Notification')
            const out = {}
            for (const key in descriptor) {
                out[key] = !!descriptor[key]
            }
            return out
        }
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
        const initialNotification = await page.evaluate(checkForNotification)
        // Base implementation of the test env should have it.
        expect(initialNotification).toEqual(true)
        const initialDescriptorSerialization = await page.evaluate(checkObjectDescriptorSerializedValue)

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } }, removeNotificationScript)
        const noNotification = await page.evaluate(() => {
            return 'Notification' in window
        })
        expect(noNotification).toEqual(false)

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
            site: {
                enabledFeatures: ['webCompat']
            },
            featureSettings: {
                webCompat: {
                    notification: 'enabled'
                }
            }
        }, removeNotificationScript)
        const hasNotification = await page.evaluate(checkForNotification)
        expect(hasNotification).toEqual(true)

        const modifiedDescriptorSerialization = await page.evaluate(checkObjectDescriptorSerializedValue)
        expect(modifiedDescriptorSerialization).toEqual(initialDescriptorSerialization)

        const permissionDenied = await page.evaluate(() => {
            return window.Notification.requestPermission()
        })
        expect(permissionDenied).toEqual('denied')

        const permissionPropDenied = await page.evaluate(() => {
            return window.Notification.permission
        })
        expect(permissionPropDenied).toEqual('denied')

        const maxActionsPropDenied = await page.evaluate(() => {
            // @ts-expect-error - This is a property that should exist but experimental.
            return window.Notification.maxActions
        })
        expect(maxActionsPropDenied).toEqual(2)
    })
})

describe('Permissions API', () => {
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

    // Fake the Permission API not existing in this browser
    const removePermissionsScript = `
    Object.defineProperty(window.navigator, 'permissions', { writable: true, value: undefined })
    `

    function checkForPermissions () {
        return !!window.navigator.permissions
    }
    function checkObjectDescriptorIsNotPresent () {
        const descriptor = Object.getOwnPropertyDescriptor(window.navigator, 'permissions')
        return descriptor === undefined
    }

    describe('disabled feature', () => {
        it('should not expose permissions API', async () => {
            const port = server.address().port
            const page = await browser.newPage()

            await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
            const initialPermissions = await page.evaluate(checkForPermissions)
            // Base implementation of the test env should have it.
            expect(initialPermissions).toEqual(true)
            const initialDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent)
            expect(initialDescriptorSerialization).toEqual(true)
    
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } }, removePermissionsScript)
            const noPermissions = await page.evaluate(checkForPermissions)
            expect(noPermissions).toEqual(false)
        })
    })

    describe('enabled feature', () => {
        let port
        let page

        beforeAll(async () => {
            port = server.address().port
            page = await browser.newPage()
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: {
                    enabledFeatures: ['webCompat']
                },
                featureSettings: {
                    webCompat: {
                        permissions: {
                            state: 'enabled',
                            supportedPermissions: {
                                geolocation: {},
                                push: {
                                    name: "notifications"
                                },
                                camera: {
                                    name: "video_capture",
                                    native: true
                                },
                            }
                        }
                    }
                }
            }, removePermissionsScript)
        })

        async function checkPermission (name) {
            const payload = `window.navigator.permissions.query(${JSON.stringify({name : name})})`
            const result = await page.evaluate(payload).catch((e) => {
                return { threw: e }
            })
            const message = await page.evaluate(() => {
                return globalThis.shareReq
            })
            return { result, message }
        }

        it('should expose window.navigator.permissions when enabled', async () => {   
            const hasPermissions = await page.evaluate(checkForPermissions)
            expect(hasPermissions).toEqual(true)
    
            const modifiedDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent)
            // This fails in a test condition purely because we have to add a descriptor to modify the prop
            expect(modifiedDescriptorSerialization).toEqual(false)
        })

        it('should throw error when permission not supported', async () => {       
            const { result } = await checkPermission('notexistent')
            expect(result.threw).not.toBeUndefined()
            expect(result.threw.message).toContain('notexistent')
        })

        it('should return prompt by default', async () => {    
            const { result } = await checkPermission('geolocation')
            expect(result).toEqual(jasmine.objectContaining({ name: 'geolocation', state: 'prompt'}))
        })   
    
        it('should return updated name when configured', async () => {
            const { result } = await checkPermission('push')
            expect(result).toEqual(jasmine.objectContaining({ name: 'notifications', state: 'prompt'}))
        })

        it('should propagate result from native when configured', async () => {
            // Fake result from native
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = (req) => {
                    globalThis.shareReq = req
                    return Promise.resolve({ state: 'granted' })
                }
            })

            const { result, message } = await checkPermission('camera')
            expect(result).toEqual(jasmine.objectContaining({ name: 'video_capture', state: 'granted'}))
            expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } }))
        })

        it('should default to prompt when native sends unexpected response', async () => {
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () => {
                    return Promise.resolve({ noState: 'xxx' })
                }
            })
            const { result, message } = await checkPermission('camera')
            expect(result).toEqual(jasmine.objectContaining({ name: 'video_capture', state: 'prompt'}))
            expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } }))
        })
    
        it('should default to prompt when native error occurs', async () => {
            await page.evaluate(() => {
                globalThis.cssMessaging.impl.request = () => {
                    return Promise.reject(new Error('something wrong'))
                }
            })
            const { result, message } = await checkPermission('camera')
            expect(result).toEqual(jasmine.objectContaining({ name: 'video_capture', state: 'prompt'}))
            expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'permissionsQuery', params: { name: 'camera' } }))
        })
    })
})

describe('Web Share API', () => {
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

    function checkForCanShare () {
        return 'canShare' in navigator
    }
    function checkForShare () {
        return 'share' in navigator
    }

    describe('disabled feature', () => {
        it('should not expose navigator.canShare() and navigator.share()', async () => {
            const port = server.address().port
            const page = await browser.newPage()
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
            const noCanShare = await page.evaluate(checkForCanShare)
            const noShare = await page.evaluate(checkForShare)
            // Base implementation of the test env should not have it (it's only available on mobile)
            expect(noCanShare).toEqual(false)
            expect(noShare).toEqual(false)
        })
    })

    describe('disabled sub-feature', () => {
        it('should not expose navigator.canShare() and navigator.share()', async () => {
            const port = server.address().port
            const page = await browser.newPage()
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: {
                    enabledFeatures: ['webCompat']
                },
                featureSettings: {
                    webCompat: {
                        // no webShare
                    }
                }
            })
            const noCanShare = await page.evaluate(checkForCanShare)
            const noShare = await page.evaluate(checkForShare)
            // Base implementation of the test env should not have it (it's only available on mobile)
            expect(noCanShare).toEqual(false)
            expect(noShare).toEqual(false)
        })
    })

    describe('enabled feature', () => {
        let port
        let page

        beforeAll(async () => {
            port = server.address().port
            page = await browser.newPage()
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: {
                    enabledFeatures: ['webCompat']
                },
                featureSettings: {
                    webCompat: {
                        webShare: 'enabled'
                    }
                }
            })
        })

        it('should expose navigator.canShare() and navigator.share() when enabled', async () => {
            const hasCanShare = await page.evaluate(checkForCanShare)
            const hasShare = await page.evaluate(checkForShare)
            expect(hasCanShare).toEqual(true)
            expect(hasShare).toEqual(true)
        })

        describe('navigator.canShare()', () => {
            it('should not let you share files', async () => {
                const refuseFileShare = await page.evaluate(() => {
                    return navigator.canShare({ text: 'xxx', files: [] })
                })
                expect(refuseFileShare).toEqual(false)
            })

            it('should not let you share non-http urls', async () => {
                const refuseShare = await page.evaluate(() => {
                    return navigator.canShare({ url: 'chrome://bla' })
                })
                expect(refuseShare).toEqual(false)
            })

            it('should allow relative links', async () => {
                const allowShare = await page.evaluate(() => {
                    return navigator.canShare({ url: 'bla' })
                })
                expect(allowShare).toEqual(true)
            })

            it('should support only the specific fields', async () => {
                const refuseShare = await page.evaluate(() => {
                    // eslint-disable-next-line
                    // @ts-ignore intentionally malformed data
                    return navigator.canShare({ foo: 'bar' })
                })
                expect(refuseShare).toEqual(false)
            })

            it('should let you share stuff', async () => {
                let canShare = await page.evaluate(() => {
                    return navigator.canShare({ url: 'http://example.com' })
                })
                expect(canShare).toEqual(true)

                canShare = await page.evaluate(() => {
                    return navigator.canShare({ text: 'the grass was greener' })
                })
                expect(canShare).toEqual(true)

                canShare = await page.evaluate(() => {
                    return navigator.canShare({ title: 'the light was brighter' })
                })
                expect(canShare).toEqual(true)

                canShare = await page.evaluate(() => {
                    return navigator.canShare({ text: 'with friends surrounded', title: 'the nights of wonder' })
                })
                expect(canShare).toEqual(true)
            })
        })

        describe('navigator.share()', () => {
            describe('(no errors from Android)', () => {
                beforeEach(async () => {
                    await page.evaluate(() => {
                        globalThis.shareReq = null
                        globalThis.cssMessaging.impl.request = (req) => {
                            globalThis.shareReq = req
                            return Promise.resolve({})
                        }
                    })
                })

                async function checkShare (data) {
                    const payload = `navigator.share(${JSON.stringify(data)})`
                    const result = await page.evaluate(payload).catch((e) => {
                        return { threw: e }
                    })
                    const message = await page.evaluate(() => {
                        return globalThis.shareReq
                    })
                    return { result, message }
                }

                it('should let you share text', async () => {
                    const { result, message } = await checkShare({ text: 'xxx' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { text: 'xxx' } }))
                    expect(result).toBeUndefined()
                })

                it('should let you share url', async () => {
                    const { result, message } = await checkShare({ url: 'http://example.com' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { url: 'http://example.com/' } }))
                    expect(result).toBeUndefined()
                })

                it('should let you share title alone', async () => {
                    const { result, message } = await checkShare({ title: 'xxx' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { title: 'xxx', text: '' } }))
                    expect(result).toBeUndefined()
                })

                it('should let you share title and text', async () => {
                    const { result, message } = await checkShare({ title: 'xxx', text: 'yyy' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { title: 'xxx', text: 'yyy' } }))
                    expect(result).toBeUndefined()
                })

                it('should let you share title and url', async () => {
                    const { result, message } = await checkShare({ title: 'xxx', url: 'http://example.com' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { title: 'xxx', url: 'http://example.com/' } }))
                    expect(result).toBeUndefined()
                })

                it('should combine text and url when both are present', async () => {
                    const { result, message } = await checkShare({ text: 'xxx', url: 'http://example.com' })
                    expect(message).toEqual(jasmine.objectContaining({ featureName: 'webCompat', method: 'webShare', params: { text: 'xxx http://example.com/' } }))
                    expect(result).toBeUndefined()
                })

                it('should throw when sharing files', async () => {
                    const { result, message } = await checkShare({ title: 'title', files: [] })
                    expect(message).toBeNull()
                    expect(result.threw.message).toEqual('Invalid share data')
                    expect(result.threw.name).toEqual('TypeError')
                })

                it('should throw when sharing non-http urls', async () => {
                    const { result, message } = await checkShare({ url: 'chrome://bla' })
                    expect(message).toBeNull()
                    expect(result.threw.message).toEqual('Invalid share data')
                    expect(result.threw.name).toEqual('TypeError')
                })

                it('should handle relative urls', async () => {
                    const { result, message } = await checkShare({ url: 'bla' })
                    expect(message.params.url).toMatch(/^http:\/\/localhost:\d+\/bla$/)
                    expect(result).toBeUndefined()
                })

                it('should treat empty url as relative', async () => {
                    const { result, message } = await checkShare({ url: '' })
                    expect(message.params.url).toMatch(/^http:\/\/localhost:\d+\//)
                    expect(result).toBeUndefined()
                })
            })

            describe('(handling errors from Android)', () => {
                it('should handle messaging error', async () => {
                    await page.evaluate(() => {
                        globalThis.cssMessaging.impl.request = () => {
                            return Promise.reject(new Error('something wrong'))
                        }
                    })
                    const result = await page.evaluate('navigator.share({ text: "xxx" })').catch((e) => {
                        return { threw: e }
                    })
                    expect(result.threw.message).toEqual('something wrong')
                    expect(result.threw.name).toEqual('DOMException')
                })

                it('should handle soft failures', async () => {
                    await page.evaluate(() => {
                        globalThis.cssMessaging.impl.request = () => {
                            return Promise.resolve({ failure: { name: 'AbortError', message: 'some error message' } })
                        }
                    })
                    const result = await page.evaluate('navigator.share({ text: "xxx" })').catch((e) => {
                        return { threw: e }
                    })
                    console.error(result.threw)
                    expect(result.threw.message).toEqual('some error message')
                    expect(result.threw.name).toEqual('DOMException')
                })
            })
        })
    })
})

describe('Viewport fixes', () => {
    let browser
    let server
    let teardown
    let setupServer
    let gotoAndWait
    let port
    let page

    beforeAll(async () => {
        ({ browser, setupServer, teardown, gotoAndWait } = await setup({ withExtension: true }))
        server = setupServer()
    })
    afterAll(async () => {
        await server?.close()
        await teardown()
    })

    beforeEach(async () => {
        port = server.address().port
        page = await browser.newPage()
    })

    function getViewportValue () {
        return document.querySelector('meta[name="viewport"]')?.getAttribute('content')
    }

    it('should not change viewport if disabled', async () => {
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } }, 'document.head.innerHTML += \'<meta name="viewport" content="width=device-width">\'')
        const initialViewportValue = await page.evaluate(getViewportValue)
        // Base implementation of the test env should have it.
        expect(initialViewportValue).toEqual('width=device-width')

        // We don't make a change if disabled
        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
        const viewportValue = await page.evaluate(getViewportValue)
        expect(viewportValue).toBeUndefined()
    })

    describe('Desktop mode off', () => {
        it('should force wide viewport if the meta tag is not present', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false
            })
            const width = await page.evaluate('screen.width')
            const expectedWidth = width < 1280 ? 980 : 1280
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual(`width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}`)
        })

        it('should fix the WebView edge case', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false
            }, 'document.head.innerHTML += \'<meta name="viewport" content="initial-scale=1.00001, something-something">\'')
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual('width=device-width, initial-scale=1.00001, something-something')
        })

        it('should ignore the character case in the viewport tag', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: false
            }, 'document.head.innerHTML += \'<meta name="viewport" content="initIAL-scale=1.00001, something-something">\'')
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual('width=device-width, initIAL-scale=1.00001, something-something')
        })
    })

    describe('Desktop mode on', () => {
        it('should force wide viewport, ignoring the viewport tag', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: true
            }, 'document.head.innerHTML += \'<meta name="viewport" content="width=device-width, initial-scale=2, user-scalable=no, something-something">\'')
            const width = await page.evaluate('screen.width')
            const expectedWidth = width < 1280 ? 980 : 1280
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual(`width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, something-something`)
        })

        it('should force wide viewport, ignoring the viewport tag 2', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: true
            }, 'document.head.innerHTML += \'<meta name="viewport" content="something-something">\'')
            const width = await page.evaluate('screen.width')
            const expectedWidth = width < 1280 ? 980 : 1280
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual(`width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)},something-something`)
        })

        it('should ignore the character case in the viewport tag', async () => {
            await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
                site: { enabledFeatures: ['webCompat'] },
                featureSettings: { webCompat: { viewportWidth: 'enabled' } },
                desktopModeEnabled: true
            }, 'document.head.innerHTML += \'<meta name="viewport" content="wIDth=device-width, iniTIal-scale=2, usER-scalable=no, something-something">\'')
            const width = await page.evaluate('screen.width')
            const expectedWidth = width < 1280 ? 980 : 1280
            const viewportValue = await page.evaluate(getViewportValue)
            expect(viewportValue).toEqual(`width=${expectedWidth}, initial-scale=${(width / expectedWidth).toFixed(3)}, something-something`)
        })
    })
})
