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

        await overlays.withRemoteConfig();
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        // YouTube's watch page can go fullscreen from a scroll gesture, which stretches
        // the overlay over the whole screen and puts YouTube's controls above it.
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

const TINY_POSTER =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.describe('Video Player buffering feedback', () => {
    test('shows the poster + spinner hold after opt-out until the first frame', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Given the buffering-feedback config gate is enabled
        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        // And the player exposes a poster we can paint offline
        await overlays.mobile.setVideoPoster(TINY_POSTER);

        // When the user opts out of Duck Player
        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();

        // Then the hold covers the player with a poster and the spinner
        await overlays.mobile.bufferingFeedbackShows();
        await overlays.mobile.bufferingFeedbackHasPoster();

        // And it clears once the video reaches its first frame
        await overlays.mobile.firstFrameRenders();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('dismisses the hold on tap without reaching the player', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        await overlays.mobile.tapsBufferingFeedback();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('clears the hold when the player reports an error', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // No frame is coming, and YouTube's error UI is behind the poster
        await overlays.mobile.videoErrors();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('follows the video element when the player swaps it mid-startup', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        // The first-frame callback would otherwise be stranded on the old element
        await overlays.mobile.swapsVideoElement();
        await overlays.mobile.firstFrameRendersEventually();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('withdraws the spinner but keeps the poster when no frame ever arrives', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();
        await overlays.mobile.setVideoPoster(TINY_POSTER);

        // Fake timers from here so the give-up point is deterministic
        await page.clock.install();
        await overlays.mobile.choosesWatchHere();

        await page.clock.fastForward(1000);
        await overlays.mobile.bufferingFeedbackShows();

        await page.clock.fastForward(61000);
        await overlays.mobile.spinnerIsWithdrawn();
        // Never reveal the black frame the hold exists to cover
        await overlays.mobile.bufferingFeedbackHasPoster();
    });

    test('leaves fullscreen so the hold stays dismissable', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();

        test.skip(!(await overlays.mobile.playerEntersFullscreen()), 'browser refused fullscreen');
        await overlays.mobile.isNotFullscreen();
        await overlays.mobile.tapsBufferingFeedback();
        await overlays.mobile.bufferingFeedbackIsRemoved();
    });

    test('stops blocking fullscreen once the hold has cleared', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        await overlays.withRemoteConfig({ json: 'overlays-buffering-feedback.json' });
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.bufferingFeedbackShows();
        await overlays.mobile.firstFrameRenders();
        await overlays.mobile.bufferingFeedbackIsRemoved();

        // Watching the video fullscreen is the point of opting out
        test.skip(!(await overlays.mobile.playerEntersFullscreen()), 'browser refused fullscreen');
        await overlays.mobile.staysFullscreen();
    });

    test('does not show the hold when the config gate is absent', async ({ page }, workerInfo) => {
        const overlays = DuckplayerOverlays.create(page, workerInfo);

        // Default config has no bufferingFeedback gate
        await overlays.withRemoteConfig();
        await overlays.userSettingIs('always ask');
        await overlays.gotoPlayerPage();

        await overlays.mobile.choosesWatchHere();
        await overlays.mobile.overlayIsRemoved();
        await overlays.mobile.bufferingFeedbackNeverShows();
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
