import { Mocks } from './mocks.js'
import { expect } from '@playwright/test'
import { TestPlatform } from '@duckduckgo/messaging/lib/test-utils.mjs'

const MOCK_VIDEO_ID = 'VIDEO_ID'
const youtubeEmbed = (id) => 'https://www.youtube-nocookie.com/embed/' + id + '?iv_load_policy=1&autoplay=1&rel=0&modestbranding=1'

export class DuckPlayerPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").TestPlatform} platform
     */
    constructor (page, platform) {
        this.page = page
        this.platform = platform
        this.messageContext = {
            context: 'specialPages',
            featureName: 'duckPlayerPage'
        }
        this.mocks = new Mocks(page, platform, this.messageContext)
        // default mocks
        this.mocks.defaultResponses({
            /** @type {import("../../pages/duckplayer/src/js/index.js").UserValues} */
            getUserValues: {
                privatePlayerMode: { alwaysAsk: {} },
                overlayInteracted: false
            }
        })
    }

    /**
     * This ensures we can choose when to apply mocks based on the platform
     * @param {string} url
     * @return {Promise<void>}
     */
    async openPage (url) {
        switch (this.platform.name) {
        case 'apple':
        case 'windows':
            await this.mocks.install()
            await this.installYoutubeMocks()
            await this.page.goto(url)
            break
        default:
            throw new Error('unreachable')
        }
    }

    /**
     * Things like the `src` of an iframe can prevent us working offline
     * @return {Promise<void>}
     */
    async installYoutubeMocks () {
        await this.page.route('https://www.youtube-nocookie.com/embed/**', async (request) => {
            return request.fulfill({
                status: 200,
                body: 'youtube iframe src'
            })
        })
    }

    /**
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async forYoutubeVideoID (videoID = MOCK_VIDEO_ID) {
        const params = new URLSearchParams(Object.entries({ videoID }))
        await this.openPage(this.htmlPage + '?' + params.toString())
    }

    /**
     * @param {string} timestamp
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async forYoutubeVideoWithTimestamp (timestamp, videoID = MOCK_VIDEO_ID) {
        const params = new URLSearchParams(Object.entries({ videoID, t: timestamp }))
        await this.openPage(this.htmlPage + '?' + params.toString())
    }

    /**
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async hasLoadedIframe (videoID = MOCK_VIDEO_ID) {
        const youtubeSrc = new URL(youtubeEmbed(videoID))
        await expect(this.page.locator('iframe'))
            .toHaveAttribute('src', youtubeSrc.toString())
    }

    /**
     * Asserts that the iframe is loaded with the additional 'start' param
     * @param {string} seconds
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async hasLoadedIframeWithTimestamp (seconds, videoID = MOCK_VIDEO_ID) {
        const youtubeSrc = new URL(youtubeEmbed(videoID))

        youtubeSrc.searchParams.set('start', seconds)

        const expected = youtubeSrc.toString()

        await expect(this.page.locator('iframe'))
            .toHaveAttribute('src', expected)
    }

    async hasShownErrorMessage () {
        await expect(this.page.getByText('ERROR: Invalid video id')).toBeVisible()
    }

    async hasNotAddedIframe () {
        await expect(this.page.locator('iframe')).toHaveCount(0)
    }

    async toolbarIsVisible () {
        await expect(this.page.locator('.toolbar')).not.toHaveCSS('opacity', '0')
    }

    async toolbarIsHidden () {
        await expect(this.page.locator('.toolbar')).toHaveCSS('opacity', '0')
    }

    async hoverInfoIcon () {
        await this.page.locator('.info-icon-container img').hover()
    }

    async infoTooltipIsShown () {
        await expect(this.page.locator('.info-icon-tooltip')).toBeVisible()
    }

    async infoTooltipIsHidden () {
        await expect(this.page.locator('.info-icon-tooltip')).toBeHidden()
    }

    async clickToOpenSettings () {
        await this.page.locator('.open-settings').click()
    }

    /**
     * @param {import("@playwright/test").Page} otherPage
     */
    async didOpenSettingsInNewPage (otherPage) {
        const calls = await this.mocks.waitForCallCount({ method: 'openSettings', count: 1 })
        expect(calls[0]).toMatchObject({
            payload: {
                context: 'specialPages',
                featureName: 'duckPlayerPage',
                method: 'openSettings',
                params: {
                    target: 'duckplayer'
                }
            }
        })
    }

    async clickPlayOnYouTube () {
        await this.page.getByText('Watch on YouTube').click()
    }

    async navigatedToYouTube (videoID = MOCK_VIDEO_ID) {
        const youtubeSrc = new URL('https://www.youtube.com/watch')
        youtubeSrc.searchParams.set('v', videoID)
        await expect(this.page).toHaveURL(youtubeSrc.toString())
    }

    /**
     * @return {Promise<void>}
     */
    async enabledViaSettings () {
        await this.mocks.simulateSubscriptionMessage('onUserValuesChanged', {
            privatePlayerMode: {
                enabled: {}
            }
        })
    }

    async checkboxWasChecked () {
        await this.page.locator('[type=checkbox]').isChecked()
    }

    /**
     * @return {Promise<void>}
     */
    async didReceiveFirstSettingsUpdate () {
        await this.mocks.waitForCallCount({ count: 1, method: 'getUserValues' })
    }

    async toggleAlwaysOpenSetting () {
        await this.page.getByLabel('Always open YouTube videos in Duck Player').click()
    }

    async settingsAreVisible () {
        // ensure the settings container is visible, because 'always open' setting was off ^^^
        await expect(this.page.locator('.setting-container')).toBeVisible()
    }

    async sentUpdatedSettings () {
        const calls = await this.mocks.waitForCallCount({ count: 1, method: 'setUserValues' })
        expect(calls[0].payload).toMatchObject({
            context: 'specialPages',
            featureName: 'duckPlayerPage',
            method: 'setUserValues',
            params: {
                overlayInteracted: false,
                privatePlayerMode: {
                    enabled: {}
                }
            }
        })
    }

    /**
     * @returns {string}
     */
    get htmlPage () {
        return {
            apple: '/Sources/ContentScopeScripts/dist/pages/duckplayer/index.html',
            windows: '/build/windows/pages/duckplayer/index.html'
        }[this.platform.name]
    }

    /**
     * This will read the value from the Playwright project and will
     * load the correct platform
     *
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {import("@playwright/test").Page} page
     */
    static async create (testInfo, page) {
        if (!('platform' in testInfo.project.use)) {
            throw new Error('unsupported project - missing `use.platform`')
        }

        let test
        if (testInfo.project.use.platform === 'apple' || testInfo.project.use.platform === 'windows') {
            test = new TestPlatform({ name: testInfo.project.use.platform })
        } else {
            throw new Error('unsupported platform name: ' + testInfo.project.use.platform)
        }
        return new DuckPlayerPage(page, test)
    }
}
