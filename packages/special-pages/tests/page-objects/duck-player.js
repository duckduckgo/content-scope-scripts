import { Mocks } from './mocks.js'
import { expect } from '@playwright/test'
import { join } from 'node:path'
import { perPlatform } from '../../../../integration-test/playwright/type-helpers.mjs'

const MOCK_VIDEO_ID = 'VIDEO_ID'
const MOCK_VIDEO_TITLE = 'Embedded Video - YouTube'
const youtubeEmbed = (id) => 'https://www.youtube-nocookie.com/embed/' + id + '?iv_load_policy=1&autoplay=1&rel=0&modestbranding=1'
const html = {
    unsupported: `<html><head><title>${MOCK_VIDEO_TITLE}</title></head>
<body>
<div class="ytp-error" role="alert" data-layer="4">
    <div class="ytp-error-content" style="padding-top: 175.5px;">
        <div class="ytp-error-content-wrap">
            <div class="ytp-error-content-wrap-reason"><span>Video unavailable</span></div>
            <div class="ytp-error-content-wrap-subreason"><span>This video contains content from Example.com, who has blocked it from display on this website or application<br><a
                    href="http://www.youtube.com/watch?v=UNSUPPORTED&amp;feature=emb_err_woyt" target="_blank">Watch on YouTube</a></span>
            </div>
        </div>
    </div>
</div>
</body>
</html>`
}

/**
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').Build} Build
 * @typedef {import('../../../../integration-test/playwright/type-helpers.mjs').PlatformInfo} PlatformInfo
 */

export class DuckPlayerPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {Build} build
     * @param {PlatformInfo} platform
     */
    constructor (page, build, platform) {
        this.page = page
        this.build = build
        this.platform = platform
        this.mocks = new Mocks(page, build, platform, {
            context: 'specialPages',
            featureName: 'duckPlayerPage',
            env: 'development'
        })
        // default mocks - just enough to render the first page without error
        this.mocks.defaultResponses({
            /** @type {Awaited<ReturnType<import("../../pages/duckplayer/src/js/index.js").DuckPlayerPageMessages['initialSetup']>>} */
            initialSetup: {
                settings: {
                    pip: {
                        status: 'disabled'
                    }
                },
                userValues: {
                    privatePlayerMode: { alwaysAsk: {} },
                    overlayInteracted: false
                }

            },
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
        await this.mocks.install()
        await this.installYoutubeMocks(urlParams)
        // construct the final url
        await this.page.goto(url)
    }

    /**
     * We don't need to actually load the content for these tests.
     * By mocking the response, we make the tests about 10x faster and also ensure they work offline.
     * @param {URLSearchParams} urlParams
     * @return {Promise<void>}
     */
    async installYoutubeMocks (urlParams) {
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
            if (urlParams.get('videoID') === 'UNSUPPORTED') {
                return request.fulfill({
                    status: 200,
                    body: html.unsupported,
                    contentType: 'text/html'
                })
            }
            const mp4VideoPlaceholderAsDataURI = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwFtZGF0AAACogYF//+b3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlMjA5YTFjIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzowMTMzIHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02MyBsb29rYWhlYWRfdGhyZWFkcz0yIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD1xLTIgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNSBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmM9bG9va2FoZWFkIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnY9MCBjbG9zZWRfZ29wPTAgY3V0X3Rocm91Z2g9MCAnbm8tZGlndHMuanBnLTFgcC1mbHWinS3SlB8AP0AAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABSAAAAAAAAAAAAAAAAAAABBZHJ0AAAAAAAAAA=='
            return request.fulfill({
                status: 200,
                contentType: 'text/html',
                body: `
                <html>
                    <head><title>${MOCK_VIDEO_TITLE}</title></head>
                    <body>Video Embed
                        <div id="player">
                            <video src="${mp4VideoPlaceholderAsDataURI}"></video>
                        </div>
                    </body>
                </html>`
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
        const params = new URLSearchParams({ videoID })
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

    async videoHasFocus () {
        await expect(this.page.frameLocator('iframe').locator('video')).toBeVisible()
        await expect(this.page.locator('body')).toHaveAttribute('data-video-state', 'loaded+focussed')
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
        const newTab = new Promise(resolve => {
            // on pages with about:preferences it will launch a new tab
            this.page.context().on('page', resolve)

            // on windows it will be a failed request
            this.page.context().on('requestfailed', resolve)
        })

        const expected = this.build.switch({
            windows: () => 'duck://settings/duckplayer',
            apple: () => 'about:preferences/duckplayer'
        })

        const openSettings = this.page.locator('.open-settings')
        expect(await openSettings.getAttribute('href')).toEqual(expected)
        expect(await openSettings.getAttribute('target')).toEqual('_blank')

        // click to ensure a new tab opens
        await openSettings.click()

        // ensure a new tab was opened (eg: that nothing in our JS stopped the regular click)
        await newTab
    }

    async opensInYoutube () {
        await this.build.switch({
            windows: async () => {
                const failure = new Promise(resolve => {
                    this.page.context().on('requestfailed', f => {
                        resolve(f.url())
                    })
                })
                await this.page.getByRole('link', { name: 'Watch on YouTube' }).click()
                expect(await failure).toEqual('duck://player/openInYoutube?v=VIDEO_ID')
            },
            apple: async () => {
                const nextNavigation = new Promise(resolve => {
                    this.page.context().on('request', f => {
                        resolve(f.url())
                    })
                })
                await this.page.getByRole('link', { name: 'Watch on YouTube' }).click()
                expect(await nextNavigation).toEqual('https://www.youtube.com/watch?v=VIDEO_ID')
            }
        })
    }

    async opensInYoutubeFromError ({ videoID = 'UNSUPPORTED' }) {
        const action = () => this.page.frameLocator('#player').getByRole('link', { name: 'Watch on YouTube' }).click()
        await this.build.switch({
            windows: async () => {
                const failure = new Promise(resolve => {
                    this.page.context().on('requestfailed', f => {
                        resolve(f.url())
                    })
                })
                await action()
                expect(await failure).toEqual(`duck://player/openInYoutube?v=${videoID}`)
            },
            apple: async () => {
                await action()
                await this.page.waitForURL(`https://www.youtube.com/watch?v=${videoID}`)
            }
        })
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
        await this.mocks.waitForCallCount({ count: 1, method: 'initialSetup' })
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

    async withStorageValues () {
        await this.page.evaluate(() => {
            localStorage.setItem('foo', 'bar')
            localStorage.setItem('yt-player-other', 'baz')
        })
    }

    async storageClearedAfterReload () {
        await this.page.reload()
        const storaget = await this.page.evaluate(() => localStorage)
        expect(storaget).toMatchObject({
            'yt-player-other': 'baz'
        })
    }

    /**
     * We test the fully built artifacts, so for each test run we need to
     * select the correct HTML file.
     * @return {string}
     */
    get basePath () {
        return this.build.switch({
            windows: () => '../../build/windows/pages/duckplayer',
            apple: () => '../../Sources/ContentScopeScripts/dist/pages/duckplayer'
        })
    }

    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     */
    static create (page, testInfo) {
        // Read the configuration object to determine which platform we're testing against
        const { platformInfo, build } = perPlatform(testInfo.project.use)
        return new DuckPlayerPage(page, build, platformInfo)
    }
}
