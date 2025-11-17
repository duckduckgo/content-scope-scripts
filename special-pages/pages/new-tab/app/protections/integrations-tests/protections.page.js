import { expect } from '@playwright/test';

/**
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionEventNames
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['notifications']['method']} NotificationNames
 * @typedef {import('../../../types/new-tab.js').ProtectionsData} ProtectionsData
 */

const named = {
    /** @type {(n: NotificationNames) => NotificationNames} */
    notification: (n) => n,
    /** @type {(n: SubscriptionEventNames) => SubscriptionEventNames} */
    subscription: (n) => n,
};

export class ProtectionsPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
    }

    context() {
        return this.page.locator('[data-entry-point="protections"]');
    }

    async ready() {
        await Promise.all([
            this.ntp.mocks.waitForCallCount({ method: 'protections_getConfig', count: 1 }),
            this.ntp.mocks.waitForCallCount({ method: 'protections_getData', count: 1 }),
        ]);
    }

    /**
     * @param {number} count
     */
    async receivesUpdatedTotal(count) {
        /** @type {ProtectionsData} */
        const data = {
            totalCount: count,
            totalCookiePopUpsBlocked: null, // null means CPM is not enabled
        };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        await expect(this.context().getByRole('heading', { level: 3 })).toContainText(`${count} Tracking attempts blocked`);
    }

    async hasPolishText() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading).toMatchAriaSnapshot(`
          - img "Privacy Shield"
          - heading "Raport ochrony" [level=2]
          - img
          - button "Ukryj ostatnią aktywność" [expanded] [pressed]:
            - img
          - heading /\\d+ {count} – tyle prób śledzenia zablokowano/ [level=3]
          - heading /\\d+ Cookie pop-ups blocked/ [level=3]
          - img
          `);
    }

    /**
     * Test that cookie popup blocking stats are displayed when both trackers and cookie popups are > 0
     */
    async displaysCookiePopupStats() {
        /** @type {ProtectionsData} */
        const data = {
            totalCount: 100,
            totalCookiePopUpsBlocked: 25,
        };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        await expect(this.context().getByRole('heading', { level: 3 }).first()).toContainText('100 Tracking attempts blocked');
        // Cookie popup stats should be visible in the ProtectionsHeading
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading.getByText(/cookie pop-up/i)).toBeVisible();
    }

    /**
     * Test that cookie popup stats are NOT displayed when totalCookiePopUpsBlocked is null (CPM disabled)
     */
    async hidesCookiePopupStatsWhenDisabled() {
        /** @type {ProtectionsData} */
        const data = {
            totalCount: 100,
            totalCookiePopUpsBlocked: null,
        };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        // Cookie popup stats should not be visible in the ProtectionsHeading
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading.getByText(/cookie pop-up/i)).not.toBeVisible();
    }

    /**
     * Test that cookie popup stats are NOT displayed when totalCookiePopUpsBlocked is 0
     */
    async hidesCookiePopupStatsWhenZero() {
        /** @type {ProtectionsData} */
        const data = {
            totalCount: 100,
            totalCookiePopUpsBlocked: 0,
        };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        // Cookie popup stats should not be visible when count is 0 in the ProtectionsHeading
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading.getByText(/cookie pop-up/i)).not.toBeVisible();
    }

    /**
     * Test that the info tooltip is displayed
     */
    async hasInfoTooltip() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        // The InfoIcon should be present
        await expect(heading.locator('[class*="infoIcon"]')).toBeVisible();
    }
}
