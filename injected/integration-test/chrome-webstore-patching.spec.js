import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/chrome-webstore-patching/pages/detail.html';
const PROMO_HTML = '/chrome-webstore-patching/pages/promo.html';
const CONFIG = './integration-test/test-pages/chrome-webstore-patching/config/config.json';

const CURATED_ID = 'nngceckbapebfimnlniiiahkandclblb';
const CURATED_PATH = `/detail/bitwarden-password-manage/${CURATED_ID}`;
const UNCURATED_PATH = '/detail/some-other-extension/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const BUTTON = 'button[jsname="wQO0od"]';
const LABEL = 'span.UywwFc-vQzf8d';

/**
 * Installed into the page BEFORE the C-S-S bundle runs (addInitScript ordering).
 * Mirrors the chrome.webstorePrivate surface the feature consumes.
 * @param {{ statusById?: Record<string, string>, omit?: boolean, errorFor?: string }} params
 */
function mockWebstorePrivate({ statusById = {}, omit = false, errorFor = undefined }) {
    if (omit) return;
    const webstorePrivate = {
        /**
         * @param {string} id
         * @param {(status: string|undefined) => void} cb
         */
        getExtensionStatus(id, cb) {
            if (id === errorFor) {
                // @ts-expect-error - page-world globals
                window.chrome.runtime.lastError = { message: 'boom' };
                cb(undefined);
                // @ts-expect-error - page-world globals
                window.chrome.runtime.lastError = undefined;
                return;
            }
            cb(statusById[id] ?? 'installable');
        },
    };
    // The windows messaging test harness does `window.chrome = {}` in a later
    // init script (mockWindowsMessaging in @duckduckgo/messaging test-utils),
    // which would wipe a plain assignment. An accessor re-attaches our API to
    // whatever object gets assigned.
    let chromeValue = { runtime: {}, webstorePrivate };
    Object.defineProperty(window, 'chrome', {
        configurable: true,
        get() {
            return chromeValue;
        },
        set(value) {
            chromeValue = value || {};
            chromeValue.webstorePrivate = webstorePrivate;
            chromeValue.runtime = chromeValue.runtime || {};
        },
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {object} [opts]
 * @param {Record<string, string>} [opts.statusById]
 * @param {boolean} [opts.omit]
 * @param {string} [opts.errorFor]
 * @param {string} [opts.config]
 * @param {string} [opts.html]
 */
async function setup(page, testInfo, opts = {}) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await page.addInitScript(mockWebstorePrivate, {
        statusById: opts.statusById ?? {},
        omit: opts.omit ?? false,
        errorFor: opts.errorFor,
    });
    await collector.load(opts.html ?? HTML, opts.config ?? CONFIG);
    return collector;
}

/** pushState to a store-like path so parseExtensionId sees it, then let the feature re-evaluate */
async function navigateTo(page, path) {
    await page.evaluate((p) => history.pushState({}, '', p), path);
}

test.describe('chromeWebstorePatching', () => {
    test('curated + installable → DuckDuckGo install copy, re-enabled', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await expect(page.locator(BUTTON)).toHaveAttribute('aria-label', 'Add to DuckDuckGo');
        // fixture button starts disabled + aria-disabled (the store disables it
        // on non-Chrome browsers) — the feature must clear both
        await expect(page.locator(BUTTON)).toBeEnabled();
        await expect(page.locator(BUTTON)).not.toHaveAttribute('aria-disabled', 'true');
        // decorative children are hidden so only icon + label consume flex gap
        await expect(page.locator(`${BUTTON} .UywwFc-icon`)).toHaveCSS('display', 'none');
        await expect(page.locator(`${BUTTON} .UywwFc-ripple`)).toHaveCSS('display', 'none');
    });

    test('curated + installed → remove copy', async ({ page }, testInfo) => {
        await setup(page, testInfo, { statusById: { [CURATED_ID]: 'enabled' } });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    });

    test('uncurated extension → disabled grey "Unsupported extension" pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, UNCURATED_PATH);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await expect(page.locator(BUTTON)).toHaveCSS('background-color', 'rgb(228, 228, 228)');
        await expect(page.locator(BUTTON)).toHaveAttribute('title', /isn't supported/);
    });

    test('curated pill uses the DDG accent background', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(BUTTON)).toHaveCSS('background-color', 'rgb(240, 95, 43)');
        await expect(page.locator(BUTTON)).toHaveCSS('border-radius', '48px');
    });

    test('non-detail path → button hidden, copy untouched', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        // fixture's natural URL is not a /detail/ path
        await expect(page.locator(BUTTON)).not.toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Add to Chrome');
    });

    for (const config of ['config-gate-disabled', 'config-feature-disabled', 'config-minimal']) {
        test(`${config} → feature inert, original button untouched`, async ({ page }, testInfo) => {
            await setup(page, testInfo, {
                config: `./integration-test/test-pages/chrome-webstore-patching/config/${config}.json`,
            });
            await navigateTo(page, CURATED_PATH);
            await expect(page.locator(BUTTON)).toBeVisible();
            await expect(page.locator(LABEL)).toHaveText('Add to Chrome');
        });
    }

    test('curatedExtensions disabled → curated ID treated as unsupported', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-curation-off.json',
        });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    test('selector miss → no crash, original button untouched', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-selector-miss.json',
        });
        await navigateTo(page, CURATED_PATH);
        // bogus selectors hide nothing and swap nothing — documents that CSS
        // fail-closed only protects where selectors match
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Add to Chrome');
    });

    test('API absent → stays hidden (fail closed)', async ({ page }, testInfo) => {
        await setup(page, testInfo, { omit: true });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    test('API error via lastError → stays hidden', async ({ page }, testInfo) => {
        await setup(page, testInfo, { errorFor: CURATED_ID });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    test('unknown status → stays hidden', async ({ page }, testInfo) => {
        await setup(page, testInfo, { statusById: { [CURATED_ID]: 'weird_new_state' } });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    test('SPA nav curated → uncurated flips to unsupported pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.getByRole('button', { name: 'Go to uncurated detail' }).click();
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    test('SPA nav uncurated → curated flips to install pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to uncurated detail' }).click();
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await expect(page.locator(BUTTON)).toBeEnabled();
    });

    test('store re-render → observer re-applies copy', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        // page script replaces the whole button node with fresh Chrome copy
        await page.getByRole('button', { name: 'Re-render install button' }).click();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    test('promos hidden with configured promoSelectors', async ({ page }, testInfo) => {
        await setup(page, testInfo, { html: PROMO_HTML });
        await expect(page.locator('div[jscontroller="o2G9me"]')).toHaveCSS('display', 'none');
        await expect(page.locator('[jsname="v621tc"]')).toHaveCSS('display', 'none');
        await expect(page.locator('header aside')).toHaveCSS('display', 'none');
    });

    test('promos visible when feature inert', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            html: PROMO_HTML,
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-minimal.json',
        });
        await expect(page.locator('div[jscontroller="o2G9me"]')).toBeVisible();
    });
});
