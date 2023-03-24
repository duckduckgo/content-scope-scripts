import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { mockResponse, mockWebkit, mockWindows, removeChromeWebView } from '@duckduckgo/messaging/lib/test-utils.mjs'

test.describe('duckplayer overlays', () => {
    test('loads overlays when page is www.youtube.com', async ({ page }, workerInfo) => {
        await setup({
            page,
            configPath: './integration-test/test-pages/duckplayer/config/overlays.json',
            // @ts-expect-error
            platform: workerInfo.project.use.platform
        })
        await routeAs({
            page,
            url: 'https://www.youtube.com',
            path: 'integration-test/test-pages/duckplayer/pages/overlays.html'
        })
        // await page.pause()
        await page.locator('.ddg-overlay.ddg-overlay-hover').waitFor({ timeout: 500, state: 'hidden' })
    })
    test('skips overlay code on none-youtube', async ({ page }, workerInfo) => {
        await setup({
            page,
            configPath: './integration-test/test-pages/duckplayer/config/overlays.json',
            // @ts-expect-error
            platform: workerInfo.project.use.platform
        })
        await routeAs({
            page,
            url: 'https://example.com',
            path: 'integration-test/test-pages/duckplayer/pages/overlays.html'
        })
        expect(await page.locator('.ddg-overlay.ddg-overlay-hover').count()).toEqual(0)
    })
})

/**
 * @param {object} params
 * @param {import("@playwright/test").Page} params.page
 * @param {string} params.configPath
 * @param {"windows" | "macos"} params.platform
 * @return {Promise<void>}
 */
async function setup (params) {
    const {
        page,
        configPath,
        platform
    } = params

    // read remote config from disk
    const config = JSON.parse(readFileSync(configPath, 'utf8'))

    // choose a JS bundle
    const bundle = {
        windows: './build/windows/contentScope.js',
        apple: './Sources/ContentScopeScripts/dist/contentScope.js'
    }[platform]

    // read the build file from disk
    const build = readFileSync(bundle, 'utf8')

    // setup windows messaging mocks
    const messagingMocks = {
        windows: mockWindows,
        apple: mockWebkit
    }[platform]

    await page.addInitScript(messagingMocks, {
        messagingContext: {
            env: 'development',
            context: 'contentScopeScripts',
            featureName: 'duckPlayer'
        }
    })

    // any additional mock setup
    if (platform === 'windows') {
        await page.addInitScript(removeChromeWebView)
    }

    // setup global injected vars
    await page.addInitScript((params) => Object.assign(globalThis, params), {
        $CONTENT_SCOPE$: config,
        $USER_UNPROTECTED_DOMAINS$: [],
        $USER_PREFERENCES$: {
            platform: { name: platform }
        }
    })

    // add the default mock responses - just enough to get the page working
    await page.addInitScript(mockResponse, {
        responses: {
            getUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false
            }
        }
    })

    // attach the JS
    await page.addInitScript(build)
}

/**
 * @param {object} params
 * @param {import("@playwright/test").Page} params.page
 * @param {string} params.url
 * @param {string} params.path
 * @return {Promise<void>}
 */
async function routeAs (params) {
    const {
        page,
        url,
        path
    } = params

    // fake a url load
    await page.route(url, (route, request) => {
        console.log(request.url())
        return route.fulfill({ path })
    })

    // navigate to the url
    await page.goto(url)
}
