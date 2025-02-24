import { privacyStatsMocks } from '../mocks/privacy-stats.mocks.js';
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
        const next = { totalCount: 0, trackerCompanies: privacyStatsMocks.many.trackerCompanies.slice(0, count) };
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
        await this.context().getByTestId('ListFooter').getByRole('button', { name: 'Show More' }).click();
    }

    async showLessSecondary() {
        await this.context().getByTestId('ListFooter').getByRole('button', { name: 'Show Less' }).click();
    }

    /**
     *
     */
    showMoreBtn() {
        return this.context().getByTestId('ListFooter').getByRole('button', { name: 'Show More' });
    }

    /**
     *
     */
    async togglesOnlyTopSites() {
        const rows = this.rows();

        // open the NTP with the correct param
        await this.ntp.openPage({ additional: { stats: 'manyOnlyTop' } });

        // control, ensure we have 5 rows
        expect(await rows.count()).toBe(5);

        // check the initial values
        expect(await rows.nth(0).textContent()).toBe('Facebook310');
        expect(await rows.nth(1).textContent()).toBe('Google279');
        expect(await rows.nth(2).textContent()).toBe('Amazon67');
        expect(await rows.nth(3).textContent()).toBe('Google Ads2');
        expect(await rows.nth(4).textContent()).toBe('Twitter2');

        // show more on the secondary button
        await this.showMoreSecondary();

        // Now we should have 1 additional row
        await expect(rows).toHaveCount(6);
        expect(await rows.nth(5).textContent()).toBe('Yandex2');
    }

    /**
     * 'stats=fewOnlyTop' means we don't have enough items for the expander
     * and the only items we have are all top 100 sites
     */
    async showsOnlyTopSitesWithoutToggle() {
        const rows = this.rows();

        // open the NTP with the correct param
        await this.ntp.openPage({ additional: { stats: 'fewOnlyTop' } });

        // control, ensure we have 5 rows
        expect(await rows.count()).toBe(3);

        // check the initial values
        expect(await rows.nth(0).textContent()).toBe('Facebook310');
        expect(await rows.nth(1).textContent()).toBe('Google279');
        expect(await rows.nth(2).textContent()).toBe('Amazon67');

        // ensure the toggle is absent
        await expect(this.showMoreBtn()).not.toBeVisible();
    }

    /**
     * 'stats=topAndOneOther' means we have the exact amount of items allowed (eg: 5)
     * but we also have some in the `other` category
     */
    async showsTopSitesAndOtherText() {
        const rows = this.rows();

        // open the NTP with the correct param
        await this.ntp.openPage({ additional: { stats: 'topAndOneOther' } });

        // should show all 5 items
        expect(await rows.count()).toBe(5);

        // And should also show the text, but no expander
        // ensure the toggle is absent
        await expect(this.showMoreBtn()).not.toBeVisible();
        await expect(this.page.getByTestId('ListFooter')).toContainText('2 attempts from other networks');
    }

    /**
     * `stats=manyTopAndOther` means we have enough items to show the expander
     * and we also have additional items to show in the 'other' category
     */
    async showsTopSitesWithToggleAndOtherText() {
        const rows = this.rows();

        // open the NTP with the correct param
        await this.ntp.openPage({ additional: { stats: 'manyTopAndOther' } });

        // control, ensure we have 5 rows
        expect(await rows.count()).toBe(5);

        // control: ensure 'other' text is absent here
        await expect(this.page.getByTestId('ListFooter')).not.toContainText('2 attempts from other networks');

        // show more on the secondary button
        await this.showMoreSecondary();

        // Now we should have 1 additional row
        await expect(rows).toHaveCount(6);

        // AND we should now show the additional 'other' test
        await expect(this.page.getByTestId('ListFooter')).toContainText('2 attempts from other networks');

        // when the list is collapsed again...
        await this.showLessSecondary();

        // then the text is removed
        await expect(this.page.getByTestId('ListFooter')).not.toContainText('2 attempts from other networks');
    }

    listFooter() {
        return this.context().getByTestId('ListFooter');
    }
}
