// @ts-check
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'node:path'
const CWD = new URL(".", import.meta.url).pathname;
const contentScope = JSON.parse(readFileSync(join(CWD, "remote.json"), "utf8"));
const js = readFileSync(join(CWD, "..", "build", "apple", "contentScope.js"), "utf8");

test.describe('Ensure safari interface is injected', () => {
    test('verify window.safari is absent', async ({page}, {project}) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>`
            })
        })
        await page.addInitScript(() => {
            window.$CONTENT_SCOPE$ = {
                unprotectedTemporary: [],
                features: {}
            }
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: "macos" }
            }
        });
        await page.goto('https://playwright.dev');
        await page.evaluate(js);

        const noSafari = await page.evaluate(() => {
            return 'safari' in window
        })
        expect(noSafari).toEqual(false)
    })
    test('verify window.safari is present when enabled', async ({page}, {project}) => {
        const supports = ['webkit']
        test.skip(!supports.includes(project.name))
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
        await page.route('**/*', (route, request) => {
            return route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><body></body></html>`
            })
        })
        await page.addInitScript((contentScope) => {
            window.$CONTENT_SCOPE$ = {
                unprotectedTemporary: [],
                features: {
                    webCompat: contentScope.features.webCompat
                }
            }
            window.$USER_UNPROTECTED_DOMAINS$ = []
            window.$USER_PREFERENCES$ = {
                platform: { name: "macos" }
            }
        }, contentScope);
        await page.goto('https://playwright.dev');
        await page.evaluate(js);

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

