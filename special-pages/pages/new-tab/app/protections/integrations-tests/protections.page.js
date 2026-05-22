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
     * @param {object} [options]
     * @param {number | null | undefined} [options.totalCookiePopUpsBlocked] - Cookie pop-up count. undefined = legacy UI (DEFAULT), null = new UI but feature disabled, number = new UI with feature enabled
     */
    async receivesUpdatedTotal(count, options = {}) {
        /** @type {ProtectionsData} */
        const data = {
            totalCount: count,
            // Default to undefined (legacy UI) to match current production behavior
            // Explicitly pass null for new UI with feature disabled
            // Explicitly pass a number for new UI with feature enabled
            totalCookiePopUpsBlocked: 'totalCookiePopUpsBlocked' in options ? options.totalCookiePopUpsBlocked : undefined,
        };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        await expect(this.context().getByRole('heading', { level: 3 })).toContainText(`${count} tracking attempts blocked`);
    }

    async hasPolishText() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading).toMatchAriaSnapshot(`
          - img "Privacy Shield"
          - heading "Raport ochrony" [level=2]
          - button "Ukryj ostatnią aktywność" [expanded] [pressed]:
            - img
          - heading /\\d+ – tyle prób śledzenia zablokowano/ [level=3]
          - paragraph: Ostatnie 7 dni
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
     * Test that the info tooltip is displayed and keyboard accessible
     */
    async hasInfoTooltip() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        // The InfoIcon should be present
        await expect(heading.locator('[class*="infoIcon"]')).toBeVisible();

        // Find the tooltip container (parent of InfoIcon)
        const tooltipTrigger = heading.locator('[class*="infoIcon"]').locator('..');

        // Verify it's keyboard focusable
        await expect(tooltipTrigger).toHaveAttribute('tabindex', '0');
        await expect(tooltipTrigger).toHaveAttribute('role', 'button');

        // Test keyboard navigation - focus the tooltip trigger
        await tooltipTrigger.focus();

        // Tooltip should appear on focus
        const tooltip = this.page.locator('[role="tooltip"]');
        await expect(tooltip).toBeVisible();

        // Verify the tooltip has content about tracking attempts
        await expect(tooltip).toContainText(/tracking attempts/i);

        // Verify aria-describedby is present when tooltip is visible
        await expect(tooltipTrigger).toHaveAttribute('aria-describedby');

        // Test keyboard interaction - press Escape to hide tooltip
        await tooltipTrigger.press('Escape');
        await expect(tooltip).not.toBeVisible();

        // Test keyboard toggle - press Enter to show tooltip again
        await tooltipTrigger.press('Enter');
        await expect(tooltip).toBeVisible();

        // Press Enter again to toggle it off
        await tooltipTrigger.press('Enter');
        await expect(tooltip).not.toBeVisible();

        // Test Space key
        await tooltipTrigger.press('Space');
        await expect(tooltip).toBeVisible();
    }

    /**
     * Triggers the scroll to protections heading via subscription message
     */
    async scrollsToProtectionsHeading() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        await expect(heading).toBeVisible();

        // Scroll away from the element first
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Trigger the scroll message
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_scroll'), {});

        // Wait for smooth scroll animation to complete
        await this.page.waitForTimeout(500);

        // Verify the heading is now in viewport
        await expect(heading).toBeInViewport();
    }
}
