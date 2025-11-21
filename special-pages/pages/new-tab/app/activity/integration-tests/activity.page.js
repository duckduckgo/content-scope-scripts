import { activityMocks } from '../mocks/activity.mocks.js';
import { expect, test } from '@playwright/test';
import { generateSampleData } from '../mocks/activity.mock-transport.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} SubscriptionEventNames
 */

/**
 * @param {SubscriptionEventNames} n
 */
const sub = (n) => n;

export class ActivityPage {
    entries = 200;
    /**
     * Sets the number of entries and returns the current instance for chaining.
     * @param {number} count - The number of entries to set.
     */
    withEntries(count) {
        this.entries = count;
        return this;
    }
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(page, ntp) {
        this.page = page;
        this.ntp = ntp;
    }

    async receive() {
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
        return this.page.locator('[data-entry-point="protections"] [data-testid="Activity"]');
    }

    rows() {
        return this.context().getByTestId('ActivityItem');
    }

    /**
     * @param {number} count
     */
    async hasRows(count) {
        await expect(this.rows()).toHaveCount(count);
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

    async ready() {
        await this.ntp.mocks.waitForCallCount({ method: 'activity_getData', count: 1 });
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

    async collapsesList() {
        const { page } = this;
        await page.getByLabel('Hide recent activity').click();
    }
    async expandsList() {
        const { page } = this;
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
                url: 'https://fireproof.youtube.com',
            },
        });
    }
    async burnsItem() {
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

        // control: ensure we have 5 first
        await expect(this.context().getByTestId('ActivityItem')).toHaveCount(5);

        await test.step('burn 1 item in the list', async () => {
            await this.context().getByRole('button', { name: 'Clear browsing history and data for example.com' }).click();
        });

        await test.step('assert the activity_confirmBurn was sent', async () => {
            const result = await this.ntp.mocks.waitForCallCount({ method: 'activity_confirmBurn', count: 1 });
            expect(result[0].payload).toMatchObject({
                context: 'specialPages',
                featureName: 'newTabPage',
                method: 'activity_confirmBurn',
                params: {
                    url: 'https://example.com',
                },
            });
        });

        // simulate a small delay from native
        await page.waitForTimeout(50);

        // deliver both updates from native
        const nextData = activityMocks.few.activity.filter((x) => x.url !== 'https://example.com');
        await this.ntp.mocks.simulateSubscriptionMessage(sub('activity_onDataUpdate'), { activity: nextData });
        await this.ntp.mocks.simulateSubscriptionMessage(sub('activity_onBurnComplete'), {});

        // now assert only 4 items are there
        await expect(this.context().getByTestId('ActivityItem')).toHaveCount(4);
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
        await page.getByText('example.com').click({ button: 'middle' });
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

        expect(calls[3].payload.params).toStrictEqual({
            url,
            target: 'new-tab',
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

    /**
     * Simulates the subscription message with a new list of activity data.
     *
     * @param {number} count - The number of items to generate in the new list.
     */
    async acceptsNewList(count) {
        const next = generateSampleData(count);
        await this.ntp.mocks.simulateSubscriptionMessage('activity_onDataUpdate', { activity: next });
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
    }

    // @todo legacyProtections: Remove legacy test helper once all platforms
    // are ready for the new protections report
    async showsTrackersOnlyTrackerStates() {
        await expect(this.context().getByTestId('ActivityItem').nth(0)).toMatchAriaSnapshot(`
          - listitem:
            - link "example.com"
            - button "Add example.com to favorites":
              - img
            - button "Clear browsing history and data for example.com":
              - img
            - text: +1 56 tracking attempts blocked
            - list:
              - listitem:
                - link "/bathrooms/toilets"
                - text: Just now
              - listitem:
                - link "/kitchen/sinks"
                - text: 50 mins ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - paragraph: No trackers blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago
          `);

        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
          - listitem:
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

    // @todo legacyProtections: Remove legacy test helper once all platforms
    // are ready for the new protections report
    async showsAdsAndTrackersTrackerStates() {
        await expect(this.context().getByTestId('ActivityItem').nth(0)).toMatchAriaSnapshot(`
          - listitem:
            - link "example.com"
            - button "Add example.com to favorites":
              - img
            - button "Clear browsing history and data for example.com":
              - img
            - text: +1 56 ads + tracking attempts blocked
            - list:
              - listitem:
                - link "/bathrooms/toilets"
                - text: Just now
              - listitem:
                - link "/kitchen/sinks"
                - text: 50 mins ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - paragraph: No ads + tracking attempts blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
          - listitem:
            - link "app.linkedin.com"
            - button "Add app.linkedin.com to favorites":
              - img
            - button "Clear browsing history and data for app.linkedin.com":
              - img
            - paragraph: No ads + tracking attempts found
            - list:
              - listitem:
                - link "Profile Page"
                - text: 2 hrs ago
          `);
    }

    /**
     * Test that the new TrackerStatus component displays zero-tracker messages when CPM is enabled
     */
    async showsZeroTrackerMessagesWithCpm() {
        // Twitter has trackersFound: true, totalCount: 0 → should show "No trackers blocked"
        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - text: No trackers blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago
        `);

        // LinkedIn has trackersFound: false, totalCount: 0 → should show "No trackers found"
        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
          - listitem:
            - link "app.linkedin.com"
            - button "Add app.linkedin.com to favorites":
              - img
            - button "Clear browsing history and data for app.linkedin.com":
              - img
            - text: No trackers found
            - list:
              - listitem:
                - link "Profile Page"
                - text: 2 hrs ago
        `);
    }

    /**
     * Test new UI (shouldDisplayLegacyActivity = false) without CPM
     * Shows TickPill components instead of company icons
     */
    async showsTrackersOnlyTrackerStatesNewUI() {
        await expect(this.context().getByTestId('ActivityItem').nth(0)).toMatchAriaSnapshot(`
          - listitem:
            - link "example.com"
            - button "Add example.com to favorites":
              - img
            - button "Clear browsing history and data for example.com":
              - img
            - img
            - text: 56 Tracking attempts blocked
            - img
            - text: Cookie pop-up blocked
            - list:
              - listitem:
                - link "/bathrooms/toilets"
                - text: Just now
              - listitem:
                - link "/kitchen/sinks"
                - text: 50 mins ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - text: No trackers blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago
          `);

        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
          - listitem:
            - link "app.linkedin.com"
            - button "Add app.linkedin.com to favorites":
              - img
            - button "Clear browsing history and data for app.linkedin.com":
              - img
            - text: No trackers found
            - list:
              - listitem:
                - link "Profile Page"
                - text: 2 hrs ago
          `);
    }

    /**
     * Test new UI (shouldDisplayLegacyActivity = false) with ad blocking enabled
     * Note: The new UI doesn't show "ads +" in the text, just "Tracking attempts blocked"
     */
    async showsAdsAndTrackersTrackerStatesNewUI() {
        // With ad blocking, the new UI still shows "Tracking attempts blocked" (not "ads + tracking")
        await expect(this.context().getByTestId('ActivityItem').nth(0)).toMatchAriaSnapshot(`
          - listitem:
            - link "example.com"
            - button "Add example.com to favorites":
              - img
            - button "Clear browsing history and data for example.com":
              - img
            - img
            - text: 56 Tracking attempts blocked
            - img
            - text: Cookie pop-up blocked
            - list:
              - listitem:
                - link "/bathrooms/toilets"
                - text: Just now
              - listitem:
                - link "/kitchen/sinks"
                - text: 50 mins ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(3)).toMatchAriaSnapshot(`
          - listitem:
            - link "twitter.com"
            - button "Add twitter.com to favorites":
              - img
            - button "Clear browsing history and data for twitter.com":
              - img
            - text: No trackers blocked
            - list:
              - listitem:
                - link "Trending Topics"
                - text: 2 days ago
        `);

        await expect(this.context().getByTestId('ActivityItem').nth(4)).toMatchAriaSnapshot(`
          - listitem:
            - link "app.linkedin.com"
            - button "Add app.linkedin.com to favorites":
              - img
            - button "Clear browsing history and data for app.linkedin.com":
              - img
            - text: No trackers found
            - list:
              - listitem:
                - link "Profile Page"
                - text: 2 hrs ago
          `);
    }

    async hasEmptyTrackersOnlyTitle() {
        const { page } = this;
        await expect(page.getByTestId('ActivityHeading')).toMatchAriaSnapshot(`
            - img "Privacy Shield"
            - heading "No recent browsing activity" [level=2]
            - paragraph: Recently visited sites will appear here. Keep browsing to see how many trackers we block.
        `);
    }

    async hasEmptyAdsAndTrackersTitle() {
        const { page } = this;
        await expect(page.getByTestId('ActivityHeading')).toMatchAriaSnapshot(`
            - img "Privacy Shield"
            - heading "No recent browsing activity" [level=2]
            - paragraph: Recently visited sites will appear here. Keep browsing to see how many ads and trackers we block.
        `);
    }

    async hasPopulatedTrackersOnlyTitle() {
        const { page } = this;
        await expect(page.getByTestId('ActivityHeading')).toMatchAriaSnapshot(`
            - img "Privacy Shield"
            - heading "0 tracking attempts blocked" [level=2]
            - button "Hide recent activity" [expanded] [pressed]:
              - img
            - paragraph: Past 7 days
        `);
    }

    async hasPopulatedAdsAndTrackersTitle() {
        const { page } = this;
        await expect(page.getByTestId('ActivityHeading')).toMatchAriaSnapshot(`
            - img "Privacy Shield"
            - heading "0 advertising & tracking attempts blocked" [level=2]
            - button "Hide recent activity" [expanded] [pressed]:
              - img
            - paragraph: Past 7 days
        `);
    }

    async hasTrackingInfoWithoutButtons() {
        const { page } = this;
        await expect(page.getByTestId('ActivityHeading')).toMatchAriaSnapshot(`
          - img "Privacy Shield"
          - heading "56 tracking attempts blocked" [level=2]
          - paragraph: Past 7 days
      `);
    }

    /**
     * Test that cookie popup blocked indicator is shown for items with cookiePopUpBlocked: true
     */
    async showsCookiePopupBlockedIndicator() {
        // First item in 'few' mock has cookiePopUpBlocked: true
        const firstItem = this.context().getByTestId('ActivityItem').nth(0);
        await expect(firstItem.getByText(/cookie pop-up/i)).toBeVisible();
    }

    /**
     * Test that cookie popup blocked indicator is NOT shown for items with cookiePopUpBlocked: false
     */
    async hidesCookiePopupIndicatorWhenNotBlocked() {
        // Second item in 'few' mock (youtube) has cookiePopUpBlocked: false
        const secondItem = this.context().getByTestId('ActivityItem').nth(1);
        await expect(secondItem.getByText(/cookie pop-up/i)).not.toBeVisible();
    }
}
