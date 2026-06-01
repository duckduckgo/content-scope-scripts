/* global Buffer */
import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/**
 * Functional coverage for the omnibar attachment features (open-tab content +
 * PDF files). These assert the behaviours the tech designs call out as the
 * web↔native contract — primarily the shape of the `omnibar_submitChat`
 * payload — using the dev mock transport (`omnibar.mock-transport.js`), which
 * serves mock open tabs / tab content and records outgoing notifications.
 *
 * @see attach-tabs-ntp-td.md, attach-files-ntp-td.md
 */

/** A tiny valid PDF, base64-encoded, used to drive `setInputFiles` without a fixture file. */
const PDF_BYTES = Buffer.from(
    'JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=',
    'base64',
);

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').TestInfo} workerInfo */
function setup(page, workerInfo) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    return { ntp, omnibar };
}

test.describe('omnibar tab attachment', () => {
    test('attaches a tab, renders a chip, and includes its pageContext on submit', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            // model with no image/file support isolates the paperclip menu to the tabs route
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');

        // chip becomes "ready" once omnibar_getTabContent resolves
        await expect(omnibar.attachmentChips().locator('[data-status="ready"]')).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'compare these' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.chat).toBe('compare these');
        expect(params.pageContext).toHaveLength(1);
        expect(params.pageContext?.[0].tabId).toBe('tab-2');
        expect(params.pageContext?.[0].title).toBe('Starbucks Coffee Company');
    });

    test('attaches multiple tabs and submits a pageContext entry per chip', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await omnibar.attachTab('MacBook Neo - Apple');
        await expect(omnibar.attachmentChips().locator('[data-status="ready"]')).toHaveCount(2);

        await omnibar.types({ mode: 'ai', value: 'compare' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.pageContext).toHaveLength(2);
        expect(params.pageContext?.map((c) => c.tabId).sort()).toEqual(['tab-1', 'tab-2']);
    });

    test('removing a chip drops its context from the next submit', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.attachmentChips().locator('[data-status="ready"]')).toHaveCount(1);

        await omnibar.removeTabButton('Starbucks Coffee Company').click();
        await expect(omnibar.attachmentChips()).toHaveCount(0);

        await omnibar.types({ mode: 'ai', value: 'hello' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.pageContext).toBeUndefined();
    });

    test('a tab whose content fails to extract adds no chip', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        // tab-broken resolves to null pageContext in the mock transport
        await omnibar.attachTab('Tab That Fails to Extract');
        await expect(omnibar.attachmentChips()).toHaveCount(0);
    });

    test('the @-mention picker filters tabs and attaches the selected one', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@star');

        await expect(omnibar.mentionPicker()).toBeVisible();
        await expect(omnibar.mentionOption('Starbucks Coffee Company')).toBeVisible();

        await omnibar.mentionOption('Starbucks Coffee Company').click();

        // the @-token is stripped from the input and the tab is attached
        await omnibar.expectChatValue('');
        await expect(omnibar.attachmentChips().locator('[data-status="ready"]')).toHaveCount(1);
    });

    test('paperclip and @-mention are hidden when the feature is off', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            // no enableAttachTabs, and a model that supports neither images nor files
            additional: { 'omnibar.mode': 'ai', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await expect(omnibar.attachMenuButton()).toHaveCount(0);

        // typing @ does not open the picker
        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@star');
        await expect(omnibar.mentionPicker()).toHaveCount(0);
    });
});

test.describe('omnibar file attachment', () => {
    test('attaches a PDF, renders a chip, and includes it on submit', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'summarize this' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.files).toHaveLength(1);
        expect(params.files?.[0].fileName).toBe('q3-report.pdf');
        expect(params.files?.[0].mimeType).toBe('application/pdf');
        expect(params.files?.[0].data.length).toBeGreaterThan(0);
    });

    test('with the tabs feature off, the paperclip opens the file picker directly (no dropdown)', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            // file-supporting model, attach-tabs feature OFF → must behave like main: a single file route
            // collapses to a direct paperclip button instead of a one-item "Add …" dropdown.
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        // No dropdown trigger is rendered; the control is the direct file button.
        await expect(omnibar.attachMenuButton()).toHaveCount(0);
        await expect(omnibar.directFileButton()).toBeVisible();

        // Selecting a file attaches it without any menu ever opening.
        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.attachMenu()).toHaveCount(0);
    });

    test('the file picker only accepts the active model’s supported types', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        await expect(omnibar.fileInput()).toHaveAttribute('accept', /application\/pdf/);
    });

    test('removing a file chip drops it from the next submit', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);

        await omnibar.removeFileButton('q3-report.pdf').click();
        await expect(omnibar.attachmentChips()).toHaveCount(0);

        await omnibar.types({ mode: 'ai', value: 'hello' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.files).toBeUndefined();
    });

    test('switching to a model without file support clears attached files', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);

        await omnibar.modelSelectorButton().click();
        await omnibar.modelOption('GPT-4o mini').click();

        // GPT-4o mini declares no supportedFileTypes → the chip is dropped
        await expect(omnibar.attachmentChips()).toHaveCount(0);
    });
});

test.describe('omnibar attachment coexistence', () => {
    test('files and tab content are carried independently on the same submit', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: {
                'omnibar.mode': 'ai',
                'omnibar.enableAttachTabs': 'true',
                'omnibar.enableAiChatTools': 'true',
                'omnibar.selectedModelId': 'claude-haiku-4-5',
            },
        });
        await omnibar.ready();

        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.attachmentChips().locator('[data-status="ready"]')).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'compare and summarize' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.files).toHaveLength(1);
        expect(params.pageContext).toHaveLength(1);
        expect(params.pageContext?.[0].tabId).toBe('tab-2');
    });
});
