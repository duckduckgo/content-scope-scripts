import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/chrome-webstore-patching/pages/detail.html';
const PROMO_HTML = '/chrome-webstore-patching/pages/promo.html';
const CONFIG = './integration-test/test-pages/chrome-webstore-patching/config/config.json';

const CATALOG_ID = 'nngceckbapebfimnlniiiahkandclblb';
const CATALOG_PATH = `/detail/bitwarden-password-manage/${CATALOG_ID}`;
const NON_CATALOG_PATH = '/detail/some-other-extension/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const OTHER_CATALOG_ID = 'aeblfdkhhhdcdjpifhhbdiojplfjncoa';

// Logged (tests run with debug on) once a failed catalog lookup has resolved
const LOG_CATALOG_ERROR = 'getCatalogExtensionIds failed';
const LOG_CATALOG_UNUSABLE = 'getCatalogExtensionIds: timed out or malformed reply';

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
 * Installed BEFORE the C-S-S bundle. The windows messaging mock can only reply
 * with `{ result }`, so this rewrites native's reply to `method` into a
 * JSON-RPC-style `{ error }` on its way into the bundle. It hooks the
 * window.windowsInterop* globals the test wrapper hands the bundle, matching
 * replies to the request ids seen going out.
 * @param {{ method: string, message: string }} params
 */
function mockNativeErrorReply({ method, message }) {
    /** @type {Set<string>} */
    const errorIds = new Set();
    /** @type {Map<unknown, unknown>} */
    const wrappedListeners = new Map();
    /**
     * @param {string} name
     * @param {(fn: any) => any} wrap
     */
    const hook = (name, wrap) => {
        /** @type {unknown} */
        let value;
        Object.defineProperty(window, name, {
            configurable: true,
            get: () => value,
            set: (fn) => {
                value = wrap(fn);
            },
        });
    };
    hook('windowsInteropPostMessage', (post) => (/** @type {any} */ msg) => {
        if (msg?.Name === method && msg.Id) errorIds.add(msg.Id);
        return post(msg);
    });
    hook('windowsInteropAddEventListener', (add) => (/** @type {string} */ type, /** @type {(e: any) => void} */ listener) => {
        /** @param {any} event */
        const wrapper = (event) => {
            const data = event?.data;
            if (!data || !errorIds.has(data.id)) return listener(event);
            const { result: _result, ...rest } = data;
            listener({ origin: event.origin, data: { ...rest, error: { message } } });
        };
        wrappedListeners.set(listener, wrapper);
        return add(type, wrapper);
    });
    hook(
        'windowsInteropRemoveEventListener',
        (remove) => (/** @type {string} */ type, /** @type {unknown} */ listener) =>
            remove(type, wrappedListeners.get(listener) ?? listener),
    );
}

/**
 * Resolves once the feature logs `text`. Failed catalog lookups leave the
 * button exactly as hidden as it starts, so a test must wait for the failure to
 * be processed or its "stays hidden" assertion would pass vacuously.
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
function waitForFeatureLog(page, text) {
    return page.waitForEvent('console', { predicate: (msg) => msg.text().includes(text), timeout: 10000 });
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
 * @param {boolean} [opts.internal] internal build? fixtures ship the feature as
 * `internal`, matching the windows override, so this defaults to true. Only the
 * feature's own state reads it; the catalog comes from native.
 * @param {string} [opts.locale]
 * @param {unknown} [opts.catalogReply] native's reply to getCatalogExtensionIds;
 * defaults to a catalog holding CATALOG_ID
 * @param {'error' | 'none'} [opts.catalogFailure] native replies with an error,
 * or never replies at all
 */
async function setup(page, testInfo, opts = {}) {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    if (opts.userUnprotectedDomains) {
        collector.withUserUnprotectedDomains(opts.userUnprotectedDomains);
    }
    // With no mock entry the harness never answers, which is how a native side
    // that never replies looks to the feature
    if (opts.catalogFailure !== 'none') {
        const reply = 'catalogReply' in opts ? opts.catalogReply : { extensionIds: [CATALOG_ID] };
        collector.withMockResponse({ getCatalogExtensionIds: reply });
    }
    if (opts.catalogFailure === 'error') {
        await page.addInitScript(mockNativeErrorReply, { method: 'getCatalogExtensionIds', message: 'catalog unavailable' });
    }
    await page.addInitScript(mockWebstorePrivate, {
        statusById: opts.statusById ?? {},
        omit: opts.omit ?? false,
        errorFor: opts.errorFor,
    });
    const platform = { internal: opts.internal ?? true };
    if (opts.locale) {
        // collector.load() has no locale parameter; setup() + goto is the same flow
        await collector.setup({ config: opts.config ?? CONFIG, locale: opts.locale, platform });
        await page.goto(opts.html ?? HTML);
    } else {
        await collector.load(opts.html ?? HTML, opts.config ?? CONFIG, platform);
    }
    return collector;
}

/** pushState to a store-like path so parseExtensionId sees it, then let the feature re-evaluate */
async function navigateTo(page, path) {
    await page.evaluate((p) => history.pushState({}, '', p), path);
}

test.describe('chromeWebstorePatching', () => {
    test('catalog + installable → DuckDuckGo install copy, re-enabled', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
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
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        // Playwright refuses normal clicks on disabled elements
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
    });

    test('catalog pill click reaches the store handler and re-evaluates state', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.locator(BUTTON).click();
        // the store's delegated handler must still fire for catalog extensions
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(true);
        // simulate the async install completing; the click-scheduled
        // re-evaluation flips the pill without a navigation
        await page.evaluate(() => /** @type {any} */ (window).__cwsHook.setStatus('nngceckbapebfimnlniiiahkandclblb', 'enabled'));
        await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    });

    test('catalog + installed → remove copy', async ({ page }, testInfo) => {
        await setup(page, testInfo, { statusById: { [CATALOG_ID]: 'enabled' } });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    });

    test('non-catalog extension → disabled grey "Unsupported extension" pill', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await expect(page.locator(BUTTON)).toHaveCSS('background-color', 'rgb(228, 228, 228)');
        await expect(page.locator(BUTTON)).toHaveAttribute('title', /isn't supported/);
    });

    // The tooltip is unsupported-only: a node that flips verdict in place must
    // not keep claiming the extension isn't supported
    test('tooltip cleared when the same button flips to a catalog verdict', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(BUTTON)).toHaveAttribute('title', /isn't supported/);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await expect(page.locator(BUTTON)).not.toHaveAttribute('title', /./);
    });

    test('catalog pill uses the DDG accent background', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(BUTTON)).toHaveCSS('background-color', 'rgb(240, 95, 43)');
        await expect(page.locator(BUTTON)).toHaveCSS('border-radius', '48px');
    });

    // The reveal must not write page-readable state: a root attribute would tell
    // the store it's the DDG browser and whether this extension is in the catalog, and
    // any page script could set it to un-hide buttons we decided to keep hidden
    test('no page-exposed state, and a forged root attribute reveals nothing', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        const rootAttributes = await page.evaluate(() => [...document.documentElement.attributes].map((a) => a.name));
        expect(rootAttributes.filter((name) => name.startsWith('data-ddg'))).toEqual([]);

        // a page script tries to force the hidden state open
        await setup(page, testInfo);
        await page.evaluate(() => document.documentElement.setAttribute('data-ddg-webstore', 'curated'));
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    // The feature ships `internal` in the windows override, so a public build
    // must get nothing at all — not a patched button, not a hidden one
    test('non-internal build → feature inert, original button untouched', async ({ page }, testInfo) => {
        await setup(page, testInfo, { internal: false });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
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
            await navigateTo(page, CATALOG_PATH);
            await expect(page.locator(BUTTON)).toBeVisible();
            await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
        });
    }

    test('requests the catalog from native over chromeWebstorePatching messaging', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
        const [call] = await collector.waitForMessage('getCatalogExtensionIds');
        expect(call.payload).toMatchObject({
            context: 'contentScopeScripts',
            featureName: 'chromeWebstorePatching',
            method: 'getCatalogExtensionIds',
            params: {},
        });
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    // Native answers [] when extension management is off: nothing is
    // installable, and the click must never reach the store's install handler
    test('empty native catalog → catalog ID treated as unsupported, click inert', async ({ page }, testInfo) => {
        await setup(page, testInfo, { catalogReply: { extensionIds: [] } });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
    });

    // Rollout, minimum version and native-only gates all surface as "not in the list"
    test('extension left out of the native catalog → unsupported pill', async ({ page }, testInfo) => {
        await setup(page, testInfo, { catalogReply: { extensionIds: [OTHER_CATALOG_ID] } });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    // An unknown catalog is not an empty one: showing "Unsupported extension"
    // here would mislabel catalog extensions whenever native misbehaves
    test('native error reply → button stays hidden, no unsupported pill', async ({ page }, testInfo) => {
        await setup(page, testInfo, { catalogFailure: 'error' });
        const failed = waitForFeatureLog(page, LOG_CATALOG_ERROR);
        await navigateTo(page, CATALOG_PATH);
        await failed;
        await expect(page.locator(BUTTON)).not.toBeVisible();
        await expect(page.locator(LABEL)).toHaveCount(0);
    });

    for (const [label, catalogReply] of [
        ['extensionIds missing', {}],
        ['extensionIds not an array', { extensionIds: CATALOG_ID }],
        ['non-string entries', { extensionIds: [CATALOG_ID, 42] }],
    ]) {
        test(`malformed native reply (${label}) → button stays hidden`, async ({ page }, testInfo) => {
            await setup(page, testInfo, { catalogReply });
            const rejected = waitForFeatureLog(page, LOG_CATALOG_UNUSABLE);
            await navigateTo(page, CATALOG_PATH);
            await rejected;
            await expect(page.locator(BUTTON)).not.toBeVisible();
            await expect(page.locator(LABEL)).toHaveCount(0);
        });
    }

    test('native never replies → times out, button stays hidden', async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { catalogFailure: 'none' });
        const timedOut = waitForFeatureLog(page, LOG_CATALOG_UNUSABLE);
        await navigateTo(page, CATALOG_PATH);
        await collector.waitForMessage('getCatalogExtensionIds');
        await timedOut;
        await expect(page.locator(BUTTON)).not.toBeVisible();
        await expect(page.locator(LABEL)).toHaveCount(0);
    });

    // Ship Review blocker: switching protections off must not restore a working
    // install button. The feature is in `platformSpecificFeatures`, so it keeps
    // loading while everything else is skipped.
    test('protections off (user allowlist) → feature still patches', async ({ page }, testInfo) => {
        await setup(page, testInfo, { userUnprotectedDomains: ['localhost'] });
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await page.locator(BUTTON).click({ force: true });
        await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
        // catalog extensions keep working normally
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    test('site in unprotectedTemporary → feature still patches', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-site-unprotected.json',
        });
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    // Remote config is a hot-fix channel: one malformed selector must not
    // invalidate the whole injected rule and reveal Google's own button
    test('malformed selector dropped, valid ones still patch', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-invalid-selector.json',
        });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
    });

    test('selector miss → no crash, original button untouched', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-selector-miss.json',
        });
        await navigateTo(page, CATALOG_PATH);
        // bogus selectors hide nothing and swap nothing — documents that CSS
        // fail-closed only protects where selectors match
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(ORIGINAL_LABEL)).toHaveText('Add to Chrome');
    });

    test('API absent → stays hidden (fail closed)', async ({ page }, testInfo) => {
        await setup(page, testInfo, { omit: true });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    test('API error via lastError → stays hidden', async ({ page }, testInfo) => {
        await setup(page, testInfo, { errorFor: CATALOG_ID });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    test('unknown status → stays hidden', async ({ page }, testInfo) => {
        await setup(page, testInfo, { statusById: { [CATALOG_ID]: 'weird_new_state' } });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(BUTTON)).not.toBeVisible();
    });

    // Each nav mounts a FRESH store button while the old node lingers in the
    // DOM (mirroring the real store) — every match must be restyled, not just
    // the first in document order.
    test('SPA nav catalog → non-catalog flips to unsupported pill', async ({ page }, testInfo) => {
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

    test('SPA nav non-catalog → catalog flips to install pill', async ({ page }, testInfo) => {
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

    test('default locale → bundled English strings', async ({ page }, testInfo) => {
        await setup(page, testInfo);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    test('locale de without config copy → bundled German strings', async ({ page }, testInfo) => {
        await setup(page, testInfo, { locale: 'de' });
        await navigateTo(page, NON_CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Nicht unterstützte Erweiterung');
        await expect(page.locator(BUTTON)).toHaveAttribute('title', /wird nicht unterstützt/);
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Zu DuckDuckGo hinzufügen');
    });

    test('region-tagged locale resolves its language dir (de-DE → de)', async ({ page }, testInfo) => {
        await setup(page, testInfo, { locale: 'de-DE' });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Zu DuckDuckGo hinzufügen');
    });

    test('unknown locale falls back to bundled English', async ({ page }, testInfo) => {
        await setup(page, testInfo, { locale: 'zz' });
        await navigateTo(page, CATALOG_PATH);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    });

    test('promos hidden with configured promoSelectors', async ({ page }, testInfo) => {
        await setup(page, testInfo, { html: PROMO_HTML });
        await expect(page.locator('div[jscontroller="o2G9me"]')).toHaveCSS('display', 'none');
        await expect(page.locator('[jsname="v621tc"]')).toHaveCSS('display', 'none');
        await expect(page.locator('header aside')).toHaveCSS('display', 'none');
    });

    // Unusable promo entries must be dropped one at a time. An xpath entry can
    // never be consumed here, and remote config is a hot-fix channel so a
    // malformed selector is a question of when; neither may take the rest of
    // the list down with it.
    test('promos still hidden when the list contains unusable entries', async ({ page }, testInfo) => {
        await setup(page, testInfo, {
            html: PROMO_HTML,
            config: './integration-test/test-pages/chrome-webstore-patching/config/config-promo-unusable-entries.json',
        });
        await expect(page.locator('[jsname="v621tc"]')).toHaveCSS('display', 'none');
        await expect(page.locator('div[jscontroller="o2G9me"]')).toHaveCSS('display', 'none');
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
