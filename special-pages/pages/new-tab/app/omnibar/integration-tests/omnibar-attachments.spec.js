/* global Buffer */
import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

/**
 * Functional coverage for the omnibar attachment features (open-tab content +
 * PDF files), asserting the shape of the outgoing `omnibar_submitChat` payload
 * via the dev mock transport (`omnibar.mock-transport.js`).
 */

/** A tiny valid PDF, base64-encoded, used to drive `setInputFiles` without a fixture file. */
const PDF_BYTES = Buffer.from(
    'JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbXS9Db3VudCAwPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFI+Pgo=',
    'base64',
);

/** A 1x1 PNG, base64-encoded, used to drive image `setInputFiles` without a fixture file. */
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==', 'base64');

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

        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'compare these' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.chat).toBe('compare these');
        expect(params.pageContext).toHaveLength(1);
        expect(params.pageContext?.[0].tabId).toBe('tab-2');
        expect(params.pageContext?.[0].title).toBe('Starbucks Coffee Company');
    });

    test('an attached tab shows as checked when the picker is reopened', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.attachMenuButton().click();
        await omnibar.attachPageContentMenuItem().click();
        await expect(omnibar.tabPickerItem('Starbucks Coffee Company')).toHaveAttribute('aria-checked', 'true');
        await expect(omnibar.tabPickerItem('MacBook Neo - Apple')).toHaveAttribute('aria-checked', 'false');
    });

    test('selecting an already-attached tab in the picker detaches it', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.attachmentChips()).toHaveCount(0);
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
        await expect(omnibar.tabChip()).toHaveCount(2);

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
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.removeTabButton('Starbucks Coffee Company').click();
        await expect(omnibar.attachmentChips()).toHaveCount(0);

        await omnibar.types({ mode: 'ai', value: 'hello' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.pageContext).toBeUndefined();
    });

    test('a tab whose content fails to extract is dropped from the submit payload', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        // The chip is added on attach (content is extracted lazily on submit), but
        // tab-broken resolves to a null pageContext in the mock transport, so it's
        // dropped when the payload is built.
        await omnibar.attachTab('Tab That Fails to Extract');
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'summarize' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.pageContext).toBeUndefined();
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

        await omnibar.expectChatValue('');
        await expect(omnibar.tabChip()).toHaveCount(1);
    });

    test('the @-mention picker shows an empty state when nothing matches the query', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@zzznomatch');

        await expect(omnibar.mentionPicker()).toBeVisible();
        await expect(omnibar.mentionPicker().getByText('No matching tabs')).toBeVisible();
        await expect(omnibar.mentionPicker().getByRole('option')).toHaveCount(0);
    });

    test('the @-mention picker marks attached tabs as selected and toggles them off', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@star');
        await omnibar.mentionOption('Starbucks Coffee Company').click();
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.chatInput().pressSequentially('@');
        await expect(omnibar.mentionOption('Starbucks Coffee Company')).toHaveAttribute('aria-selected', 'true');
        await expect(omnibar.mentionOption('MacBook Neo - Apple')).toHaveAttribute('aria-selected', 'false');

        await omnibar.mentionOption('Starbucks Coffee Company').click();
        await expect(omnibar.attachmentChips()).toHaveCount(0);
    });

    test('reopening the @-mention picker highlights the first item, not the last active row', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        // Open, move the highlight off the first row, then commit — leaving a non-zero active index.
        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.chatInput().pressSequentially('@');
        const firstOptionId = await omnibar.mentionOption('MacBook Neo - Apple').getAttribute('id');
        expect(firstOptionId).toBeTruthy();
        await expect(omnibar.chatInput()).toHaveAttribute('aria-activedescendant', firstOptionId ?? '');
    });

    test('a very long tab title is cropped instead of widening either picker', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAttachTabs': 'true', 'omnibar.selectedModelId': 'openai_gpt-oss-120b' },
        });
        await omnibar.ready();

        const longTitle = /^Breckenreid Makes Thoughtful Illustrations/;

        await omnibar.attachMenuButton().click();
        await omnibar.attachPageContentMenuItem().click();
        await expect(omnibar.tabPickerItem(longTitle)).toBeVisible();
        const menuBox = await omnibar.tabPicker().boundingBox();
        expect(menuBox?.width ?? Infinity).toBeLessThanOrEqual(361);
        await page.keyboard.press('Escape');

        await omnibar.chatInput().click();
        await omnibar.chatInput().pressSequentially('@');
        await expect(omnibar.mentionOption(longTitle)).toBeVisible();
        const panelBox = await omnibar.mentionPicker().boundingBox();
        expect(panelBox?.width ?? Infinity).toBeLessThanOrEqual(361);
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

        await expect(omnibar.attachMenuButton()).toHaveCount(0);
        await expect(omnibar.directFileButton()).toBeVisible();

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

    test('files over the cap are kept but warn and block submit until removed', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({
            additional: { 'omnibar.mode': 'ai', 'omnibar.enableAiChatTools': 'true', 'omnibar.selectedModelId': 'claude-haiku-4-5' },
        });
        await omnibar.ready();

        // Five files, past the cap of three, are all kept rather than truncated.
        await omnibar
            .fileInput()
            .setInputFiles(
                ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf', 'e.pdf'].map((name) => ({ name, mimeType: 'application/pdf', buffer: PDF_BYTES })),
            );
        await expect(omnibar.fileChip()).toHaveCount(5);

        await expect(omnibar.fileLimitWarning()).toBeVisible();
        await omnibar.types({ mode: 'ai', value: 'summarize these' });
        await expect(omnibar.chatSubmitButton()).toBeDisabled();

        await omnibar.removeFileButton('e.pdf').click();
        await omnibar.removeFileButton('d.pdf').click();
        await expect(omnibar.fileChip()).toHaveCount(3);
        await expect(omnibar.fileLimitWarning()).toHaveCount(0);
        await expect(omnibar.chatSubmitButton()).toBeEnabled();
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
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'compare and summarize' });
        await omnibar.submitChat();

        const params = await omnibar.lastSubmitChatParams();
        expect(params.files).toHaveLength(1);
        expect(params.pageContext).toHaveLength(1);
        expect(params.pageContext?.[0].tabId).toBe('tab-2');
    });

    test('attached files and tabs are cleared after submit', async ({ page }, workerInfo) => {
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
        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.fileChip()).toHaveCount(1);
        await expect(omnibar.tabChip()).toHaveCount(1);

        await omnibar.types({ mode: 'ai', value: 'summarize this page and file' });
        await omnibar.submitChat();

        await omnibar.lastSubmitChatParams();
        await expect(omnibar.attachmentChips()).toHaveCount(0);
        await omnibar.expectChatValue('');
    });
});

/**
 * Attachments are stored per NTP tab (above the tab-keyed remount boundary), so they must
 * survive switching between browser tabs and be dropped when a tab closes.
 */
test.describe('omnibar attachment per-tab persistence', () => {
    /**
     * Multi-tab (`tabs`) so `didSwitchToTab` drives a real tabId change, AI mode with attach-tabs
     * on, and a model that accepts both images and PDFs so all three attachment routes are available.
     */
    const config = {
        tabs: true,
        'omnibar.mode': 'ai',
        'omnibar.enableAttachTabs': 'true',
        'omnibar.enableAiChatTools': 'true',
        'omnibar.selectedModelId': 'claude-haiku-4-5',
    };

    test('attached tabs survive a browser-tab switch and stay scoped to their tab', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: config });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await omnibar.attachTab('MacBook Neo - Apple');
        await expect(omnibar.tabChip()).toHaveCount(2);

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.attachmentChips()).toHaveCount(0);

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.tabChip()).toHaveCount(2);
    });

    test('attached files survive a browser-tab switch', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: config });
        await omnibar.ready();

        // wait for the attach entry point so the model (and thus the file route) has resolved
        await expect(omnibar.attachMenuButton()).toBeVisible();
        await omnibar.fileInput().setInputFiles({ name: 'q3-report.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
        await expect(omnibar.fileChip()).toHaveCount(1);

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.fileChip()).toHaveCount(0);

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.fileChip()).toHaveCount(1);
    });

    test('attached images survive a browser-tab switch', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: config });
        await omnibar.ready();

        // wait for the attach entry point so the model (and thus the image route) has resolved
        await expect(omnibar.attachMenuButton()).toBeVisible();
        await omnibar.fileInput().setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: TINY_PNG });
        await expect(omnibar.attachmentChips().locator('[data-attachment-kind="image"]')).toHaveCount(1);

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.attachmentChips()).toHaveCount(0);

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.attachmentChips().locator('[data-attachment-kind="image"]')).toHaveCount(1);
    });

    test('closing an NTP tab clears its persisted attachments', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = setup(page, workerInfo);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: config });
        await omnibar.ready();

        await omnibar.attachTab('Starbucks Coffee Company');
        await expect(omnibar.tabChip()).toHaveCount(1);
        await omnibar.didSwitchToTab('02', ['01', '02']);

        // Dropping 01 from the tab-id list signals it closed, pruning its stored attachments.
        await omnibar.didSwitchToTab('02', ['02']);

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.attachmentChips()).toHaveCount(0);
    });
});
