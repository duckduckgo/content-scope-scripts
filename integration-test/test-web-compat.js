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
            return window.safari.pushNotification.toString()
        })
        expect(pushNotificationToString).toEqual('[object SafariRemoteNotification]')

        const pushNotificationPermission = await page.evaluate(() => {
            return window.safari.pushNotification.permission('test')
        })
        expect(pushNotificationPermission.deviceToken).toEqual(null)
        expect(pushNotificationPermission.permission).toEqual('denied')

        const pushNotificationRequestPermissionThrow = await page.evaluate(() => {
            try {
                window.safari.pushNotification.requestPermission('test', 'test.com')
            } catch (e) {
                return e.message
            }
        })
        expect(pushNotificationRequestPermissionThrow).toEqual('Invalid \'callback\' value passed to safari.pushNotification.requestPermission(). Expected a function.')

        const pushNotificationRequestPermission = await page.evaluate(() => {
            const response = new Promise((resolve) => {
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
