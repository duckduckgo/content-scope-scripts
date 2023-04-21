import { Mocks } from './mocks.js'
import { expect } from '@playwright/test'
import { PlatformInfo } from '@duckduckgo/messaging/lib/test-utils.mjs'
import { join } from 'node:path'

const MOCK_VIDEO_ID = 'VIDEO_ID'
const MOCK_VIDEO_TITLE = 'Embedded Video - YouTube'
const youtubeEmbed = (id) => 'https://www.youtube-nocookie.com/embed/' + id + '?iv_load_policy=1&autoplay=1&rel=0&modestbranding=1'

export class DuckPlayerPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@duckduckgo/messaging/lib/test-utils.mjs").PlatformInfo} platform
     */
    constructor (page, platform) {
        this.page = page
        this.platform = platform
        this.mocks = new Mocks(page, platform, {
            context: 'specialPages',
            featureName: 'duckPlayerPage',
            env: 'development'
        })
        // default mocks - just enough to render the first page without error
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
     * @param {URLSearchParams} urlParams
     * @return {Promise<void>}
     */
    async openPage (urlParams) {
        const url = 'https://www.youtube-nocookie.com' + '?' + urlParams.toString()

        switch (this.platform.name) {
        case 'windows': {
            await this.mocks.install()
            await this.installYoutubeMocks()
            // construct the final url
            await this.page.goto(url)
            break
        }
        default:
            throw new Error('unreachable')
        }
    }

    /**
     * We don't need to actually load the content for these tests.
     * By mocking the response, we make the tests about 10x faster and also ensure they work offline.
     * @return {Promise<void>}
     */
    async installYoutubeMocks () {
        await this.page.route('https://www.youtube-nocookie.com/**', (route, req) => {
            const url = new URL(req.url())
            if (url.pathname.startsWith('/embed')) {
                return route.continue()
            }
            // try to serve assets, but change `/` to 'index'
            let filepath = url.pathname
            if (filepath === '/') filepath = 'index.html'

            return route.fulfill({
                status: 200,
                path: join(this.basePath, filepath)
            })
        })

        // the iframe
        await this.page.route('https://www.youtube-nocookie.com/embed/**', (request) => {
            return request.fulfill({
                status: 200,
                body: `<html><head><title>${MOCK_VIDEO_TITLE}</title></head><body>Video Embed</body></html>`
            })
        })

        // any navigations to actual youtube
        await this.page.route('https://www.youtube.com/**', (request) => {
            return request.fulfill({
                status: 200,
                body: 'youtube watch'
            })
        })
    }

    /**
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async openWithVideoID (videoID = MOCK_VIDEO_ID) {
        const params = new URLSearchParams(Object.entries({ videoID }))
        await this.openPage(params)
    }

    /**
     * @param {string} timestamp
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async openWithTimestamp (timestamp, videoID = MOCK_VIDEO_ID) {
        const params = new URLSearchParams(Object.entries({ videoID, t: timestamp }))
        await this.openPage(params)
    }

    /**
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async hasLoadedIframe (videoID = MOCK_VIDEO_ID) {
        const expected = new URL(youtubeEmbed(videoID))
        await expect(this.page.locator('iframe'))
            .toHaveAttribute('src', expected.toString())
    }

    async hasTheSameTitleAsEmbed () {
        const expected = 'Duck Player - Embedded Video'

        // verify initial
        await this.page.waitForFunction((expected) => {
            return document.title === expected
        }, expected)
    }

    /**
     * Asserts that the iframe is loaded with the additional 'start' param
     * @param {string} seconds
     * @param {string} [videoID]
     * @returns {Promise<void>}
     */
    async videoStartsAtTimestamp (seconds, videoID = MOCK_VIDEO_ID) {
        // construct the expected url
        const youtubeSrc = new URL(youtubeEmbed(videoID))

        youtubeSrc.searchParams.set('start', seconds)

        const expected = youtubeSrc.toString()

        // verify that the iframe src contains the timestamp
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

    async opensSettingsInNewTab () {
        // duck:// scheme will fail, but we can assert that it was tried and grab the URL
        const failure = new Promise(resolve => {
            this.page.context().on('requestfailed', f => {
                resolve(f.url())
            })
        })

        await this.page.locator('.open-settings').click()

        // this is for windows, we'll need to support more
        expect(await failure).toEqual('duck://settings/duckplayer')
    }

    async opensInYoutube () {
        // duck:// scheme will fail, but we can assert that it was tried and grab the URL
        const failure = new Promise(resolve => {
            this.page.context().on('requestfailed', f => {
                resolve(f.url())
            })
        })
        await this.page.getByRole('link', { name: 'Watch on YouTube' }).click()
        // todo(Shane): platform specific
        expect(await failure).toEqual('duck://player/openInYoutube?v=VIDEO_ID')
    }

    /**
     * @return {Promise<void>}
     */
    async enabledViaSettings () {
        await this.mocks.simulateSubscriptionMessage('onUserValuesChanged', {
            privatePlayerMode: {
                enabled: {}
            },
            overlayInteracted: false
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
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     *
     * @returns {string}
     */
    get basePath () {
        return {
            windows: '../../build/windows/pages/duckplayer'
        }[this.platform.name]
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        if (!('platform' in testInfo.project.use)) {
            throw new Error('unsupported project - missing `use.platform`')
        }

        let testPlatform
        if (testInfo.project.use.platform === 'apple' || testInfo.project.use.platform === 'windows') {
            testPlatform = new PlatformInfo({ name: testInfo.project.use.platform })
        } else {
            throw new Error('unsupported platform name: ' + testInfo.project.use.platform)
        }
        return new DuckPlayerPage(page, testPlatform)
    }
}
