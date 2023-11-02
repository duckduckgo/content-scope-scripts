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

        // Ensure we do throw on invalid permissions
        const permissionThrows = await page.evaluate(checkPermissionThrows, 'not-existent')
        expect(permissionThrows).not.toBeUndefined()
        expect(permissionThrows).toContain('not-existent')

        // Ensure we don't throw for valid permissions
        const doesNotThrow = await page.evaluate(checkPermissionThrows, 'test-value')
        expect(doesNotThrow).toBeUndefined()
    })
})
