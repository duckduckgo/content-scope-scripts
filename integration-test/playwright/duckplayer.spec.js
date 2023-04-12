import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import {
    mockResponses,
    mockWindowsMessaging, readOutgoingMessages,
    waitForCallCount, wrapWindowsScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'

const overlaysHtml = 'integration-test/test-pages/duckplayer/pages/overlays.html'
const overlaysJson = './integration-test/test-pages/duckplayer/config/overlays.json'
const playerHTML = 'integration-test/test-pages/duckplayer/pages/player.html'

test.describe('duckplayer overlays', () => {
    test('loads overlays when page is www.youtube.com', async ({ page }, workerInfo) => {
        await setup(page, {
            configPath: overlaysJson,
            // @ts-expect-error - playwright config not typed
            platform: workerInfo.project.use.platform
        })

        // goto page
        await routeAs(page, {
            url: 'https://www.youtube.com',
            path: overlaysHtml
        })

        // overlays should be present
        await page.locator('.ddg-overlay.ddg-overlay-hover').waitFor({ timeout: 500, state: 'hidden' })
    })
    test('skips overlay code on none-youtube', async ({ page }, workerInfo) => {
        await setup(page, {
            configPath: overlaysJson,
            // @ts-expect-error - playwright config not typed
            platform: workerInfo.project.use.platform
        })

        // goto page
        await routeAs(page, {
            url: 'https://example.com',
            path: overlaysHtml
        })

        // overlays should be absent
        expect(await page.locator('.ddg-overlay.ddg-overlay-hover').count()).toEqual(0)
    })
    test.describe('main player overlay', () => {
        test('sends expected messages', async ({ page }, workerInfo) => {
            await setup(page, {
                configPath: overlaysJson,
                // @ts-expect-error - playwright config not typed
                platform: workerInfo.project.use.platform
            })

            // goto to page
            await routeAs(page, {
                url: 'https://www.youtube.com/watch?v=123',
                path: playerHTML
            })

            await page.getByText('Remember my choice').click()

            // check the link
            const watchInDuckPlayerLink = page.getByRole('link', { name: 'Watch in Duck Player' })
            expect(await watchInDuckPlayerLink.getAttribute('href')).toBe('duck://player/123')

            // click it
            await watchInDuckPlayerLink.click()

            // wait for 'setUserValues'
            await page.evaluate(waitForCallCount, { method: 'setUserValues', count: 1 })

            // receive all messages sent
            const messagesSent = await page.evaluate(readOutgoingMessages)

            expect(messagesSent).toMatchObject([
                {
                    payload: {
                        context: 'contentScopeScripts',
                        featureName: 'duckPlayer',
                        params: {},
                        method: 'getUserValues',
                        id: 'getUserValues.response'
                    }
                },
                {
                    payload: {
                        context: 'contentScopeScripts',
                        featureName: 'duckPlayer',
                        params: {
                            pixelName: 'overlay',
                            params: {}
                        },
                        method: 'sendDuckPlayerPixel'
                    }
                },
                {
                    payload: {
                        context: 'contentScopeScripts',
                        featureName: 'duckPlayer',
                        params: {
                            pixelName: 'play.use',
                            params: {
                                remember: '1'
                            }
                        },
                        method: 'sendDuckPlayerPixel'
                    }
                },
                {
                    payload: {
                        context: 'contentScopeScripts',
                        featureName: 'duckPlayer',
                        params: {
                            privatePlayerMode: { enabled: {} },
                            overlayInteracted: false
                        },
                        method: 'setUserValues',
                        id: 'setUserValues.response'
                    }
                }
            ])
        })
    })
})

/**
 * This is a bit involved, but verifies that the built artefact behaves as expected
 * given a mocked messaging implementation
 *
 * @param {import("@playwright/test").Page} page
 * @param {object} params
 * @param {string} params.configPath
 * @param {"windows"} params.platform
 * @return {Promise<void>}
 */
async function setup (page, params) {
    const { configPath, platform } = params

    // read remote config from disk
    const remoteConfig = JSON.parse(readFileSync(configPath, 'utf8'))

    // read the built file from disk and do replacements
    const buildArtefact = readFileSync('./build/windows/contentScope.js', 'utf8')
    const injectedJS = wrapWindowsScripts(buildArtefact, {
        $CONTENT_SCOPE$: remoteConfig,
        $USER_UNPROTECTED_DOMAINS$: [],
        $USER_PREFERENCES$: {
            platform: { name: platform },
            debug: true
        }
    })

    // setup shared messaging mocks
    await page.addInitScript(mockWindowsMessaging, {
        messagingContext: {
            env: 'development',
            context: 'contentScopeScripts',
            featureName: 'duckPlayer'
        },
        responses: {
            getUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false
            },
            setUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false
            },
            sendDuckPlayerPixel: {}
        }
    })

    // attach the JS
    await page.addInitScript(injectedJS)
}

/**
 * Load an HTML file, but from a real domain like youtube.com
 * This is useful for verifying that particular rules are working as expected
 *
 * @param {import("@playwright/test").Page} page
 * @param {object} params
 * @param {string} params.url
 * @param {string} params.path
 * @return {Promise<void>}
 */
async function routeAs (page, params) {
    // fake a url load
    await page.route(params.url, (route) => {
        return route.fulfill({ path: params.path })
    })

    // navigate to the url
    await page.goto(params.url)
}
