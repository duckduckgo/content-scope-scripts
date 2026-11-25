import { expect, test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

const FAST = { id: /** @type {const} */ ('none'), name: 'Fast', isAvailable: true };
const REASONING = { id: /** @type {const} */ ('low'), name: 'Reasoning', isAvailable: true };

/** Full config because pushes replace rather than merge. */
const PER_TAB_CONFIG = {
    mode: /** @type {const} */ ('ai'),
    enableAi: true,
    enableAiChatTools: true,
    enablePerTabModelPick: true,
    selectedModelId: 'claude-haiku-4-5',
    aiModelSections: [
        {
            items: [
                { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', shortName: 'Haiku 4.5', isAvailable: true, supportsImageUpload: true },
                { id: 'openai_gpt-oss-120b', name: 'GPT-OSS 120B', shortName: 'GPT-OSS', isAvailable: true, supportsImageUpload: false },
                {
                    id: 'gpt-5-mini',
                    name: 'GPT-5 mini',
                    shortName: 'GPT-5',
                    isAvailable: true,
                    supportsImageUpload: true,
                    supportedTools: /** @type {('WebSearch' | 'GenerateImage')[]} */ (['GenerateImage']),
                    reasoningEfforts: [FAST, REASONING],
                },
            ],
        },
    ],
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} workerInfo
 * @param {Record<string, string>} [additional]
 */
async function openPerTabOmnibar(page, workerInfo, additional = {}) {
    const ntp = NewtabPage.create(page, workerInfo);
    const omnibar = new OmnibarPage(ntp);
    await ntp.reducedMotion();
    await ntp.openPage({
        additional: {
            tabs: true,
            omnibar: true,
            'omnibar.mode': 'ai',
            'omnibar.enableAiChatTools': 'true',
            'omnibar.enablePerTabModelPick': 'true',
            'omnibar.selectedModelId': 'claude-haiku-4-5',
            ...additional,
        },
    });
    await omnibar.ready();
    await omnibar.didSwitchToTab('01', ['01', '02']);
    return { ntp, omnibar };
}

/**
 * @param {OmnibarPage} omnibar
 * @param {string} name
 */
async function pickModel(omnibar, name) {
    await omnibar.modelSelectorButton().click();
    await omnibar.modelOption(name).click();
}

test.describe('omnibar per-tab model pick', () => {
    test('keeps a pick on its tab while other tabs show the default', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = await openPerTabOmnibar(page, workerInfo);

        await pickModel(omnibar, 'GPT-OSS');
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-OSS');

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.modelSelectorButton()).toContainText('Haiku 4.5');

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-OSS');

        await omnibar.expectMethodCalledWith('omnibar_selectModel', {
            modelId: 'openai_gpt-oss-120b',
            previousModelId: 'claude-haiku-4-5',
        });
        await omnibar.expectMethodNotCalled('omnibar_setConfig');
        const submits = await ntp.mocks.outgoing({ names: ['omnibar_submitChat'] });
        expect(submits).toHaveLength(0);
    });

    test('a new default reaches tabs without a pick', async ({ page }, workerInfo) => {
        const { omnibar } = await openPerTabOmnibar(page, workerInfo);
        await omnibar.didReceiveConfig(PER_TAB_CONFIG);

        await pickModel(omnibar, 'GPT-OSS');
        await omnibar.didReceiveConfig({ ...PER_TAB_CONFIG, selectedModelId: 'gpt-5-mini' });
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-OSS');

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-5');
    });

    test('sends the pick with the prompt, then starts the tab on the default again', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = await openPerTabOmnibar(page, workerInfo);

        await pickModel(omnibar, 'GPT-OSS');
        await omnibar.chatInput().fill('hello');
        await omnibar.chatInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', {
            chat: 'hello',
            target: 'same-tab',
            modelId: 'openai_gpt-oss-120b',
        });
        await expect(omnibar.modelSelectorButton()).toContainText('Haiku 4.5');

        await omnibar.chatInput().fill('again');
        await omnibar.chatInput().press('Enter');
        const submits = await ntp.mocks.waitForCallCount({ method: 'omnibar_submitChat', count: 2 });
        expect(submits[1].payload.params).toMatchObject({ chat: 'again', modelId: 'claude-haiku-4-5' });
    });

    test('keeps a reasoning effort pick on its tab', async ({ page }, workerInfo) => {
        const { omnibar } = await openPerTabOmnibar(page, workerInfo, { 'omnibar.selectedModelId': 'gpt-5-mini' });

        await expect(omnibar.reasoningPickerButton()).toContainText('Fast');
        await omnibar.reasoningPickerButton().click();
        await omnibar.reasoningOption('Reasoning').click();
        await expect(omnibar.reasoningPickerButton()).toContainText('Reasoning');
        await omnibar.expectMethodCalledWith('omnibar_selectReasoningEffort', { reasoningEffort: 'low' });

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.reasoningPickerButton()).toContainText('Fast');

        await omnibar.didSwitchToTab('01', ['01', '02']);
        await expect(omnibar.reasoningPickerButton()).toContainText('Reasoning');
        await omnibar.expectMethodNotCalled('omnibar_setConfig');
    });

    test('a usage-limits model switch applies to its tab only', async ({ page }, workerInfo) => {
        const { omnibar } = await openPerTabOmnibar(page, workerInfo, { 'omnibar.usageLimits': 'reached-switch' });

        await omnibar.chatInput().evaluate((el) => el.focus());
        await omnibar.usageLimitsCtaMenuButton().click();
        await omnibar.noticeDrawer().getByRole('button', { name: 'Switch to free model' }).click();
        await omnibar.expectMethodCalledWith('omnibar_selectUsageLimitsCta', { modelId: 'gpt-4o-mini' });
        await expect(omnibar.modelSelectorButton()).toContainText('4o-mini');
        await omnibar.expectMethodNotCalled('omnibar_selectModel');

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.modelSelectorButton()).toContainText('Haiku 4.5');
    });

    test('Create Image switches only the tab model and tells native the model it left', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = await openPerTabOmnibar(page, workerInfo, {
            'omnibar.enableImageGeneration': 'true',
            'omnibar.enableUpdatedCreateImage': 'true',
            'omnibar.imageGenerationModelId': 'gpt-5-mini',
        });

        await omnibar.toolsMenuButton().click();
        await omnibar.createImageMenuItem().click();
        await omnibar.expectMethodCalledWith('omnibar_setImageGenerationActive', { active: true, modelId: 'claude-haiku-4-5' });
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-5');

        await omnibar.imageGenerationInput().fill('a neon duck');
        await omnibar.imageGenerationInput().press('Enter');
        await omnibar.expectMethodCalledWith('omnibar_submitChat', {
            chat: 'a neon duck',
            target: 'same-tab',
            modelId: 'gpt-5-mini',
            toolChoice: ['GenerateImage'],
        });
        await expect(omnibar.modelSelectorButton()).toContainText('Haiku 4.5');
        const configWrites = await ntp.mocks.outgoing({ names: ['omnibar_setConfig'] });
        expect(configWrites).toHaveLength(0);
    });

    test('without the native capability, a pick is shared through setConfig as before', async ({ page }, workerInfo) => {
        const { ntp, omnibar } = await openPerTabOmnibar(page, workerInfo, { 'omnibar.enablePerTabModelPick': 'false' });

        await pickModel(omnibar, 'GPT-OSS');
        const writes = await ntp.mocks.waitForCallCount({ method: 'omnibar_setConfig', count: 1 });
        expect(writes[0].payload.params).toMatchObject({ selectedModelId: 'openai_gpt-oss-120b' });

        await omnibar.didSwitchToTab('02', ['01', '02']);
        await expect(omnibar.modelSelectorButton()).toContainText('GPT-OSS');
        await omnibar.expectMethodNotCalled('omnibar_selectModel');
    });
});
