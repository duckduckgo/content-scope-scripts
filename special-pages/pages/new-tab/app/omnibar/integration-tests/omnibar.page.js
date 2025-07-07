import { expect } from '@playwright/test';

export class OmnibarPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
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
        return this.context().getByRole('textbox', { name: /Chat privately with Duck\.ai/i });
    }

    tabList() {
        return this.context().getByRole('tablist');
    }

    searchTab() {
        return this.context().getByRole('tab', { name: /Search/i });
    }

    aiTab() {
        return this.context().getByRole('tab', { name: /Duck\.ai/i });
    }

    aiChatButton() {
        return this.context().getByRole('button', { name: /Duck\.ai/i });
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
}
