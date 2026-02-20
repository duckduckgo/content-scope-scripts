import { expect, test } from '@playwright/test';

/**
 * @typedef {import("../../../types/new-tab.js").OmnibarMode} Mode
 * @typedef {import("../../../types/new-tab.js").OmnibarConfig} Config
 */

export class OmnibarPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
        this.page.on('console', (msg) => console.log(msg.text()));
    }

    context() {
        return this.page.locator('[data-entry-point="omnibar"]');
    }

    async ready() {
        await this.ntp.mocks.waitForCallCount({ method: 'omnibar_getConfig', count: 1 });
    }

    searchInput() {
        return this.context().getByRole('combobox');
    }

    chatInput() {
        return this.context().getByRole('textbox', { name: 'Ask privately' });
    }

    chatSubmitButton() {
        return this.context().getByRole('button', { name: 'Send' });
    }

    tabList() {
        return this.context().getByRole('tablist');
    }

    searchTab() {
        return this.context().getByRole('tab', { name: 'Search' });
    }

    aiTab() {
        return this.context().getByRole('tab', { name: 'Duck.ai' });
    }

    suggestionsList() {
        return this.context().getByRole('listbox');
    }

    suggestions() {
        return this.suggestionsList().getByRole('option');
    }

    aiChatsList() {
        return this.context().getByRole('listbox', { name: 'Recent AI Chats' });
    }

    aiChats() {
        return this.aiChatsList().getByRole('option');
    }

    selectedSuggestion() {
        return this.suggestionsList().getByRole('option', { selected: true });
    }

    customizeButton() {
        return this.page.getByTestId('customizer-button');
    }

    toggleSearchButton() {
        return this.page.getByRole('switch', { name: 'Toggle Search' });
    }

    toggleDuckAiButton() {
        return this.page.getByRole('switch', { name: 'Toggle Duck.ai' });
    }

    closeButton() {
        return this.context().getByRole('button', { name: 'Close' });
    }

    popover() {
        return this.context().getByRole('dialog');
    }

    popoverCloseButton() {
        return this.popover().getByRole('button', { name: 'Close' });
    }

    popoverCustomizeButton() {
        return this.popover().getByRole('button', { name: 'Customize' });
    }

    root() {
        return this.context().locator('[data-mode]');
    }

    /**
     * @param {number} count
     */
    async expectSuggestionsCount(count) {
        await expect(this.suggestions()).toHaveCount(count);
    }

    /**
     * @param {string} text
     */
    async expectSelectedSuggestion(text) {
        await expect(this.selectedSuggestion()).toHaveText(text);
    }

    async expectNoSelection() {
        await expect(this.selectedSuggestion()).toHaveCount(0);
    }

    async waitForSuggestions() {
        await expect(this.suggestions().first()).toBeVisible();
    }

    /**
     * @param {string} value
     */
    async expectInputValue(value) {
        await expect(this.searchInput()).toHaveValue(value);
    }

    /**
     * @param {string} value
     */
    async expectChatValue(value) {
        await expect(this.chatInput()).toHaveValue(value);
    }

    /**
     * @param {number} startIndex
     * @param {number} endIndex
     */
    async expectInputSelection(startIndex, endIndex) {
        const input = this.searchInput();
        const selectionStart = await input.evaluate((/** @type {HTMLInputElement} */ el) => el.selectionStart);
        const selectionEnd = await input.evaluate((/** @type {HTMLInputElement} */ el) => el.selectionEnd);
        expect(selectionStart).toBe(startIndex);
        expect(selectionEnd).toBe(endIndex);
    }

    /**
     * @param {string} selectedText
     */
    async expectInputSelectionText(selectedText) {
        const input = this.searchInput();
        const selection = await input.evaluate((/** @type {HTMLInputElement} */ el) =>
            el.value.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0),
        );
        expect(selection).toBe(selectedText);
    }

    /**
     * @param {'search' | 'ai'} mode
     */
    async expectMode(mode) {
        if (mode === 'search') {
            await expect(this.searchTab()).toHaveAttribute('aria-selected', 'true');
        } else {
            await expect(this.aiTab()).toHaveAttribute('aria-selected', 'true');
        }
    }

    /**
     * @param {'search' | 'ai'} mode
     */
    async expectDataMode(mode) {
        await expect(this.root()).toHaveAttribute('data-mode', mode);
    }

    /**
     * @param {string} method
     * @param {number} count
     */
    async expectMethodCallCount(method, count) {
        await this.ntp.mocks.waitForCallCount({ method, count });
    }

    /**
     * @param {string} method
     * @param {object} expectedParams
     */
    async expectMethodCalledWith(method, expectedParams) {
        const calls = await this.ntp.mocks.waitForCallCount({ method, count: 1 });
        expect(calls[0].payload.params).toEqual(expectedParams);
    }

    /**
     * @param {string} method
     */
    async expectMethodNotCalled(method) {
        const calls = await this.ntp.mocks.outgoing({ names: [method] });
        expect(calls).toHaveLength(0);
    }

    /**
     * @param {string} tabId
     * @param {string[]} tabIds
     * @returns {Promise<void>}
     */
    async didSwitchToTab(tabId, tabIds) {
        await test.step(`simulate tab change event, to: ${tabId} `, async () => {
            const event = sub('tabs_onDataUpdate').payload({ tabId, tabIds });
            await this.ntp.mocks.simulateSubscriptionEvent(event);
        });
    }

    /**
     * @param {Config} config
     * @returns {Promise<void>}
     */
    async didReceiveConfig(config) {
        const event = sub('omnibar_onConfigUpdate').payload(config);
        await test.step(`simulates global disabled (eg: settings): ${JSON.stringify(event.name)} ${JSON.stringify(event.payload)} `, async () => {
            await this.ntp.mocks.simulateSubscriptionEvent(event);
        });
    }

    /**
     * @param {object} props
     * @param {Mode} props.mode
     * @returns {Promise<void>}
     */
    switchMode({ mode }) {
        switch (mode) {
            case 'ai': {
                return this.aiTab().click();
            }
            case 'search': {
                return this.searchTab().click();
            }
        }
    }

    /**
     * @param {object} props
     * @param {Mode} props.mode
     * @param {string} props.value
     */
    async expectValue({ mode, value }) {
        switch (mode) {
            case 'ai': {
                return await expect(this.chatInput()).toHaveValue(value);
            }
            case 'search': {
                return await expect(this.searchInput()).toHaveValue(value);
            }
        }
    }

    /**
     * @param {object} props
     * @param {Mode} props.mode
     * @param {string} props.value
     * @returns {Promise<void>}
     */
    types({ mode, value }) {
        switch (mode) {
            case 'ai': {
                return this.chatInput().fill(value);
            }
            case 'search': {
                return this.searchInput().fill(value);
            }
        }
    }

    async clearsInput() {
        await this.searchInput().hover();
        await this.closeButton().click();
    }
}

/**
 * @template {import("../../../types/new-tab.js").NewTabMessages["subscriptions"]["subscriptionEvent"]} SubName
 * @param {SubName} name
 * @return {{payload: (payload: Extract<import("../../../types/new-tab.js").NewTabMessages["subscriptions"], {subscriptionEvent: SubName}>['params']) => {name: string, payload: any}}}
 */
function sub(name) {
    return {
        payload: (payload) => {
            return { name, payload };
        },
    };
}
