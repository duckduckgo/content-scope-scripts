import { activityMocks } from '../mocks/activity.mocks.js';
import { expect } from '@playwright/test';

export class ActivityPage {
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
        /** @type {import("../../../types/new-tab.js").ActivityData} */
        const next = activityMocks.few;
        await this.ntp.mocks.simulateSubscriptionMessage('stats_onDataUpdate', next);
    }

    /**
     * @param {import("../../../types/new-tab.js").ActivityData} data
     */
    async receiveData(data) {
        await this.ntp.mocks.simulateSubscriptionMessage('stats_onDataUpdate', data);
    }

    context() {
        return this.page.locator('[data-entry-point="activity"]');
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

    async didRender() {
        await this.context().waitFor();
    }

    async cannotExpandListWhenEmpty() {
        const { page } = this;

        // control: ensure it can be collapsed first
        await page.getByLabel('Hide recent activity').waitFor();

        // now deliver new data
        await this.ntp.mocks.simulateSubscriptionMessage('activity_onDataUpdate', { activity: [] });

        // and assert the collapse button is now absent
        await expect(page.getByLabel('Hide recent activity')).not.toBeVisible();
    }

    async canCollapseList() {
        const { page } = this;
        await page.getByLabel('Hide recent activity').click();
        await page.getByLabel('Show recent activity').click();
    }

    async addsFavorite() {
        await this.context().getByRole('button', { name: 'Add example.com to favorites' }).click();
        const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_addFavorite', count: 1 });
        expect(result[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_addFavorite',
            params: {
                url: 'https://example.com',
            },
        });
    }
    async removesFavorite() {
        await this.context().getByRole('button', { name: 'Remove youtube.com from favorites' }).click();
        const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_removeFavorite', count: 1 });
        expect(result[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_removeFavorite',
            params: {
                url: 'https://www.youtube.com',
            },
        });
    }
    async burnsItem() {
        // const { page } = this;
        // await page.pause();
        await this.context().getByRole('button', { name: 'Clear browsing history and data for example.com' }).click();
        const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_burn', count: 1 });
        expect(result[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_burn',
            params: {
                url: 'https://example.com',
            },
        });
    }

    async removesItem() {
        await this.context().getByRole('button', { name: 'Remove example.com from history' }).click();
        const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_removeItem', count: 1 });
        expect(result[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_removeItem',
            params: {
                url: 'https://example.com',
            },
        });
    }
    async opensLinkFromTitle() {
        const { page } = this;
        await page.getByText('example.com').click();
        await page.getByText('example.com').click({ modifiers: ['Meta'] });
        await page.getByText('example.com').click({ modifiers: ['Shift'] });
        await this._opensMainLink();
    }
    async opensLinkFromFavicon() {
        const { page } = this;
        await page.getByTitle('example.com', { exact: true }).click();
        await page.getByTitle('example.com', { exact: true }).click({ modifiers: ['Meta'] });
        await page.getByTitle('example.com', { exact: true }).click({ modifiers: ['Shift'] });
        await this._opensMainLink();
    }
    async _opensMainLink() {
        const calls = await this.ntp.mocks.waitForCallCount({ method: 'activity_open', count: 3 });
        const url = 'https://example.com';

        expect(calls[0].payload.params).toStrictEqual({
            url,
            target: 'same-tab',
        });

        expect(calls[1].payload.params).toStrictEqual({
            url,
            target: 'new-tab',
        });

        expect(calls[2].payload.params).toStrictEqual({
            url,
            target: 'new-window',
        });
    }

    async opensLinkFromHistory() {
        const { page } = this;
        await page.getByRole('link', { name: '/kitchen/sinks' }).click();
        await page.getByRole('link', { name: '/kitchen/sinks' }).click({ modifiers: ['Meta'] });
        await page.getByRole('link', { name: '/kitchen/sinks' }).click({ modifiers: ['Shift'] });
        const calls = await this.ntp.mocks.waitForCallCount({ method: 'activity_open', count: 3 });
        expect(calls[0].payload.params).toStrictEqual({
            url: 'https://example.com/kitchen/sinks',
            target: 'same-tab',
        });
        expect(calls[1].payload.params).toStrictEqual({
            url: 'https://example.com/kitchen/sinks',
            target: 'new-tab',
        });
        expect(calls[2].payload.params).toStrictEqual({
            url: 'https://example.com/kitchen/sinks',
            target: 'new-window',
        });
    }

    async acceptsUpdatedFavorite() {
        const { page } = this;
        const initial = structuredClone(activityMocks.few);
        initial.activity[0].favorite = true;

        // control: ensure the first item is not already favorited
        await page.getByRole('button', { name: 'Add example.com to favorites' }).waitFor();

        await this.ntp.mocks.simulateSubscriptionMessage('activity_onDataUpdate', initial);

        // assertion: make sure it can be removed
        await page.getByRole('button', { name: 'Remove example.com from favorites' }).waitFor();
    }

    async acceptsUpdatedHistoryPaths() {
        // control: should only be 2 hidden (4 total)
        await this.context().getByLabel('Show 2 more').click();
        const initial = structuredClone(activityMocks.few);

        /** @type {import('../../../types/new-tab.js').HistoryEntry[]} */
        const newItems = [
            { url: 'https://example.com/a', relativeTime: 'Just now', title: '/a' },
            { url: 'https://example.com/b', relativeTime: 'Just now', title: '/b' },
            { url: 'https://example.com/c', relativeTime: 'Just now', title: '/c' },
            { url: 'https://example.com/d', relativeTime: 'Just now', title: '/d' },
            { url: 'https://example.com/e', relativeTime: 'Just now', title: '/e' },
            { url: 'https://example.com/f', relativeTime: 'Just now', title: '/f' },
            { url: 'https://example.com/g', relativeTime: 'Just now', title: '/g' },
        ];

        initial.activity[0].history.push(...newItems);

        // now we simulate sending 6 additional items, making 10 in total
        await this.ntp.mocks.simulateSubscriptionMessage('activity_onDataUpdate', { activity: [initial.activity[0]] });

        // ensure we can re-hide the items
        await this.context().getByLabel('Hide additional').click();

        // if the update was accepted, there should be 2 showing + 8 more to show (from the 10 above)
        await this.context().getByLabel('Show 8 more').click();
    }
    async listsAtMost3TrackerCompanies() {
        const { page } = this;
        await page.pause();
        // const first = this.context().getByTestId('TrackerStatus').nth(0);
        // const second = this.context().getByTestId('TrackerStatus').nth(1);
        // await expect(second).toMatchAriaSnapshot(`
        //     - img "google icon"
        //     - img "facebook icon"
        //     - text: +2 89 tracking attempts blocked
        //     - list:
        //       - listitem:
        //         - link "Electronics Store"
        //         - text: 1 day ago
        // `);
    }

    async showsEmptyTrackerState() {
        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "t w"
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - paragraph: No trackers blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago`);

        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
            - listitem:
              - link "l i"
              - link "app.linkedin.com"
              - button "Add app.linkedin.com to favorites":
                - img
              - button "Clear browsing history and data for app.linkedin.com":
                - img
              - paragraph: No trackers found
              - list:
                - listitem:
                  - link "Profile Page"
                  - text: 2 hrs ago
        `);
    }

    async burnsFireproofItem() {
        const { page } = this;

        /** @type {import('../../../types/new-tab.js').ConfirmBurnResponse} */
        const response = {
            action: 'burn',
        };

        await page.evaluate((response) => {
            window.__playwright_01.mockResponses = {
                ...window.__playwright_01.mockResponses,
                activity_confirmBurn: /** @type {any} */ (response),
            };
        }, response);

        // trigger the burn (on an item marked as fireproof)
        await this.context().getByRole('button', { name: 'Clear browsing history and data for youtube.com' }).click();

        // trigger the burn (on an item marked as fireproof)
        const confirm = await this.ntp.mocks.waitForCallCount({ method: 'activity_confirmBurn', count: 1 });
        const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_burn', count: 1 });

        expect(confirm[0].payload).toMatchObject({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_confirmBurn',
            params: { url: 'https://www.youtube.com' },
        });

        expect(result[0].payload).toMatchObject({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'activity_burn',
            params: { url: 'https://www.youtube.com' },
        });
    }
}
