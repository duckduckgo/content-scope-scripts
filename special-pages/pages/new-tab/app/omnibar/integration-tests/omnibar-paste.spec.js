/* global Buffer */
import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/**
 * Clipboard paste and drag-and-drop into the Duck.ai prompt, and image attachment telemetry, driven
 * through the dev mock transport (`omnibar.mock-transport.js`).
 */

/** Supports images but not PDFs */
const IMAGE_MODEL = 'gpt-4o-mini';
/** Supports images and PDFs */
const IMAGE_AND_PDF_MODEL = 'claude-haiku-4-5';
/** Supports neither */
const TEXT_ONLY_MODEL = 'openai_gpt-oss-120b';

/** A 1x1 PNG, base64-encoded. */
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
const TINY_PNG = Buffer.from(TINY_PNG_BASE64, 'base64');
/** A tiny valid PDF, base64-encoded. */
const PDF_BASE64 =
    'JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=';

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

/**
 * A blank PNG of the given size, drawn in the page.
 * @param {import('@playwright/test').Page} page
 * @param {number} width
 * @param {number} height
 */
async function makePng(page, width, height) {
    return await page.evaluate(
        ({ width, height }) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
        },
        { width, height },
    );
}

test.describe('omnibar image telemetry from the file picker', () => {
    test('reports picked images with source "file"', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo);

        await omnibar.fileInput().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG });
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await omnibar.removeImageButton().click();

        await expect
            .poll(() => omnibar.telemetryEvents())
            .toEqual([
                { name: 'omnibar_image_attached', value: { source: 'file' } },
                { name: 'omnibar_image_removed', value: { source: 'file' } },
            ]);
    });
});

test.describe('omnibar paste', () => {
    const PASTE_ON = { 'omnibar.enablePastedAttachments': 'true' };

    test('attaches a pasted bitmap at up to 1024px', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);
        const bitmap = await makePng(page, 1000, 200);

        // Chromium names clipboard bitmaps "image.png".
        const result = await omnibar.pasteIntoChatInput({ files: [{ name: 'image.png', type: 'image/png', base64: bitmap }] });
        expect(result.defaultPrevented).toBe(true);
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await expect.poll(() => omnibar.telemetryEvents()).toEqual([{ name: 'omnibar_image_attached', value: { source: 'paste' } }]);

        await omnibar.chatInput().fill('look');
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(pngWidth(params.images?.[0].data ?? '')).toBe(1000);
    });

    test('numbers repeated pasted bitmaps so each one attaches', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);

        await omnibar.pasteIntoChatInput({ files: [{ name: 'image.png', type: 'image/png', base64: TINY_PNG_BASE64 }] });
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await omnibar.pasteIntoChatInput({ files: [{ name: 'image.png', type: 'image/png', base64: TINY_PNG_BASE64 }] });
        await expect(omnibar.imagePreviews()).toHaveCount(2);
    });

    test('resizes a copied image file like a picked one', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);
        const photo = await makePng(page, 1000, 200);

        await omnibar.pasteIntoChatInput({ files: [{ name: 'photo.png', type: 'image/png', base64: photo }] });
        await expect(omnibar.imagePreviews()).toHaveCount(1);

        await omnibar.chatInput().fill('look');
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(pngWidth(params.images?.[0].data ?? '')).toBe(512);
    });

    test('routes a copied PDF to the file chips', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { ...PASTE_ON, 'omnibar.selectedModelId': IMAGE_AND_PDF_MODEL });

        const result = await omnibar.pasteIntoChatInput({ files: [{ name: 'report.pdf', type: 'application/pdf', base64: PDF_BASE64 }] });
        expect(result.defaultPrevented).toBe(true);
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('reports a pasted image in an unsupported format instead of dropping it silently', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);

        await omnibar.pasteIntoChatInput({ files: [{ name: 'diagram.bmp', type: 'image/bmp', base64: TINY_PNG_BASE64 }] });
        await expect(page.getByRole('alert')).toContainText('diagram.bmp');
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('lets text win over a bitmap on the clipboard', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);

        const result = await omnibar.pasteIntoChatInput({
            text: 'A1\tB1',
            files: [{ name: 'image.png', type: 'image/png', base64: TINY_PNG_BASE64 }],
        });
        expect(result.defaultPrevented).toBe(false);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('leaves a text-only paste alone', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, PASTE_ON);

        const result = await omnibar.pasteIntoChatInput({ text: 'hello' });
        expect(result.defaultPrevented).toBe(false);
    });

    test('ignores images when the model cannot take them', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { ...PASTE_ON, 'omnibar.selectedModelId': TEXT_ONLY_MODEL });

        const result = await omnibar.pasteIntoChatInput({ files: [{ name: 'image.png', type: 'image/png', base64: TINY_PNG_BASE64 }] });
        expect(result.defaultPrevented).toBe(false);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('does not intercept paste unless enablePastedAttachments is on', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo);

        const result = await omnibar.pasteIntoChatInput({ files: [{ name: 'image.png', type: 'image/png', base64: TINY_PNG_BASE64 }] });
        expect(result.defaultPrevented).toBe(false);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
        expect(await omnibar.telemetryEvents()).toEqual([]);
    });
});

test.describe('omnibar drag and drop', () => {
    test('attaches a dropped image like a picked one', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo);
        const photo = await makePng(page, 1000, 200);

        const result = await omnibar.dropOnChatInput({ files: [{ name: 'photo.png', type: 'image/png', base64: photo }] });
        expect(result.accepted).toBe(true);
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await expect.poll(() => omnibar.telemetryEvents()).toEqual([{ name: 'omnibar_image_attached', value: { source: 'file' } }]);

        await omnibar.chatInput().fill('look');
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(pngWidth(params.images?.[0].data ?? '')).toBe(512);
    });

    test('routes a dropped PDF to the file chips', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.selectedModelId': IMAGE_AND_PDF_MODEL });

        const result = await omnibar.dropOnChatInput({ files: [{ name: 'report.pdf', type: 'application/pdf', base64: PDF_BASE64 }] });
        expect(result.accepted).toBe(true);
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('does not accept files when the model cannot take attachments', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.selectedModelId': TEXT_ONLY_MODEL });

        const result = await omnibar.dropOnChatInput({ files: [{ name: 'photo.png', type: 'image/png', base64: TINY_PNG_BASE64 }] });
        expect(result.accepted).toBe(false);
        await expect(omnibar.imagePreviews()).toHaveCount(0);
    });

    test('leaves a text drag to the browser', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo);

        const result = await omnibar.dropOnChatInput({ text: 'hello' });
        expect(result.accepted).toBe(false);
    });
});
