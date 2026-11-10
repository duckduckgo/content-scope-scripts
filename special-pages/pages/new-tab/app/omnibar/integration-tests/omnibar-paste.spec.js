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

test.describe('omnibar pasted text', () => {
    /** Small limits so pastes stay readable: 10 chars converts, 30 is the cap. */
    const TEXT_ON = { 'omnibar.enablePastedText': 'true', 'omnibar.pasteConversionThreshold': '10', 'omnibar.maxCharacters': '30' };
    const LONG = 'first line\nsecond';

    test('attaches a long paste as a chip and sends it as textPasted', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        const result = await omnibar.pasteIntoChatInput({ text: LONG });
        expect(result.defaultPrevented).toBe(true);
        await expect(omnibar.textPastedChips()).toHaveCount(1);

        await omnibar.chatInput().fill('summarize');
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(params.chat).toBe('summarize');
        expect(params.textPasted).toEqual([{ content: LONG }]);
        await expect(omnibar.textPastedChips()).toHaveCount(0);
    });

    test('sends pasted text with an empty prompt', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(params.chat).toBe('');
        expect(params.textPasted).toEqual([{ content: LONG }]);
    });

    test('leaves a short or blank paste inline', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        expect((await omnibar.pasteIntoChatInput({ text: 'short' })).defaultPrevented).toBe(false);
        expect((await omnibar.pasteIntoChatInput({ text: ' \n'.repeat(10) })).defaultPrevented).toBe(false);
        await expect(omnibar.textPastedChips()).toHaveCount(0);
    });

    test('leaves a long paste inline when enablePastedText is off', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { 'omnibar.pasteConversionThreshold': '10' });

        expect((await omnibar.pasteIntoChatInput({ text: LONG })).defaultPrevented).toBe(false);
        await omnibar.chatInput().fill('x'.repeat(40));
        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(params.textPasted).toBeUndefined();
    });

    test('leaves a long paste inline in image-generation mode', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { ...TEXT_ON, 'omnibar.enableImageGeneration': 'true' });
        await omnibar.toolsMenuButton().click();
        await omnibar.createImageMenuItem().click();

        await expect(omnibar.imageGenerationInput()).toBeVisible();
        expect((await omnibar.pasteIntoChatInput({ text: LONG }, omnibar.imageGenerationInput())).defaultPrevented).toBe(false);
        await expect(omnibar.textPastedChips()).toHaveCount(0);
    });

    test('removes a pasted-text chip', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.removeTextPastedButton('first line…').click();
        await expect(omnibar.textPastedChips()).toHaveCount(0);
    });

    test('blocks sending and marks the chips while typed text plus pastes is over the limit', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await expect(omnibar.textPastedChipMetadata()).toHaveText(`${LONG.length} characters`);
        await expect(omnibar.textPastedChipMetadata()).not.toHaveAttribute('data-invalid');

        await omnibar.chatInput().fill('x'.repeat(14));
        await expect(omnibar.promptTooLongWarning()).toBeVisible();
        await expect(omnibar.chatSubmitButton()).toBeDisabled();
        await expect(omnibar.textPastedChipMetadata()).toHaveAttribute('data-invalid', 'true');

        await omnibar.chatInput().fill('x'.repeat(13));
        await expect(omnibar.promptTooLongWarning()).toHaveCount(0);
        await expect(omnibar.chatSubmitButton()).toBeEnabled();
        await expect(omnibar.textPastedChipMetadata()).not.toHaveAttribute('data-invalid');
    });

    test('lowers the limit to the image limit while an image is attached', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, { ...TEXT_ON, 'omnibar.imageMaxInputChars': '20' });

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.chatInput().fill('x'.repeat(4));
        await expect(omnibar.promptTooLongWarning()).toHaveCount(0);

        await omnibar.fileInput().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG });
        await expect(omnibar.imagePreviews()).toHaveCount(1);
        await expect(omnibar.promptTooLongWarning()).toBeVisible();
        await expect(omnibar.chatSubmitButton()).toBeDisabled();
        await expect(omnibar.textPastedChipMetadata()).toHaveAttribute('data-invalid', 'true');

        await omnibar.removeImageButton().click();
        await expect(omnibar.promptTooLongWarning()).toHaveCount(0);
        await expect(omnibar.chatSubmitButton()).toBeEnabled();
    });

    test('edits a pasted-text chip and sends the edited text', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.textPastedChips().click();
        await expect(omnibar.textPastedModal()).toBeVisible();
        await expect(omnibar.textPastedModalInput()).toHaveValue(LONG);
        await expect(omnibar.textPastedModal()).toContainText(`${LONG.length} characters`);

        await omnibar.textPastedModalInput().fill('edited text');
        await omnibar.textPastedModalSaveButton().click();
        await expect(omnibar.textPastedModal()).toHaveCount(0);

        await omnibar.chatInput().press('Enter');
        const params = await omnibar.lastSubmitChatParams();
        expect(params.textPasted).toEqual([{ content: 'edited text' }]);
    });

    test('discards edits on cancel', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.textPastedChips().click();
        await omnibar.textPastedModalInput().fill('edited text');
        await omnibar.textPastedModalCancelButton().click();
        await expect(omnibar.textPastedModal()).toHaveCount(0);

        await omnibar.textPastedChips().click();
        await expect(omnibar.textPastedModalInput()).toHaveValue(LONG);
    });

    test('closes only on a backdrop click, not the dialog padding or a selection drag out of the textarea', async ({
        page,
    }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.textPastedChips().click();
        await omnibar.textPastedModalInput().fill('edited text');
        const box = await omnibar.textPastedModal().boundingBox();
        const input = await omnibar.textPastedModalInput().boundingBox();
        if (!box || !input) throw new Error('dialog not laid out');

        await page.mouse.click(box.x + 4, box.y + 4);
        await expect(omnibar.textPastedModal()).toBeVisible();

        await page.mouse.move(input.x + 10, input.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 4, box.y + box.height - 4);
        await page.mouse.up();
        await expect(omnibar.textPastedModal()).toBeVisible();
        await expect(omnibar.textPastedModalInput()).toHaveValue('edited text');

        await page.mouse.click(box.x - 10, box.y - 10);
        await expect(omnibar.textPastedModal()).toHaveCount(0);
    });

    test('blocks saving a blank edit', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.textPastedChips().click();

        await omnibar.textPastedModalInput().fill('   ');
        await expect(omnibar.textPastedModalSaveButton()).toBeDisabled();
    });

    test('saves an edit that leaves the prompt over the limit, and keeps sending blocked', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.chatInput().fill('x'.repeat(10));
        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.textPastedChips().click();

        // 10 typed + 21 pasted = 31, over the 30 cap: the dialog warns but still saves, so chips can be trimmed one at a time.
        await omnibar.textPastedModalInput().fill('y'.repeat(21));
        await expect(omnibar.textPastedModal()).toContainText('31 characters – 1 over the limit');
        await expect(omnibar.textPastedModalSaveButton()).toBeEnabled();
        await omnibar.textPastedModalSaveButton().click();
        await expect(omnibar.textPastedModal()).toHaveCount(0);

        await expect(omnibar.promptTooLongWarning()).toBeVisible();
        await expect(omnibar.chatSubmitButton()).toBeDisabled();
    });

    test('pasted-text chips survive a browser-tab switch', async ({ page }, workerInfo) => {
        // Multi-tab, so `didSwitchToTab` drives a real tabId change.
        const { omnibar } = await setup(page, workerInfo, { ...TEXT_ON, tabs: 'true' });

        await omnibar.pasteIntoChatInput({ text: LONG });
        await expect(omnibar.textPastedChips()).toHaveCount(1);

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.textPastedChips()).toHaveCount(0);

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.textPastedChips()).toHaveCount(1);
    });

    test('reports attach, dialog open, edit and remove as telemetry', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        // Saving unchanged text is not an edit.
        await omnibar.textPastedChips().click();
        await omnibar.textPastedModalSaveButton().click();
        await omnibar.textPastedChips().click();
        await omnibar.textPastedModalInput().fill('edited text');
        await omnibar.textPastedModalSaveButton().click();
        await omnibar.removeTextPastedButton('edited text').click();

        await expect
            .poll(() => omnibar.telemetryEvents())
            .toEqual([
                { name: 'omnibar_pasted_text_attached' },
                { name: 'omnibar_pasted_text_dialog_opened' },
                { name: 'omnibar_pasted_text_dialog_opened' },
                { name: 'omnibar_pasted_text_edited' },
                { name: 'omnibar_pasted_text_removed' },
            ]);
    });

    test('does not report chips cleared by submitting as removed', async ({ page }, workerInfo) => {
        const { omnibar } = await setup(page, workerInfo, TEXT_ON);

        await omnibar.pasteIntoChatInput({ text: LONG });
        await omnibar.chatInput().press('Enter');
        await omnibar.lastSubmitChatParams();

        expect(await omnibar.telemetryEvents()).toEqual([{ name: 'omnibar_pasted_text_attached' }]);
    });
});
