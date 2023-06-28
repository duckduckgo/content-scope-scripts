import { readFileSync } from 'fs'
import {
    mockResponses, mockWebkitMessaging,
    mockWindowsMessaging,
    readOutgoingMessages, simulateSubscriptionMessage, waitForCallCount, wrapWebkitScripts,
    wrapWindowsScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { expect } from '@playwright/test'
import { perPlatform } from '../type-helpers.mjs'

// Every possible combination of UserValues
const userValues = {
    /** @type {import("../../../src/features/duck-player.js").UserValues} */
    'always ask': {
        privatePlayerMode: { alwaysAsk: {} },
        overlayInteracted: false
    },
    /** @type {import("../../../src/features/duck-player.js").UserValues} */
    'always ask remembered': {
        privatePlayerMode: { alwaysAsk: {} },
        overlayInteracted: true
    },
    /** @type {import("../../../src/features/duck-player.js").UserValues} */
    enabled: {
        privatePlayerMode: { enabled: {} },
        overlayInteracted: false
    },
    /** @type {import("../../../src/features/duck-player.js").UserValues} */
    disabled: {
        privatePlayerMode: { disabled: {} },
        overlayInteracted: false
    }
}

export class DuckplayerOverlays {
    overlaysPage = '/duckplayer/pages/overlays.html'
    playerPage = '/duckplayer/pages/player.html'
    serpProxyPage = '/duckplayer/pages/serp-proxy.html'
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../type-helpers.mjs").Build} build
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        page.on('console', (msg) => {
            console.log(msg.type(), msg.text())
        })
    }

    async gotoThumbsPage () {
        await this.page.goto(this.overlaysPage)
    }

    async gotoYoutubeHomepage () {
        await this.page.goto('https://www.youtube.com')
        // cookie banner
        await this.page.getByRole('button', { name: 'Reject the use of cookies and other data for the purposes described' }).click()
    }

    /**
     * @param {object} [params]
     * @param {"default" | "incremental-dom"} [params.variant]
     *  - we are replicating different strategies in the HTML to capture regressions/bugs
     */
    async gotoPlayerPage (params = {}) {
        const { variant = 'default' } = params
        const urlParams = new URLSearchParams([
            ['videoID', '123'],
            ['variant', variant]
        ])

        await this.page.goto(this.playerPage + '?' + urlParams.toString())
    }

    async gotoSerpProxyPage () {
        await this.page.goto(this.serpProxyPage)
    }

    async userValuesCallIsProxied () {
        const calls = await this.page.evaluate(readOutgoingMessages)
        expect(calls).toMatchObject([
            {
                payload: {
                    context: this.messagingContext,
                    featureName: 'duckPlayer',
                    params: {},
                    method: 'getUserValues',
                    id: 'getUserValues.response'
                }
            }
        ])
    }

    async overlayBlocksVideo () {
        await this.page.locator('ddg-video-overlay').waitFor({ state: 'visible', timeout: 1000 })
        await this.page.getByRole('link', { name: 'Watch in Duck Player' }).waitFor({ state: 'visible', timeout: 1000 })
        await this.page
            .getByText('Duck Player provides a clean viewing experience without personalized ads and prevents viewing activity from influencing your YouTube recommendations.')
            .waitFor({ timeout: 100 })
    }

    async smallOverlayShows () {
        await this.page.getByRole('link', { name: 'Duck Player', exact: true }).waitFor({ state: 'attached' })
    }

    /**
     * @param {object} [params]
     * @param {'overlays' | 'overlays-live'} [params.json="overlays"] - default is settings for localhost
     */
    async overlaysEnabled (params = {}) {
        const { json = 'overlays' } = params

        await this.setup({ config: loadConfig(json) })
    }

    async serpProxyEnabled () {
        const config = loadConfig('overlays')
        const domains = config.features.duckPlayer.settings.domains[0].patchSettings
        config.features.duckPlayer.settings.domains[0].patchSettings = domains.filter(x => x.path === '/overlays/serpProxy/state')
        await this.setup({ config })
    }

    async videoOverlayDoesntShow () {
        expect(await this.page.locator('ddg-video-overlay').count()).toBe(0)
    }

    /**
     * @param {keyof userValues} setting
     * @return {Promise<void>}
     */
    async userSettingIs (setting) {
        await this.page.addInitScript(mockResponses, {
            responses: {
                getUserValues: userValues[setting]
            }
        })
    }

    /**
     * @param {keyof userValues} setting
     */
    async userChangedSettingTo (setting) {
        await this.page.evaluate(simulateSubscriptionMessage, {
            messagingContext: {
                context: this.messagingContext,
                featureName: 'duckPlayer',
                env: 'development'
            },
            name: 'onUserValuesChanged',
            payload: userValues[setting],
            injectName: this.build.name
        })
    }

    async overlaysDisabled () {
        // load original config
        const config = loadConfig('overlays')
        // remove all domains from 'overlays', this disables the feature
        config.features.duckPlayer.settings.domains = []
        await this.setup({ config })
    }

    async hoverAThumbnail () {
        await this.page.locator('.thumbnail[href="/watch?v=1"]').first().hover()
    }

    async hoverAYouTubeThumbnail () {
        await this.page.locator('a.ytd-thumbnail[href^="/watch"]').first().hover({ force: true })
    }

    async hoverShort () {
        // this should auto-wait for our test code to modify the DOM like YouTube does
        await this.page.getByRole('heading', { name: 'Shorts', exact: true }).scrollIntoViewIfNeeded()
        await this.page.locator('a[href*="/shorts"]').first().hover({ force: true })
    }

    async clickDDGOverlay () {
        await this.hoverAThumbnail()
        await this.page.locator('.ddg-play-privately').click({ force: true })
    }

    async isVisible () {
        await this.page.locator('.ddg-play-privately').waitFor({ state: 'attached', timeout: 1000 })
    }

    async overlaysDontShow () {
        const elements = await this.page.locator('.ddg-overlay.ddg-overlay-hover').count()

        // if the element exists, assert that it is hidden
        if (elements > 0) {
            const style = await this.page.evaluate(() => {
                const div = /** @type {HTMLDivElement|null} */(document.querySelector('.ddg-overlay.ddg-overlay-hover'))
                if (div) {
                    return div.style.display
                }
                return ''
            })
            expect(style).toEqual('none')
        }

        // if we get here, the element was absent
    }

    async watchInDuckPlayer () {
        const failure = new Promise(resolve => {
            this.page.context().on('requestfailed', f => {
                if (f.url().startsWith('duck')) resolve(f.url())
            })
        })

        await this.page.getByRole('link', { name: 'Watch in Duck Player' }).click()

        // assert the page tried to navigate to duck player
        expect(await failure).toEqual('duck://player/123')
    }

    async watchHere () {
        await this.page.getByText('Watch Here').click()
    }

    async rememberMyChoice () {
        await this.page.getByText('Remember my choice').click()
    }

    /**
     * To say 'our player loads' means to verify that the correct message is communicated
     * to native platforms
     *
     * @return {Promise<void>}
     */
    async playerLoadsForCorrectVideo () {
        const messages = await this.waitForMessage('openDuckPlayer')
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.messagingContext,
                    featureName: 'duckPlayer',
                    params: {
                        href: 'duck://player/1'
                    },
                    method: 'openDuckPlayer'
                }
            }
        ])
    }

    /**
     * This is a bit involved, but verifies that the built artefact behaves as expected
     * given a mocked messaging implementation
     *
     * @param {object} params
     * @param {Record<string, any>} params.config
     * @return {Promise<void>}
     */
    async setup (params) {
        const { config } = params

        // read the built file from disk and do replacements
        const wrapFn = this.build.switch({
            'apple-isolated': () => wrapWebkitScripts,
            windows: () => wrapWindowsScripts
        })

        const injectedJS = wrapFn(this.build.artifact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name },
                debug: true
            }
        })

        const mockMessaging = this.build.switch({
            windows: () => mockWindowsMessaging,
            'apple-isolated': () => mockWebkitMessaging
        })

        await this.page.addInitScript(mockMessaging, {
            messagingContext: {
                env: 'development',
                context: this.messagingContext,
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
        await this.page.addInitScript(injectedJS)
    }

    /**
     * @param {string} method
     * @return {Promise<void>}
     */
    async waitForMessage (method) {
        await this.page.waitForFunction(waitForCallCount, {
            method,
            count: 1
        }, { timeout: 3000, polling: 100 })
        const calls = await this.page.evaluate(readOutgoingMessages)
        return calls.filter(v => v.payload.method === method)
    }

    /**
     * @param {keyof userValues} setting
     * @return {Promise<void>}
     */
    async userSettingWasUpdatedTo (setting) {
        const messages = await this.waitForMessage('setUserValues')
        expect(messages).toMatchObject([
            {
                payload: {
                    context: this.messagingContext,
                    featureName: 'duckPlayer',
                    params: userValues[setting],
                    method: 'setUserValues'
                }
            }
        ])
    }

    /**
     * Helper for creating an instance per platform
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new DuckplayerOverlays(page, build, platformInfo)
    }

    get messagingContext () {
        return this.build.name === 'apple-isolated'
            ? 'contentScopeScriptsIsolated'
            : 'contentScopeScripts'
    }
}

/**
 * @param {"overlays" | "overlays-live"} name
 * @return {Record<string, any>}
 */
function loadConfig (name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/duckplayer/config/${name}.json`, 'utf8'))
}
