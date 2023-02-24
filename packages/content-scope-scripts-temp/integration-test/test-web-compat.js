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
