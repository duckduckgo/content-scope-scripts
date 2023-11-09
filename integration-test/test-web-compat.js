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

    it('should expose window.navigator.permissions when enabled', async () => {
        const port = server.address().port
        const page = await browser.newPage()
        // Fake the Notification API not existing in this browser
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
        function checkPermissionThrows (name) {
            try {
                window.navigator.permissions.query({ name })
            } catch (e) {
                return e.message
            }
        }

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } })
        const initialPermissions = await page.evaluate(checkForPermissions)
        // Base implementation of the test env should have it.
        expect(initialPermissions).toEqual(true)
        const initialDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent)
        expect(initialDescriptorSerialization).toEqual(true)

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, { site: { enabledFeatures: [] } }, removePermissionsScript)
        const noPermissions = await page.evaluate(checkForPermissions)
        expect(noPermissions).toEqual(false)

        await gotoAndWait(page, `http://localhost:${port}/blank.html`, {
            site: {
                enabledFeatures: ['webCompat']
            },
            featureSettings: {
                webCompat: {
                    permissions: {
                        state: 'enabled',
                        validPermissionNames: [
                            'geolocation',
                            'notifications',
                            'push',
                            'persistent-storage',
                            'midi',
                            'test-value'
                        ]
                    }
                }
            }
        }, removePermissionsScript)
        const hasPermissions = await page.evaluate(checkForPermissions)
        expect(hasPermissions).toEqual(true)

        const modifiedDescriptorSerialization = await page.evaluate(checkObjectDescriptorIsNotPresent)
        // This fails in a test condition purely because we have to add a descriptor to modify the prop
        expect(modifiedDescriptorSerialization).toEqual(false)

        const permissionThrows = await page.evaluate(checkPermissionThrows, 'not-existent')
        expect(permissionThrows).not.toBeUndefined()
        expect(permissionThrows).toContain('not-existent')

        const doesNotThrow = await page.evaluate(checkPermissionThrows, 'test-value')
        expect(doesNotThrow).toBeUndefined()
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
    })
})
