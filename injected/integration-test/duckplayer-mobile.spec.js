import { expect, test } from '@playwright/test';
import { DuckplayerOverlays } from './page-objects/duckplayer-overlays.js';

test.describe('Video Player overlays', () => {
    test("Selecting 'watch here' on mobile", async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given overlays feature is enabled
        await overlays.withRemoteConfig();

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        // watch here = overlays removed
        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
        await overlays.pixels.sendsPixels([
            { pixelName: 'overlay', params: {} },
            { pixelName: 'play.do_not_use', params: { remember: '0' } },
        ]);
    });
    test("Selecting 'watch here' on mobile + remember", async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given overlays feature is enabled
        await overlays.withRemoteConfig();

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        // watch here = overlays removed
        await overlays.mobile.selectsRemember();
        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
        await overlays.pixels.sendsPixels([
            { pixelName: 'overlay', params: {} },
            { pixelName: 'play.do_not_use', params: { remember: '1' } },
        ]);
        await overlays.userSettingWasUpdatedTo('disabled');
    });
    test("Selecting 'watch in duckplayer' on mobile", async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given overlays feature is enabled
        await overlays.withRemoteConfig();

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesDuckPlayer();
        await overlays.pixels.sendsPixels([
            { pixelName: 'overlay', params: {} },
            { pixelName: 'play.use', params: { remember: '0' } },
        ]);
        await overlays.userSettingWasUpdatedTo('always ask');
    });
    test("Selecting 'watch in duckplayer' on mobile + remember", async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given overlays feature is enabled
        await overlays.withRemoteConfig();

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.selectsRemember();
        await overlays.mobile.choosesDuckPlayer();
        await overlays.pixels.sendsPixels([
            { pixelName: 'overlay', params: {} },
            { pixelName: 'play.use', params: { remember: '1' } },
        ]);
        await overlays.userSettingWasUpdatedTo('enabled');
    });
    test('leaves fullscreen so the overlay stays usable', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ fullscreenGuard: true });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        // a scroll gesture on the watch page can go fullscreen, putting YouTube's controls above us
        test.skip(!(await overlays.mobile.playerEntersFullscreen()), 'browser refused fullscreen');
        await overlays.mobile.isNotFullscreen();
        await overlays.mobile.overlayIsStillPresented();
        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
    });

    test('opens info', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given overlays feature is enabled
        await overlays.withRemoteConfig();

        // And my setting is 'always ask'
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();
        await overlays.mobile.opensInfo();
    });
});

test.describe('Video Player buffering feedback', () => {
    /** @type {DuckplayerOverlays} */
    let overlays;

    test.beforeEach(({ page }, workerInfo) => {
        overlays = DuckplayerOverlays.create(page, workerInfo);
    });

    /** @param {Parameters<DuckplayerOverlays['withRemoteConfig']>[0]} [config] the default gates the hold on */
    const opensPlayerPage = async (config = { bufferingFeedback: true }) => {
        await overlays.withRemoteConfig(config);
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();
    };

    test('shows the poster + spinner hold after opt-out until the first frame', async () => {
        // Given the buffering-feedback config gate is enabled
        await opensPlayerPage();

        // And the player exposes a poster we can paint offline
        await overlays.mobile.stubsVideoPoster();

        // When the user opts out of Duck Player
        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();

        // Then the hold covers the player with a poster and the spinner
        await overlays.mobile.bufferingFeedbackShows();
        await overlays.mobile.spinnerShows();
        await overlays.mobile.bufferingFeedbackHasPoster();

        // And it clears once the video reaches its first frame
        await overlays.mobile.firstFrameRenders();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('keeps the hold when tapped while a frame is still coming', async () => {
        await opensPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // dismissing here would reveal the startup state the hold covers, so the first tap is swallowed
        await overlays.mobile.tapsBufferingFeedback();
        await overlays.mobile.bufferingFeedbackShows();
    });

    test('dismisses the hold on tap once the wait is hopeless', async ({ page }) => {
        await opensPlayerPage();

        await page.clock.install();
        await overlays.mobile.choosesWatchHere();
        await page.clock.fastForward(1000);
        await overlays.mobile.spinnerShows();

        await page.clock.fastForward(61000);
        await overlays.mobile.spinnerIsWithdrawn();

        await overlays.mobile.tapsBufferingFeedback();
        await overlays.mobile.bufferingFeedbackIsRemoved();

        await overlays.pixels.sendsPixels([
            { pixelName: 'overlay', params: {} },
            { pixelName: 'play.do_not_use', params: { remember: '0' } },
            // No duration assertion: it reflects how far the fake clock jumped
            { pixelName: 'buffering.hold_removed', params: { reason: 'tap_after_timeout', timed_out: '1' } },
        ]);
    });

    test('falls past a thumbnail YouTube answers with a 404 placeholder', async () => {
        await opensPlayerPage();

        // No page-supplied poster, so the hold walks the synthesised i.ytimg.com URLs
        await overlays.mobile.stubsMissingMaxresThumbnail();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // maxres would have loaded: the placeholder under the 404 is a valid image
        await overlays.mobile.bufferingFeedbackPosterMatches(/hqdefault/);
    });

    test('shows the hold when a drawer config falls back to the classic overlay', async () => {
        // the drawer container named here is not on the page, so the classic overlay wins
        await opensPlayerPage({
            json: 'overlays-drawer.json',
            bufferingFeedback: true,
            drawerContainer: '#ddg-drawer-container-not-in-dom',
        });

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
        await overlays.mobile.bufferingFeedbackShows();
    });

    test('clears the hold when the player reports an error', async () => {
        await opensPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // No frame is coming, and YouTube's error UI is behind the poster
        await overlays.mobile.videoErrors();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('keeps the hold when an image inside the player fails', async () => {
        await opensPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // a blocked ad creative must not be mistaken for the video failing
        await overlays.mobile.imageInsidePlayerFails();
        await overlays.mobile.bufferingFeedbackShows();
    });

    test('follows the video element when the player swaps it mid-startup', async () => {
        await opensPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // the hold watches the container, so a fresh element needs no re-arming
        await overlays.mobile.swapsVideoElement();
        await overlays.mobile.firstFrameRenders();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('withdraws the spinner but keeps the poster when no frame ever arrives', async ({ page }) => {
        await opensPlayerPage();
        await overlays.mobile.stubsVideoPoster();

        // Fake timers from here so the spinner timeout is deterministic
        await page.clock.install();
        await overlays.mobile.choosesWatchHere();

        await page.clock.fastForward(1000);
        await overlays.mobile.spinnerShows();

        await page.clock.fastForward(58000);
        await overlays.mobile.spinnerShows();
        await page.clock.fastForward(2000);

        await overlays.mobile.spinnerIsWithdrawn();
        // Never reveal the black frame the hold exists to cover
        await overlays.mobile.bufferingFeedbackHasPoster();
    });

    test('leaves fullscreen so the hold stays dismissable', async ({ page }) => {
        await opensPlayerPage({ bufferingFeedback: true, fullscreenGuard: true });

        await page.clock.install();
        await overlays.mobile.choosesWatchHere();
        await page.clock.fastForward(1000);
        await overlays.mobile.spinnerShows();

        // taps only dismiss once the wait is hopeless, so that is the state that has to be reachable
        await page.clock.fastForward(61000);
        await overlays.mobile.spinnerIsWithdrawn();

        test.skip(!(await overlays.mobile.playerEntersFullscreen()), 'browser refused fullscreen');
        await overlays.mobile.isNotFullscreen();
        await overlays.mobile.tapsBufferingFeedback();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('stops blocking fullscreen once the hold has cleared', async () => {
        await opensPlayerPage({ bufferingFeedback: true, fullscreenGuard: true });

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();
        await overlays.mobile.firstFrameRenders();
        await overlays.mobile.bufferingFeedbackIsRemoved();

        // Watching the video fullscreen is the point of opting out
        test.skip(!(await overlays.mobile.playerEntersFullscreen()), 'browser refused fullscreen');
        await overlays.mobile.staysFullscreen();
    });

    test('does not show the hold when the config gate is absent', async () => {
        // no bufferingFeedback gate, which is also the state before the config change ships
        await opensPlayerPage({});

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
        await overlays.mobile.bufferingFeedbackNeverShows();
    });

    test('does not show the hold when the opt-out is remembered', async () => {
        await opensPlayerPage();

        await overlays.mobile.selectsRemember();
        await overlays.mobile.choosesWatchHere();

        // remembering takes Duck Player off this page for good, so nothing covers the startup
        await overlays.userSettingWasUpdatedTo('disabled');
        await overlays.mobile.bufferingFeedbackNeverShows();
        await overlays.mobile.overlayIsRemoved();
    });
});

/**
 * Use this test in `--headed` mode to cycle through every language
 */
test.describe.skip('Translated Overlays', () => {
    const items = [
        'bg',
        'cs',
        'da',
        'de',
        'el',
        'en',
        'es',
        'et',
        'fi',
        'fr',
        'hr',
        'hu',
        'it',
        'lt',
        'lv',
        'nb',
        'nl',
        'pl',
        'pt',
        'ro',
        'ru',
        'sk',
        'sl',
        'sv',
        'tr',
    ];
    // const items = ['en']
    for (const locale of items) {
        test(`testing UI ${locale}`, async ({ page }, workerInfo) => {
            // console.log(workerInfo.project.use.viewport.height)
            // console.log(workerInfo.project.use.viewport.width)
            const overlays = DuckplayerOverlays.create(page, workerInfo);
            await overlays.withRemoteConfig({ locale });
            await overlays.userSettingIs('always ask');
            await overlays.gotoPlayerPage();
            await page.locator('ddg-video-overlay-mobile').nth(0).waitFor();
            await page.locator('.html5-video-player').screenshot({ path: `screens/se-2/${locale}.png` });
        });
    }
});

/**
 * Use `npm run playwright-screenshots` to run this test only.
 */
test.describe('Overlay screenshot @screenshots', () => {
    test("testing Overlay UI 'en'", async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);
        await overlays.withRemoteConfig({ locale: 'en' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();
        await page.locator('ddg-video-overlay-mobile').nth(0).waitFor();
        await expect(page.locator('.html5-video-player')).toHaveScreenshot('overlay.png', { maxDiffPixels: 20 });
    });
});
