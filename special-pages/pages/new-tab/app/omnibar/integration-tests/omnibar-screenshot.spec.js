/* global Buffer */
import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/**
 * Screenshot capture (native `omnibar_captureScreenshot`) into the Duck.ai prompt, driven through
 * the dev mock transport (`omnibar.mock-transport.js`). Paste is covered in `omnibar-paste.spec.js`.
 */

const BOTH_MODES = 'dragToSelect,selectWindowOrDisplay';
/** Supports images but not PDFs */
const IMAGE_MODEL = 'gpt-4o-mini';
/** Supports neither */
const TEXT_ONLY_MODEL = 'openai_gpt-oss-120b';

/** A 1x1 PNG, base64-encoded. */
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
const TINY_PNG = Buffer.from(TINY_PNG_BASE64, 'base64');

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} workerInfo
 * @param {Record<string, string>} [params] - extra mock query params
 */
async function setup(page, workerInfo, params = {}) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    await ntp.reducedMotion();
    await ntp.openPage({
        additional: {
            'omnibar.mode': 'ai',
            'omnibar.enableAiChatTools': 'true',
            'omnibar.selectedModelId': IMAGE_MODEL,
            ...params,
        },
    });
    await omnibar.ready();
    return { ntp, omnibar };
}

/**
 * Width of a submitted PNG, read from its IHDR chunk.
 * @param {string} base64
 */
function pngWidth(base64) {
    return Buffer.from(base64, 'base64').readUInt32BE(16);
}

test.describe('omnibar screenshot menu', () => {
    test('shows an "Add Screenshot" submenu with one row per configured mode', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.attachMenuButton().click();
        await omnibar.addScreenshotMenuItem().hover();

        await expect(omnibar.screenshotSubmenu().getByRole('menuitem')).toHaveText(['Drag to Select', 'Select Window or Display']);
        await expect(omnibar.addScreenshotMenuItem()).toHaveAttribute('aria-expanded', 'true');
    });

    test('only lists the modes native offers', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': 'selectWindowOrDisplay' });

        await omnibar.attachMenuButton().click();
        await omnibar.addScreenshotMenuItem().click();

        await expect(omnibar.screenshotSubmenu().getByRole('menuitem')).toHaveText(['Select Window or Display']);
    });

    test('uses the dropdown even with tabs off, without tab rows', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await expect(omnibar.directFileButton()).toHaveCount(0);
        await omnibar.attachMenuButton().click();
        await expect(omnibar.attachFilesMenuItem()).toBeVisible();
        await expect(omnibar.addScreenshotMenuItem()).toBeVisible();
        await expect(omnibar.attachPageContentMenuItem()).toHaveCount(0);
    });

    test('has no screenshot row without screenshot modes', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.enableAttachTabs': 'true', 'omnibar.screenshotModes': '' });

        await omnibar.attachMenuButton().click();
        await expect(omnibar.attachPageContentMenuItem()).toBeVisible();
        await expect(omnibar.addScreenshotMenuItem()).toHaveCount(0);
    });

    test('keeps the file picker as a direct button when neither tabs nor screenshots are enabled', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo);

        await expect(omnibar.directFileButton()).toBeVisible();
        await expect(omnibar.attachMenuButton()).toHaveCount(0);
    });

    test('greys out "Add Screenshot" when the model cannot take images', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, {
            'omnibar.screenshotModes': BOTH_MODES,
            'omnibar.selectedModelId': TEXT_ONLY_MODEL,
        });

        await omnibar.attachMenuButton().click();
        await expect(omnibar.addScreenshotMenuItem()).toHaveAttribute('aria-disabled', 'true');
        await omnibar.addScreenshotMenuItem().hover({ force: true });
        await expect(omnibar.screenshotSubmenu()).toHaveCount(0);
    });

    test('greys out "Add Screenshot" at the image cap', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.fileInput().setInputFiles([
            { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
            { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
            { name: 'c.png', mimeType: 'image/png', buffer: TINY_PNG },
        ]);
        await expect(omnibar.imagePreviews()).toHaveCount(3);

        await omnibar.attachMenuButton().click();
        await expect(omnibar.addScreenshotMenuItem()).toHaveAttribute('aria-disabled', 'true');
    });

    test('greys out "Add Screenshot" while a capture is pending', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES, 'omnibar.screenshotDelay': '1500' });

        await omnibar.captureScreenshot('Drag to Select');
        await omnibar.attachMenuButton().click();
        await expect(omnibar.addScreenshotMenuItem()).toHaveAttribute('aria-disabled', 'true');

        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await expect(omnibar.addScreenshotMenuItem()).not.toHaveAttribute('aria-disabled', 'true');
    });

    test('opens and closes from the keyboard', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.attachMenuButton().click();
        await expect(omnibar.attachMenu()).toBeFocused();
        await page.keyboard.press('ArrowDown'); // file row → "Add Screenshot"
        await page.keyboard.press('ArrowRight');
        await expect(omnibar.screenshotSubmenu()).toBeFocused();

        await page.keyboard.press('ArrowLeft');
        await expect(omnibar.screenshotSubmenu()).toHaveCount(0);
        await expect(omnibar.attachMenu()).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(omnibar.screenshotSubmenu()).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(omnibar.screenshotSubmenu()).toHaveCount(0);
        await expect(omnibar.attachMenu()).toBeVisible();

        await page.keyboard.press('ArrowRight');
        await expect(omnibar.screenshotSubmenu()).toBeFocused();
        await page.keyboard.press('Enter'); // "Drag to Select"
        await expect(omnibar.attachMenu()).toHaveCount(0);
        await omnibar.expectMethodCalledWith('omnibar_captureScreenshot', { mode: 'dragToSelect' });
    });

    test('closes the submenu when another row is hovered', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.attachMenuButton().click();
        await omnibar.addScreenshotMenuItem().hover();
        await expect(omnibar.screenshotSubmenu()).toBeVisible();
        await omnibar.attachFilesMenuItem().hover();
        await expect(omnibar.screenshotSubmenu()).toHaveCount(0);
    });
});

test.describe('omnibar screenshot capture', () => {
    test('attaches the capture at full size and submits it', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.captureScreenshot('Drag to Select');
        await omnibar.expectMethodCalledWith('omnibar_captureScreenshot', { mode: 'dragToSelect' });
        await expect(omnibar.attachmentChips().locator('[data-attachment-kind="image"]')).toHaveCount(1);

        await omnibar.chatInput().fill('what is this');
        await omnibar.chatInput().press('Enter');

        const params = await omnibar.lastSubmitChatParams();
        expect(params.images).toHaveLength(1);
        expect(params.images?.[0].format).toBe('png');
        // The mock capture is 1024px wide, like native's; it must not be shrunk to the 512px picker size.
        expect(pngWidth(params.images?.[0].data ?? '')).toBe(1024);
    });

    test('sends screenshot and image telemetry', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.captureScreenshot('Select Window or Display');
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await expect
            .poll(() => omnibar.telemetryEvents())
            .toEqual([
                { name: 'omnibar_image_attached', value: { source: 'screenshot' } },
                { name: 'omnibar_screenshot_taken', value: { kind: 'window' } },
            ]);

        await omnibar.removeImageButton().click();
        await expect(omnibar.imagePreviews()).toHaveCount(0);
        await expect
            .poll(async () => (await omnibar.telemetryEvents()).slice(2))
            .toEqual([{ name: 'omnibar_image_removed', value: { source: 'screenshot' } }, { name: 'omnibar_screenshot_removed' }]);
    });

    test('numbers repeated screenshots so each one attaches', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.screenshotModes': BOTH_MODES });

        await omnibar.captureScreenshot('Drag to Select');
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await omnibar.captureScreenshot('Drag to Select');
        await expect(omnibar.imagePreviews()).toHaveCount(2);
    });

    test('shows an inline error, without telemetry, when native fails', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, {
            'omnibar.screenshotModes': BOTH_MODES,
            'omnibar.screenshotResult': 'error',
        });

        await omnibar.captureScreenshot('Drag to Select');
        await expect(page.getByRole('alert')).toHaveText("Couldn't capture screenshot");
        await expect(omnibar.imagePreviews()).toHaveCount(0);
        expect(await omnibar.telemetryEvents()).toEqual([]);
    });

    test('clears the error on the next capture', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, {
            'omnibar.screenshotModes': BOTH_MODES,
            'omnibar.screenshotResult': 'error',
        });

        await omnibar.captureScreenshot('Drag to Select');
        await expect(page.getByRole('alert')).toBeVisible();

        await page.evaluate(() => {
            window.__playwright_01.mockResponses = {
                ...window.__playwright_01.mockResponses,
                // @ts-expect-error - mock response override
                omnibar_captureScreenshot: {},
            };
        });
        await omnibar.captureScreenshot('Drag to Select');
        await expect(page.getByRole('alert')).toHaveCount(0);
    });

    test('does nothing when the user cancels', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, {
            'omnibar.screenshotModes': BOTH_MODES,
            'omnibar.screenshotResult': 'cancel',
        });

        await omnibar.captureScreenshot('Drag to Select');
        await omnibar.expectMethodCallCount('omnibar_captureScreenshot', 1);
        await expect(page.getByRole('alert')).toHaveCount(0);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
        expect(await omnibar.telemetryEvents()).toEqual([]);
    });

    test('reports a capture the page cannot process', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, {
            'omnibar.screenshotModes': BOTH_MODES,
            'omnibar.screenshotResult': 'invalid',
        });

        await omnibar.captureScreenshot('Drag to Select');
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(omnibar.imagePreviews()).toHaveCount(0);
        await expect.poll(() => omnibar.telemetryEvents()).toEqual([{ name: 'omnibar_screenshot_failed', value: { reason: 'failed' } }]);
    });
});
