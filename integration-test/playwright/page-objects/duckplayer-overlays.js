import { readFileSync } from 'fs'
import {
    mockResponses,
    mockWindowsMessaging,
    PlatformInfo,
    readOutgoingMessages, waitForCallCount,
    wrapWindowsScripts
} from '@duckduckgo/messaging/lib/test-utils.mjs'
import { expect } from '@playwright/test'

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
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor (page, platform) {
        this.page = page
        this.platform = platform
        // page.on('console', (msg) => {
        //     console.log(msg.type(), msg.text())
        // })
    }

    async gotoThumbsPage () {
        await this.page.goto(this.overlaysPage)
    }

    async gotoPlayerPage () {
        await this.page.goto(this.playerPage + '?videoID=123')
    }

    async overlayBlocksVideo () {
        await this.page.locator('ddg-video-overlay').waitFor({ state: 'visible', timeout: 1000 })
        await this.page.getByRole('link', { name: 'Watch in Duck Player' }).waitFor({ state: 'visible', timeout: 1000 })
    }

    async smallOverlayShows () {
        await this.page.getByRole('link', { name: 'Duck Player', exact: true }).waitFor({ state: 'attached' })
    }

    // Given the "overlays" feature is enabled
    async overlaysEnabled () {
        await this.setup({ config: loadConfig('overlays') })
    }

    async videoOverlayDoesntShow () {
        expect(await this.page.locator('ddg-video-overlay').count()).toBe(0)
    }

    // setting is always ask
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

    // Given the "overlays" feature is disabled
    async overlaysDisabled () {
        // load original config
        const config = loadConfig('overlays')
        // remove all domains from 'overlays'
        config.features.duckPlayer.settings.overlays = []
        await this.setup({ config })
    }

    async hoverAThumbnail () {
        await this.page.locator('.thumbnail[href="/watch?v=1"]').first().hover()
    }

    async clickDDGOverlay () {
        await this.hoverAThumbnail()
        await this.page.locator('.ddg-play-privately').click({ force: true })
    }

    async isVisible () {
        await this.page.locator('.ddg-play-privately').waitFor({ state: 'attached', timeout: 1000 })
    }

    async overlaysDontShow () {
        expect(await this.page.locator('.ddg-overlay.ddg-overlay-hover').count()).toEqual(0)
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
                    context: 'contentScopeScripts',
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
     * @return {string}
     */
    get buildArtefact () {
        // we can add more platforms here later
        const buildArtefact = readFileSync('./build/windows/contentScope.js', 'utf8')
        return buildArtefact
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
        const injectedJS = wrapWindowsScripts(this.buildArtefact, {
            $CONTENT_SCOPE$: config,
            $USER_UNPROTECTED_DOMAINS$: [],
            $USER_PREFERENCES$: {
                platform: { name: this.platform.name },
                debug: true
            }
        })

        // setup shared messaging mocks
        await this.page.addInitScript(mockWindowsMessaging, {
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
                    context: 'contentScopeScripts',
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
        if (!('platform' in testInfo.project.use)) {
            throw new Error('unsupported project - missing `use.platform`')
        }

        let testPlatform
        if (testInfo.project.use.platform === 'windows') {
            testPlatform = new PlatformInfo({ name: testInfo.project.use.platform })
        } else {
            throw new Error('unsupported platform name: ' + testInfo.project.use.platform)
        }
        return new DuckplayerOverlays(page, testPlatform)
    }
}

/**
 * @param {"overlays"} name
 * @return {Record<string, any>}
 */
function loadConfig (name) {
    return JSON.parse(readFileSync(`./integration-test/test-pages/duckplayer/config/${name}.json`, 'utf8'))
}
