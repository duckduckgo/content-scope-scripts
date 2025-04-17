import { test } from '@playwright/test';
import { DuckPlayerNative } from './page-objects/duckplayer-native.js';

test.describe('Duck Player Native messaging', () => {
    test('Calls initial setup', async ({ page }, workerInfo) => {
        const duckPlayer = DuckPlayerNative.create(page, workerInfo);

        // Given the duckPlayerNative feature is enabled
        await duckPlayer.withRemoteConfig();

        // When I go to a YouTube page
        await duckPlayer.gotoYouTubePage();

        // Then Initial Setup should be called
        await duckPlayer.didSendInitialHandshake();
    });

    test('Polls timestamp on YouTube', async ({ page }, workerInfo) => {
        const duckPlayer = DuckPlayerNative.create(page, workerInfo);

        // Given the duckPlayerNative feature is enabled
        await duckPlayer.withRemoteConfig();

        // When I go to a YouTube page
        await duckPlayer.gotoYouTubePage();

        // Then the current timestamp should be polled back to the browser
        await duckPlayer.didSendCurrentTimestamp();
    });
});

test.describe('Duck Player Native thumbnail overlay', () => {
    test('Shows overlay on YouTube player page', async ({ page }, workerInfo) => {
        const duckPlayer = DuckPlayerNative.create(page, workerInfo);

        // Given the duckPlayerNative feature is enabled
        await duckPlayer.withRemoteConfig();

        // When I go to a YouTube page
        await duckPlayer.gotoYouTubePage();
        await duckPlayer.sendOnMediaControl();

        // Then I should see the thumbnail overlay in the page
        await duckPlayer.didShowThumbnailOverlay();
    });
});