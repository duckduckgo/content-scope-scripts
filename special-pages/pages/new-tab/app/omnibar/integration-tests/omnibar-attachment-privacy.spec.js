/* global Buffer */
import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/**
 * The file-upload privacy disclaimer: native answers with `showAttachmentPrivacyDisclaimer`,
 * the page decides when a draft starts and reports each display back.
 */

/** A tiny valid PDF, base64-encoded, used to drive `setInputFiles` without a fixture file. */
const PDF_BYTES = Buffer.from(
    'JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=',
    'base64',
);

/** A 1x1 PNG, base64-encoded, used to drive image `setInputFiles` without a fixture file. */
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const DISCLAIMER = /Files are automatically scanned for illegal content/;

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

/**
 * @param {ReturnType<typeof setup>} harness
 * @param {boolean} allowed - What native answers on `showAttachmentPrivacyDisclaimer`.
 * @param {object} [extra] - Further query params, e.g. `omnibar: true` to make the widget toggleable.
 */
async function openAiOmnibar({ ntp, omnibar }, allowed, extra = {}) {
    await ntp.reducedMotion();
    await ntp.openPage({
        additional: {
            'omnibar.mode': 'ai',
            'omnibar.enableAiChatTools': 'true',
            'omnibar.selectedModelId': 'claude-haiku-4-5',
            'omnibar.showAttachmentPrivacyDisclaimer': String(allowed),
            ...extra,
        },
    });
    await omnibar.ready();
}

/** Everything the AI composer needs, since a config push replaces the config wholesale. */
const AI_CONFIG = {
    mode: /** @type {const} */ ('ai'),
    enableAi: true,
    enableAiChatTools: true,
    selectedModelId: 'claude-haiku-4-5',
    aiModelSections: [
        {
            items: [
                {
                    id: 'claude-haiku-4-5',
                    name: 'Claude Haiku 4.5',
                    shortName: 'Haiku 4.5',
                    isAvailable: true,
                    supportsImageUpload: true,
                    supportedFileTypes: ['application/pdf'],
                },
            ],
        },
    ],
};

/** @param {OmnibarPage} omnibar */
async function attachFile(omnibar, name = 'q3-report.pdf') {
    await omnibar.fileInput().setInputFiles({ name, mimeType: 'application/pdf', buffer: PDF_BYTES });
    await expect(omnibar.fileChip()).toHaveCount(1);
}

test.describe('omnibar attachment privacy disclaimer', () => {
    test('shows on staging a file and reports the display once', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await attachFile(omnibar);

        await expect(omnibar.noticeDrawer()).toBeVisible();
        await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);
        await omnibar.expectMethodCalledWith('omnibar_attachmentPrivacyDisclaimerShown', { kind: 'file' });
    });

    test('reports kind image for an image attachment', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await omnibar.fileInput().setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: TINY_PNG });

        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.expectMethodCalledWith('omnibar_attachmentPrivacyDisclaimerShown', { kind: 'image' });
    });

    test('stays hidden when native says the cap is reached', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, false);
        const { omnibar } = harness;

        await attachFile(omnibar);

        await expect(omnibar.noticeDrawer()).toHaveCount(0);
        await omnibar.expectMethodNotCalled('omnibar_attachmentPrivacyDisclaimerShown');
    });

    test('removing the attachment hides it, re-attaching does not spend another display', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toBeVisible();

        await omnibar.removeFileButton('q3-report.pdf').click();
        await expect(omnibar.fileChip()).toHaveCount(0);
        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.expectExactMethodCallCount('omnibar_attachmentPrivacyDisclaimerShown', 1);
    });

    test('toggling out of Duck.ai and back does not spend another display', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);

        for (let toggle = 0; toggle < 3; toggle++) {
            await omnibar.switchMode({ mode: 'search' });
            await expect(omnibar.noticeDrawer()).toHaveCount(0);
            await omnibar.switchMode({ mode: 'ai' });
            await expect(omnibar.fileChip()).toHaveCount(1);
            await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);
        }

        await omnibar.expectExactMethodCallCount('omnibar_attachmentPrivacyDisclaimerShown', 1);
    });

    test('hiding and restoring the widget does not spend another display', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true, { omnibar: true });
        const { omnibar } = harness;

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);

        await omnibar.customizeButton().click();
        await omnibar.toggleSearchButton().click();
        // The widget-list wrapper stays mounted, so assert on the omnibar's own content.
        await expect(omnibar.tabList()).toHaveCount(0);

        await omnibar.toggleSearchButton().click();
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);

        await omnibar.expectExactMethodCallCount('omnibar_attachmentPrivacyDisclaimerShown', 1);
    });

    test('a new draft after submit spends another display', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.submitChat();
        await expect(omnibar.noticeDrawer()).toHaveCount(0);

        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toBeVisible();
        await omnibar.expectExactMethodCallCount('omnibar_attachmentPrivacyDisclaimerShown', 2);
    });

    test('shows for three drafts, stays up for the one that spends the last display, then stops', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        for (let draft = 1; draft <= 3; draft++) {
            await attachFile(omnibar);
            await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);
            await omnibar.submitChat();
        }

        // The third display took the count to the cap, and native pushed the config saying so.
        await attachFile(omnibar);
        await expect(omnibar.noticeDrawer()).toHaveCount(0);
        await omnibar.expectExactMethodCallCount('omnibar_attachmentPrivacyDisclaimerShown', 3);
    });

    test('learn more notifies native and keeps the attachment staged', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await attachFile(omnibar);
        await omnibar.attachmentPrivacyLearnMore().click();

        await omnibar.expectMethodCalledWith('omnibar_openAttachmentPrivacyLearnMore', {});
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.noticeDrawer()).toBeVisible();
    });

    test('outranks the create-image notice', async ({ page }, workerInfo) => {
        const harness = setup(page, workerInfo);
        await openAiOmnibar(harness, true);
        const { omnibar } = harness;

        await omnibar.didReceiveConfig({
            ...AI_CONFIG,
            showAttachmentPrivacyDisclaimer: true,
            createImageModelSwitch: { message: 'Now using GPT-5.4' },
        });
        await omnibar.focusChatInput();
        await expect(omnibar.noticeDrawer()).toContainText('Now using GPT-5.4');

        await attachFile(omnibar);

        await expect(omnibar.noticeDrawer()).toContainText(DISCLAIMER);
        await expect(omnibar.noticeDrawer()).not.toContainText('Now using GPT-5.4');
    });
});
