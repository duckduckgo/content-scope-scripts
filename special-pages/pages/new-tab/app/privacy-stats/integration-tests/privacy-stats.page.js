import { stats } from '../mocks/stats.js';
import { expect } from '@playwright/test';

export class PrivacyStatsPage {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(page, ntp) {
        this.page = page;
        this.ntp = ntp;
    }

    /**
     * @param {object} params
     * @param {number} params.count
     */
    async receive({ count }) {
        /** @type {import("../../../types/new-tab.js").PrivacyStatsData} */
        const next = { totalCount: 0, trackerCompanies: stats.many.trackerCompanies.slice(0, count) };
        await this.ntp.mocks.simulateSubscriptionMessage('stats_onDataUpdate', next);
    }

    /**
     * @param {import("../../../types/new-tab.js").PrivacyStatsData} data
     */
    async receiveData(data) {
        await this.ntp.mocks.simulateSubscriptionMessage('stats_onDataUpdate', data);
    }

    context() {
        return this.page.locator('[data-entry-point="privacyStats"]');
    }

    rows() {
        return this.context().getByTestId('CompanyList').locator('li');
    }

    /**
     * @param {number} count
     */
    async hasRows(count) {
        const rows = this.rows();
        expect(await rows.count()).toBe(count);
    }

    /**
     * @param {string} heading
     */
    async hasHeading(heading) {
        await expect(this.context().getByRole('heading')).toContainText(heading);
    }

    async showMoreSecondary() {
        await this.context().getByLabel('Show More', { exact: true }).click();
    }

    async showLessSecondary() {
        await this.context().getByLabel('Show Less', { exact: true }).click();
    }
}
