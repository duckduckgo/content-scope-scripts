import { expect } from '@playwright/test';
import { privacyStatsMocks } from '../../privacy-stats/mocks/privacy-stats.mocks.js';

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
     * @return {Promise<Record<string, unknown> | undefined>}
     */
    async lastSetConfig() {
        const calls = await this.ntp.mocks.outgoing({ names: ['protections_setConfig'] });
        return /** @type {any} */ (calls[calls.length - 1]?.payload)?.params;
    }

    report() {
        return this.context().getByTestId('ProtectionsReport');
    }

    /**
     * Report with nothing blocked this week: placeholder rows, no cookie footer.
     */
    async displaysEmptyReport() {
        const report = this.report();
        await expect(report.getByTestId('ProtectionsReportHeadline')).toHaveText('No trackers yet this week.');
        await expect(
            report
                .getByTestId('ProtectionsReportSummary')
                .getByText('As you browse, we’ll block them and show you who tried to watch you.'),
        ).toBeVisible();
        await expect(report.getByTestId('ProtectionsReportEmpty')).toContainText('Why we blocked them');
        await expect(report.getByText('Your report fills in as you browse.')).toBeVisible();
        await expect(report.getByTestId('ProtectionsReportCookies')).toHaveCount(0);
        await expect(report.getByTestId('PryingEye')).toHaveCount(0);
    }

    /**
     * When the weekly stats can't be loaded the report shows its empty state,
     * then fills in once native pushes stats.
     */
    async recoversFromMissingStats() {
        await this.displaysEmptyReport();
        await expect(this.report().getByRole('button', { name: 'Collapse Protections Report' })).toBeVisible();

        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('stats_onDataUpdate'), privacyStatsMocks.report);
        await this.displaysHeadline();
        await this.displaysPurposes();
    }

    async displaysHeadline() {
        const report = this.report();
        await expect(report.getByRole('heading', { level: 2 })).toHaveText('Protections Report');
        await expect(report.getByTestId('ProtectionsReportHeadline')).toHaveText(/^47 companies tried to\s*watch you browse this week\.$/);
        await expect(
            report.getByTestId('ProtectionsReportSummary').getByText('We blocked 3,193 of their attempts to track you.'),
        ).toBeVisible();
    }

    /**
     * Rows are plain-language purposes, in display order, with company names joined naturally.
     */
    async displaysPurposes() {
        const rows = this.report().getByTestId('ProtectionsReportPurposes').getByRole('listitem');
        // most companies first
        await expect(rows).toHaveCount(5);
        await expect(rows.nth(0)).toContainText('Targets you with ads based on the sites you visit');
        await expect(rows.nth(0)).toContainText('Google, Facebook, and 28 others');
        await expect(rows.nth(0)).toContainText('+27');
        await expect(rows.nth(1)).toContainText('Fingerprints your device to recognize you, even without cookies');
        await expect(rows.nth(2)).toContainText('Watches what you read and where you browse');
        await expect(rows.nth(3)).toContainText('Tells social networks what you do on other sites');
        await expect(rows.nth(4)).toContainText('Records what you click, type, and scroll');
        await expect(rows.nth(4)).toContainText('Microsoft and Hotjar');
        await expect(rows.first()).toContainText('Blocked');
    }

    async displaysCompanies() {
        const rows = this.report().getByTestId('ProtectionsReportCompanies').getByRole('listitem');
        await expect(rows).toHaveCount(5);
        await expect(rows.nth(0)).toContainText('Google was on 4 out of 5 sites you visited');
        await expect(rows.nth(0)).toContainText(
            'Targets you with ads based on the sites you visit, fingerprints your device to recognize you, and watches what you read and where you browse.',
        );
        await expect(rows.nth(1)).toContainText('Facebook was on almost half the sites you visited');
        await expect(rows.nth(1)).toContainText(
            'Targets you with ads based on the sites you visit and tells social networks what you do on other sites.',
        );
        await expect(rows.nth(3)).toContainText('Amazon was on more than 1 in 4 sites you visited');

        const more = this.report().getByTestId('ProtectionsReportMoreCompanies');
        await expect(more).toContainText('43 more companies tried too');
        await expect(more).toContainText('Including Criteo, Oracle, and The Trade Desk');
    }

    /**
     * Each detail shows this device's own value (which varies by machine) and how
     * many of this week's companies are known to read it.
     */
    async displaysRecognition() {
        const view = this.report().getByTestId('ProtectionsReportRecognition');
        await expect(view.getByText(/Of the companies we blocked this week, \d+ are known to read details like these/)).toBeVisible();
        const rows = view.locator('[data-surface]');
        await expect(rows).toHaveCount(7);
        // most companies first
        const counts = (await rows.allTextContents()).map((text) => Number(/(\d+) compan/.exec(text)?.[1]));
        expect(counts).toEqual([...counts].sort((a, b) => b - a));
        const screen = view.locator('[data-surface="screen"]');
        await expect(screen).toContainText(/\d+ × \d+ · \d+-bit color/);
        await expect(screen).toContainText(/\d+ compan(y|ies)/);
        await expect(view.locator('[data-surface="locale"]')).toContainText(/ · /);
        await expect(view.locator('[data-surface="fonts"]')).toContainText(/\d+ of 40 common fonts/);
        await expect(view.locator('[data-surface="hardware"]')).toContainText(/\d+ cores/);
        // the voice list loads a moment later; headless browsers may have none
        await expect(view.locator('[data-surface="voices"]')).toContainText(/\d+ installed|Not available/);
        await expect(view.getByText(/single out your device, like a fingerprint/)).toBeVisible();
    }

    /**
     * The share button downloads a PNG of the card.
     */
    async sharesAsImage() {
        const button = this.report().getByRole('button', { name: 'Share as image' });
        const [download] = await Promise.all([this.page.waitForEvent('download'), button.click()]);
        expect(download.suggestedFilename()).toBe('duckduckgo-protections-report.png');
        const path = await download.path();
        const { readFile } = await import('node:fs/promises');
        const bytes = await readFile(path);
        // PNG signature
        expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
        // exported at 1x: the 504px card, 80px either side, and a 12px white frame
        expect(bytes.readUInt32BE(16)).toBe(688);
        await expect(button).toBeEnabled();
        return bytes;
    }

    /**
     * Pretends the browser can share files, recording what it's given. Call
     * before opening the page.
     *
     * @param {'share' | 'refuse'} behaviour - `refuse` throws like a share sheet
     *   opened too long after the click
     */
    async stubShareSheet(behaviour) {
        await this.page.addInitScript((behaviour) => {
            /** @type {any} */ (window).__shared = [];
            Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
            Object.defineProperty(navigator, 'share', {
                configurable: true,
                value: (/** @type {ShareData} */ data) => {
                    if (behaviour === 'refuse') return Promise.reject(new DOMException('too late', 'NotAllowedError'));
                    /** @type {any} */ (window).__shared.push(
                        ...(data.files ?? []).map((f) => ({ name: f.name, type: f.type, size: f.size })),
                    );
                    return Promise.resolve();
                },
            });
        }, behaviour);
    }

    /**
     * With the share sheet available, the picture goes there instead of downloading.
     */
    async sharesViaShareSheet() {
        let downloaded = false;
        this.page.on('download', () => {
            downloaded = true;
        });
        const button = this.report().getByRole('button', { name: 'Share as image' });
        const copy = this.context().getByTestId('ProtectionsReportShareCopy');

        // the picture is taken of a hidden copy, in the reader's own voice
        await button.hover();
        await expect(copy.getByTestId('ProtectionsReportHeadline')).toHaveText(/^47 companies tried to\s*watch me browse this week\.$/);
        await expect(copy).toContainText('DuckDuckGo blocked 3,193 of their attempts to track me.');
        await expect(copy).toContainText('Targets me with ads based on the sites I visit');
        await expect(copy).toContainText('DuckDuckGo also handled 762 annoying cookie pop-ups for me.');
        // while the report on the page is unchanged
        await expect(this.report().getByTestId('ProtectionsReportHeadline')).toHaveText(
            /^47 companies tried to\s*watch you browse this week\.$/,
        );

        await button.click();
        await expect
            .poll(() => this.page.evaluate(() => /** @type {any} */ (window).__shared))
            .toEqual([{ name: 'duckduckgo-protections-report.png', type: 'image/png', size: expect.any(Number) }]);
        expect(downloaded).toBe(false);

        // and the copy goes once the pointer has moved on
        await this.page.mouse.move(0, 0);
        await expect(copy).toHaveCount(0);
    }

    /**
     * Sharing with Enter leaves focus where it was, rather than dropping it
     * while the picture is made.
     */
    async sharesFromKeyboard() {
        const button = this.report().getByRole('button', { name: 'Share as image' });
        await button.focus();
        await this.page.keyboard.press('Enter');
        await expect.poll(() => this.page.evaluate(() => /** @type {any} */ (window).__shared.length)).toBe(1);
        await expect(button).toBeFocused();
        await expect(button).toBeEnabled();
    }

    /**
     * The hidden copy goes when the share button does, even without the pointer
     * leaving it (eg: native switches to the by-site view, which isn't shared).
     */
    async dropsShareCopyWhenNotShareable() {
        const copy = this.context().getByTestId('ProtectionsReportShareCopy');
        await this.report().getByRole('button', { name: 'Share as image' }).hover();
        await expect(copy).toHaveCount(1);

        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onConfigUpdate'), {
            expansion: 'expanded',
            feed: 'activity',
        });
        await expect(this.report().getByRole('button', { name: 'Share as image' })).toHaveCount(0);
        await expect(copy).toHaveCount(0);
    }

    async displaysTopSites() {
        const view = this.report().getByTestId('ProtectionsReportTopSites');
        await expect(view.getByText('Nosiest site this week')).toBeVisible();
        await expect(view.getByText('cnn.com')).toBeVisible();
        await expect(view.getByText('31 companies')).toBeVisible();
        await expect(view.getByText('were trying to watch, including Google, Facebook, and Microsoft.')).toBeVisible();
        const rows = view.getByRole('listitem');
        // the next four; a site with no trackers is left out
        await expect(rows).toHaveCount(4);
        await expect(rows.first()).toContainText('allrecipes.com');
        await expect(rows.first()).toContainText('26 companies');
    }

    /**
     * Without native categories, purposes come from the table built from Tracker Radar.
     */
    async displaysPurposesFromBuiltInTable() {
        const purposes = this.report().getByTestId('ProtectionsReportPurposes').getByRole('listitem');
        await expect(purposes.first()).toContainText('Targets you with ads based on the sites you visit');
        await expect(purposes.first()).toContainText('Google, Facebook, and');
        await this.choosesView('Who we blocked the most', 'companies');
        const rows = this.report().getByTestId('ProtectionsReportCompanies').getByRole('listitem');
        await expect(rows.nth(0)).toContainText('Google was on 4 out of 5 sites you visited');
        await expect(rows.nth(0)).toContainText(
            'Targets you with ads based on the sites you visit, fingerprints your device to recognize you, and watches what you read and where you browse.',
        );
    }

    /**
     * @param {string[]} expected - menu item labels, in order
     */
    async hasViewOptions(expected) {
        await this.report().getByTestId('ProtectionsReportViewMenu').click();
        const items = this.page.getByRole('menuitemradio');
        await expect(items).toHaveText(expected);
        await expect(this.page.getByRole('menu')).toBeFocused();
        await this.page.keyboard.press('Escape');
        await expect(items).toHaveCount(0);
    }

    /**
     * @param {string} label
     * @param {import('../../../types/new-tab.js').FeedType} feed
     */
    async choosesView(label, feed) {
        const trigger = this.report().getByTestId('ProtectionsReportViewMenu');
        await trigger.click();
        await this.page.getByRole('menuitemradio', { name: label }).click();
        await expect(trigger).toHaveText(label);
        await expect(trigger).toBeFocused();
        await expect.poll(() => this.lastSetConfig()).toMatchObject({ feed });
    }

    /**
     * @param {number} count
     */
    async displaysCookieFooter(count) {
        await expect(this.report().getByTestId('ProtectionsReportCookies')).toHaveText(
            `We also handled ${count.toLocaleString('en-US')} annoying cookie pop-ups for you.`,
        );
    }

    /**
     * @param {number | null} totalCookiePopUpsBlocked
     */
    async hidesCookieFooterFor(totalCookiePopUpsBlocked) {
        /** @type {ProtectionsData} */
        const data = { totalCount: 100, totalCookiePopUpsBlocked };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        await expect(
            this.report().getByTestId('ProtectionsReportSummary').getByText('We blocked 100 of their attempts to track you.'),
        ).toBeVisible();
        await expect(this.report().getByTestId('ProtectionsReportCookies')).toHaveCount(0);
    }

    /**
     * @param {number} totalCookiePopUpsBlocked
     */
    async receivesCookieCount(totalCookiePopUpsBlocked) {
        /** @type {ProtectionsData} */
        const data = { totalCount: 3193, totalCookiePopUpsBlocked };
        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_onDataUpdate'), data);
        await this.displaysCookieFooter(totalCookiePopUpsBlocked);
    }

    /**
     * The info button opens on hover and click, and closes with Escape.
     */
    async hasInfoPopover() {
        const button = this.report().getByRole('button', { name: 'Why this matters' });
        const popover = this.page.getByRole('dialog', { name: 'Why this matters' });

        await button.hover();
        await expect(popover).toBeVisible();
        await expect(popover).toContainText('Trackers aren’t just on sensitive sites.');
        await expect(button).toHaveAttribute('aria-expanded', 'true');

        await this.page.keyboard.press('Escape');
        await expect(popover).not.toBeVisible();

        await this.page.mouse.move(0, 0);
        await button.focus();
        await this.page.keyboard.press('Enter');
        await expect(popover).toBeVisible();
        await this.page.keyboard.press('Enter');
        await expect(popover).not.toBeVisible();

        // the click that follows hovering keeps it open; the next one closes it
        await button.hover();
        await button.click();
        await expect(popover).toBeVisible();
        await button.click();
        await expect(popover).not.toBeVisible();
    }

    /**
     * Collapsing keeps the headline but hides the views and persists the state.
     */
    async collapsesReport() {
        const report = this.report();
        const toggle = report.getByRole('button', { name: 'Collapse Protections Report' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await toggle.click();

        const expand = report.getByRole('button', { name: 'Expand Protections Report' });
        await expect(expand).toHaveAttribute('aria-expanded', 'false');
        await expect(report.getByTestId('ProtectionsReportHeadline')).toBeVisible();
        const body = report.getByTestId('ProtectionsReportBody');
        await expect(body).toHaveAttribute('aria-hidden', 'true');
        await expect.poll(() => body.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
        await expect.poll(() => this.lastSetConfig()).toMatchObject({ expansion: 'collapsed' });

        await expand.click();
        await expect(body).toHaveAttribute('aria-hidden', 'false');
        await expect.poll(() => body.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(0);
    }

    /**
     * Verifies expanded/collapsed state toggles from the heading control.
     */
    async togglesCollapsedState() {
        const heading = this.context().getByTestId('ProtectionsHeading');
        const toggleButton = heading.getByRole('button', { name: /show recent activity|hide recent activity/i });
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        await toggleButton.click();
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
        await toggleButton.click();
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    }

    /**
     * Native's `protections_scroll` brings the report's title back into view.
     */
    async scrollsIntoViewOnRequest() {
        const title = this.report().getByRole('heading', { level: 2 });
        await expect(title).toBeVisible();

        // a short window, so scrolling to the bottom takes the title out of view
        await this.page.setViewportSize({ width: 1024, height: 400 });
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(title).not.toBeInViewport();

        await this.ntp.mocks.simulateSubscriptionMessage(named.subscription('protections_scroll'), {});
        await expect(title).toBeInViewport();
    }
}
