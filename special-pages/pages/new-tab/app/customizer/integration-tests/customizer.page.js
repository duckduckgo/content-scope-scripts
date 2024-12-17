import { expect } from '@playwright/test';

/**
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionEventNames
 */

export class CustomizerPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
    }

    async hasDefaultBackground() {
        const { page } = this.ntp;
        await expect(page.getByTestId('BackgroundConsumer')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
    }

    async hasDefaultDarkBackground() {
        const { page } = this.ntp;
        await expect(page.getByTestId('BackgroundConsumer')).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    }
}
