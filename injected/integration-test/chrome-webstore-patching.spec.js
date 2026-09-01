import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/chrome-webstore-patching/pages/detail.html';
const PROMO_HTML = '/chrome-webstore-patching/pages/promo.html';
const CONFIG = './integration-test/test-pages/chrome-webstore-patching/config/config.json';

const CURATED_ID = 'nngceckbapebfimnlniiiahkandclblb';
const CURATED_PATH = `/detail/bitwarden-password-manage/${CURATED_ID}`;
const UNCURATED_PATH = '/detail/some-other-extension/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const BUTTON = 'button[jsname="wQO0od"]';
const LABEL = 'button [data-ddg-webstore-label]';
const ORIGINAL_LABEL = 'span.UywwFc-vQzf8d';

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
    // Test hook: lets specs flip an extension's install status mid-test
    // @ts-expect-error - page-world globals
    window.__cwsHook = {
        /**
         * @param {string} id
         * @param {string} status
         */
        setStatus(id, status) {
            statusById[id] = status;
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
 * @param {string[]} [opts.userUnprotectedDomains]
 */
async function setup(page, testInfo, opts = {}) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    if (opts.userUnprotectedDomains) {
        collector.withUserUnprotectedDomains(opts.userUnprotectedDomains);
    }
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
        // every store child is hidden so only icon + our label consume flex gap
        await expect(page.locator(`${BUTTON} .UywwFc-icon`)).toHaveCSS('display', 'none');
        await expect(page.locator(`${BUTTON} .UywwFc-ripple`)).toHaveCSS('display', 'none');
        await expect(page.locator(ORIGINAL_LABEL)).toHaveCSS('display', 'none');
        // inline layout beats the fixture's hostile !important store rules
        await expect(page.locator(BUTTON)).toHaveCSS('height', '40px');
        await expect(page.locator(BUTTON)).toHaveCSS('border-radius', '48px');
        const icon = page.locator(`${BUTTON} [data-ddg-webstore-icon]`);
        await expect(icon).toBeVisible();
        await expect(icon).toHaveCSS('width', '24px');
    });

    test('unsupported pill click does not trigger the store install handler', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, UNCURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        // Playwright refuses normal clicks on disabled elements
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
    });

    test('curated pill click reaches the store handler and re-evaluates state', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.locator(BUTTON).click();
        // the store's delegated handler must still fire for curated extensions
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(true);
        // simulate the async install completing; the click-scheduled
        // re-evaluation flips the pill without a navigation
        await page.evaluate(() => /** @type {any} */ (window).__cwsHook.setStatus('nngceckbapebfimnlniiiahkandclblb', 'enabled'));
        await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
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

    // The tooltip is unsupported-only: a node that flips verdict in place must
    // not keep claiming the extension isn't supported
    test('tooltip cleared when the same button flips to a curated verdict', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, UNCURATED_PATH);
        await expect(page.locator(BUTTON)).toHaveAttribute('title', /isn't supported/);
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await expect(page.locator(BUTTON)).not.toHaveAttribute('title', /./);
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
        await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
    });

    for (const config of ['config-gate-disabled', 'config-feature-disabled', 'config-minimal']) {
        test(`${config} → feature inert, original button untouched`, async ({ page }, testInfo) => {
            await setup(page, testInfo, {
                config: `./integration-test/test-pages/chrome-webstore-patching/config/${config}.json`,
            });
            await navigateTo(page, CURATED_PATH);
            await expect(page.locator(BUTTON)).toBeVisible();
            await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
        });
    }

    test('extensionManagement (parent) disabled → curated ID treated as unsupported, click inert', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-extension-management-off.json',
        });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        // the live-build bug: this click used to reach the store's install handler
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
    });

    test('curatedExtensions disabled → curated ID treated as unsupported', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-curation-off.json',
        });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    // Launch blocker: with the native catalog gone or unusable, nothing is
    // installable — an unreadable catalog must never fall back to "curated"
    for (const config of ['config-no-extension-management', 'config-empty-catalog']) {
        test(`${config} → nothing curated, install stays blocked`, async ({ page }, testInfo) => {
            await setup(page, testInfo, {
                config: `./integration-test/test-pages/chrome-webstore-patching/config/${config}.json`,
            });
            await navigateTo(page, CURATED_PATH);
            await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
            await expect(page.locator(BUTTON)).toBeDisabled();
            await page.locator(BUTTON).click({ force: true });
            await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
        });
    }

    // Ship Review blocker: switching protections off must not restore a working
    // install button. The feature is in `platformSpecificFeatures`, so it keeps
    // loading while everything else is skipped.
    test('protections off (user allowlist) → feature still patches', async ({ page }, testInfo) => {
        await setup(page, testInfo, { userUnprotectedDomains: ['localhost'] });
        await navigateTo(page, UNCURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
        // curated extensions keep working normally
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    test('site in unprotectedTemporary → feature still patches', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-site-unprotected.json',
        });
        await navigateTo(page, UNCURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    // Remote config is a hot-fix channel: one malformed selector must not
    // invalidate the whole injected rule and reveal Google's own button
    test('malformed selector dropped, valid ones still patch', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-invalid-selector.json',
        });
        await navigateTo(page, CURATED_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await navigateTo(page, UNCURATED_PATH);
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
        await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
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

    // Each nav mounts a FRESH store button while the old node lingers in the
    // DOM (mirroring the real store) — every match must be restyled, not just
    // the first in document order.
    test('SPA nav curated → uncurated flips to unsupported pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Add to DuckDuckGo');
        await page.getByRole('button', { name: 'Go to uncurated detail' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON).last()).toBeDisabled();
        // no lingering node keeps the previous verdict's copy
        for (const text of await page.locator(LABEL).allTextContents()) {
            expect(text).toBe('Unsupported extension');
        }
    });

    test('SPA nav uncurated → curated flips to install pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to uncurated detail' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Unsupported extension');
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Add to DuckDuckGo');
        await expect(page.locator(BUTTON).last()).toBeEnabled();
        for (const text of await page.locator(LABEL).allTextContents()) {
            expect(text).toBe('Add to DuckDuckGo');
        }
    });

    test('store re-render → observer re-applies copy', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await page.getByRole('button', { name: 'Go to curated detail' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Add to DuckDuckGo');
        // page script replaces the whole button node with fresh Chrome copy
        await page.getByRole('button', { name: 'Re-render install button' }).click();
        await expect(page.locator(LABEL).last()).toHaveText('Add to DuckDuckGo');
        for (const text of await page.locator(LABEL).allTextContents()) {
            expect(text).toBe('Add to DuckDuckGo');
        }
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
