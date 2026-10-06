import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

test.use({ browserName: 'webkit' });

const HTML = '/chrome-webstore-patching/pages/detail.html';
const CONFIG = './integration-test/test-pages/chrome-webstore-patching/config/config.json';
const ID = 'nngceckbapebfimnlniiiahkandclblb';
const DETAIL = `/detail/bitwarden-password-manage/${ID}`;
const OTHER = '/detail/other/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BUTTON = 'button[jsname="wQO0od"]';
const LABEL = `${BUTTON} [data-ddg-webstore-label]`;
// Logged (tests run with debug on) once a failed catalog lookup has resolved
const LOG_CATALOG_ERROR = 'getCatalogExtensionIds failed';
const LOG_CATALOG_UNUSABLE = 'getCatalogExtensionIds: timed out or malformed reply';

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {{status?: unknown, fail?: boolean, hold?: boolean, rejectStatus?: boolean, rejectAction?: boolean,
 * setupResponse?: unknown, rejectSetup?: boolean, holdSetup?: boolean,
 * catalogReply?: unknown, catalogFailure?: 'error' | 'none',
 * config?: string, platform?: 'macos' | 'ios'}} [options] `catalogReply` is native's reply to
 * getCatalogExtensionIds and defaults to a catalog holding ID; `catalogFailure` makes native
 * reply with an error, or never reply at all
 */
async function setup(page, testInfo, options = {}) {
    const collector = ResultsCollector.create(page, testInfo.project.use).withMockResponse({
        initialSetup: 'setupResponse' in options ? options.setupResponse : { enabled: true },
        getCatalogExtensionIds: 'catalogReply' in options ? options.catalogReply : { extensionIds: [ID] },
        getExtensionStatus: { status: options.status ?? 'installable' },
        installExtension: { success: !options.fail },
        removeExtension: { success: !options.fail },
    });
    // Detect even an accidental read of Chromium APIs on the macOS path.
    await page.addInitScript((opts) => {
        // Simulate page-world History calls bypassing the isolated world's
        // wrappers, including WebKit versions without the Navigation API.
        const win = /** @type {any} */ (window);
        win.storePushState = history.pushState.bind(history);
        win.storeReplaceState = history.replaceState.bind(history);
        Object.defineProperty(window, 'navigation', { value: undefined, configurable: true });
        Object.defineProperty(window, 'chrome', {
            get() {
                throw new Error('macOS must not access chrome');
            },
            configurable: true,
        });
        // Wrap the mock before the feature captures its native message handler
        // when registering the change subscription at document start.
        let webkit;
        Object.defineProperty(window, 'webkit', {
            configurable: true,
            get: () => webkit,
            set(value) {
                webkit = value;
                const handler = value.messageHandlers.contentScopeScriptsIsolated;
                const original = handler.postMessage.bind(handler);
                handler.postMessage = async (message) => {
                    const response = await original(message);
                    if (message.method === 'initialSetup') {
                        if (opts.rejectSetup) throw new Error('native setup unavailable');
                        if (opts.holdSetup) {
                            await new Promise((resolve) => {
                                win.completeSetup = resolve;
                            });
                        }
                        return response;
                    }
                    if (message.method === 'getCatalogExtensionIds') {
                        if (opts.catalogFailure === 'error') throw new Error('catalog unavailable');
                        if (opts.catalogFailure === 'none') await new Promise(() => {});
                        return response;
                    }
                    if (message.method === 'getExtensionStatus') {
                        if (opts.rejectStatus) throw new Error('native status unavailable');
                        if (win.holdNextStatus) {
                            win.holdNextStatus = false;
                            await new Promise((resolve) => {
                                win.releaseStatus = resolve;
                            });
                        }
                        return response;
                    }
                    if (message.method === 'installExtension' || message.method === 'removeExtension') {
                        if (opts.hold)
                            await new Promise((resolve) => {
                                win.completeOperation = resolve;
                            });
                        if (opts.rejectAction) throw new Error('native operation failed');
                        if (!opts.fail) {
                            win.__playwright_01.mockResponses.getExtensionStatus = {
                                status: message.method === 'installExtension' ? 'installed' : 'installable',
                            };
                        }
                    }
                    return response;
                };
            },
        });
    }, options);
    await collector.load(HTML, options.config ?? CONFIG, { internal: true, name: options.platform ?? 'macos' });
    await navigate(page, DETAIL);
    return collector;
}

/** @param {import('@playwright/test').Page} page @param {string} path */
async function navigate(page, path) {
    await page.evaluate((p) => /** @type {any} */ (window).storePushState({}, '', p), path);
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

/** @param {ResultsCollector} collector @param {string} [method] */
async function messages(collector, method) {
    return (await collector.outgoingMessages())
        .map((m) => m.payload)
        .filter((m) => m.featureName === 'chromeWebstorePatching' && (!method || ('method' in m && m.method === method)));
}

test('queries native and sends a CRX download URL on install, without calling the store handler', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'initialSetup')).toEqual([
        expect.objectContaining({ params: {}, context: 'contentScopeScriptsIsolated' }),
    ]);
    expect(await messages(collector, 'getCatalogExtensionIds')).toEqual([
        expect.objectContaining({ params: {}, context: 'contentScopeScriptsIsolated' }),
    ]);
    expect(await messages(collector, 'getExtensionStatus')).toEqual([
        expect.objectContaining({ params: { extensionId: ID }, context: 'contentScopeScriptsIsolated' }),
    ]);
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    const installs = await messages(collector, 'installExtension');
    expect(installs).toHaveLength(1);
    const params = /** @type {any} */ (installs[0]).params;
    expect(params.extensionId).toBe(ID);
    const url = new URL(params.crxUrl);
    expect(url.origin + url.pathname).toBe('https://clients2.google.com/service/update2/crx');
    expect(url.searchParams.get('response')).toBe('redirect');
    expect(url.searchParams.get('acceptformat')).toBe('crx3');
    expect(url.searchParams.get('x')).toBe(`id=${ID}&installsource=ondemand&uc`);
    expect(await page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
});

for (const setupResponse of [{ enabled: false }, { enabled: 'true' }, {}, null]) {
    test(`leaves the page untouched for setup response ${JSON.stringify(setupResponse)}`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { setupResponse });
        await expect.poll(async () => (await messages(collector, 'initialSetup')).length).toBe(1);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
        await expect(page.locator(LABEL)).toHaveCount(0);
        await expect(page.locator(BUTTON)).toBeDisabled();
        // The fixture's original button is disabled; dispatch directly to check
        // that setup did not install an event interceptor.
        await page.locator(BUTTON).dispatchEvent('click');
        expect(await page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(true);
        await navigate(page, OTHER);
        await page.evaluate(() => document.body.append(document.createElement('div')));
        expect(await messages(collector)).toHaveLength(1);
    });
}

test('a rejected setup request leaves the page untouched', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { rejectSetup: true });
    await expect.poll(async () => (await messages(collector, 'initialSetup')).length).toBe(1);
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
    expect(await messages(collector)).toHaveLength(1);
});

test('waits for setup before patching or subscribing', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { holdSetup: true });
    await expect.poll(() => page.evaluate(() => typeof (/** @type {any} */ (window).completeSetup))).toBe('function');
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
    expect(await messages(collector)).toHaveLength(1);
    await page.evaluate(() => /** @type {any} */ (window).completeSetup());
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'initialSetup')).toHaveLength(1);
});

for (const key of ['Enter', 'Space']) {
    test(`keyboard ${key} installs once via native`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.locator(BUTTON).focus();
        await page.keyboard.press(key);
        await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
        expect(await messages(collector, 'installExtension')).toHaveLength(1);
        expect(await page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
    });
}

test('installed extension removes through native and becomes installable again', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { status: 'installed' });
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'removeExtension')).toEqual([expect.objectContaining({ params: { extensionId: ID } })]);
    expect(await messages(collector, 'installExtension')).toHaveLength(0);
});

for (const failure of [{ fail: true }, { rejectAction: true }]) {
    test(`failed/cancelled operation restores actual native status: ${JSON.stringify(failure)}`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, failure);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.locator(BUTTON).click();
        await expect.poll(async () => (await messages(collector, 'getExtensionStatus')).length).toBe(2);
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.locator(BUTTON).click();
        await expect.poll(async () => (await messages(collector, 'installExtension')).length).toBe(2);
    });
}

test('pending install blocks duplicates and its completion cannot patch an unrelated page', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { hold: true });
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.locator(BUTTON).click();
    await expect(page.locator(BUTTON)).not.toBeVisible();
    await page.locator(BUTTON).dispatchEvent('click');
    await navigate(page, OTHER);
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await page.waitForFunction(() => typeof (/** @type {any} */ (window).completeOperation) === 'function');
    await page.evaluate(() => /** @type {any} */ (window).completeOperation());
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await navigate(page, DETAIL);
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    expect(await messages(collector, 'installExtension')).toHaveLength(1);
});

test('synthetic activation cannot install or reach the store handler', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.locator(BUTTON).dispatchEvent('click');
    await page.locator(BUTTON).dispatchEvent('keydown', { key: 'Enter' });
    expect(await messages(collector, 'installExtension')).toHaveLength(0);
    expect(await page.evaluate(() => /** @type {any} */ (window).__installClicked)).toBe(false);
});

for (const options of [{ status: 'unknown' }, { status: 7 }, { rejectStatus: true }]) {
    test(`missing or invalid native status keeps the button hidden: ${JSON.stringify(options)}`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, options);
        await expect.poll(async () => (await messages(collector, 'getExtensionStatus')).length).toBe(1);
        await expect(page.locator(BUTTON)).not.toBeVisible();
        expect(await messages(collector, 'installExtension')).toHaveLength(0);
    });
}

test('non-catalog extensions never query native status or install', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    const before = (await messages(collector)).filter((m) => !('method' in m && m.method === 'getCatalogExtensionIds'));
    await navigate(page, OTHER);
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await expect(page.locator(BUTTON)).toBeDisabled();
    await page.locator(BUTTON).dispatchEvent('click');
    expect(await messages(collector, 'getCatalogExtensionIds')).toHaveLength(2);
    expect((await messages(collector)).filter((m) => !('method' in m && m.method === 'getCatalogExtensionIds'))).toEqual(before);
});

// Native answers [] when extension management is off; rollout, minimum version
// and native-only gates all surface as "not in the list"
for (const extensionIds of [[], ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']]) {
    test(`native catalog ${JSON.stringify(extensionIds)} → unsupported pill, no status query`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, { catalogReply: { extensionIds } });
        await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
        await expect(page.locator(BUTTON)).toBeDisabled();
        await page.locator(BUTTON).dispatchEvent('click');
        expect(await messages(collector, 'getExtensionStatus')).toHaveLength(0);
        expect(await messages(collector, 'installExtension')).toHaveLength(0);
    });
}

// An unknown catalog is not an empty one: showing "Unsupported extension"
// here would mislabel catalog extensions whenever native misbehaves
for (const [label, options, log] of /** @type {const} */ ([
    ['error reply', { catalogFailure: 'error' }, LOG_CATALOG_ERROR],
    ['no reply', { catalogFailure: 'none' }, LOG_CATALOG_UNUSABLE],
    ['extensionIds missing', { catalogReply: {} }, LOG_CATALOG_UNUSABLE],
    ['non-string entries', { catalogReply: { extensionIds: [ID, 42] } }, LOG_CATALOG_UNUSABLE],
])) {
    test(`unknown native catalog (${label}) → button stays hidden, no unsupported pill`, async ({ page }, testInfo) => {
        const failed = waitForFeatureLog(page, log);
        const collector = await setup(page, testInfo, options);
        await failed;
        await expect(page.locator(BUTTON)).not.toBeVisible();
        await expect(page.locator(LABEL)).toHaveCount(0);
        expect(await messages(collector, 'getExtensionStatus')).toHaveLength(0);
    });
}

test('catalog is not cached: an extension dropped from it becomes unsupported on re-evaluation', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.evaluate(() => {
        /** @type {any} */ (window).__playwright_01.mockResponses.getCatalogExtensionIds = { extensionIds: [] };
    });
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await page.locator(BUTTON).dispatchEvent('click');
    expect(await messages(collector, 'getCatalogExtensionIds')).toHaveLength(2);
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(1);
    expect(await messages(collector, 'installExtension')).toHaveLength(0);
});

test('late status from an earlier visit cannot overwrite the latest visit to the same extension', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await navigate(page, OTHER);
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await page.evaluate(() => {
        // The transport captures postMessage on first use, so control the
        // existing mock rather than replacing the already-captured method.
        /** @type {any} */ (window).holdNextStatus = true;
    });
    await navigate(page, DETAIL);
    await page.waitForFunction(() => typeof (/** @type {any} */ (window).releaseStatus) === 'function');
    await navigate(page, OTHER);
    // The old unsupported label remains in the hidden button while A's status
    // is pending. Wait for B to be evaluated, not merely for that stale text.
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await page.evaluate(() => {
        /** @type {any} */ (window).__playwright_01.mockResponses.getExtensionStatus = { status: 'installed' };
    });
    await navigate(page, DETAIL);
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    await page.evaluate(() => /** @type {any} */ (window).releaseStatus());
    // A subsequent action must still be removal, never installation.
    await page.locator(BUTTON).click();
    await expect.poll(async () => (await messages(collector, 'removeExtension')).length).toBe(1);
    expect(await messages(collector, 'installExtension')).toHaveLength(0);
});

test('store re-renders retain native-backed button behavior', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.getByRole('button', { name: 'Re-render install button' }).click();
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    expect(await messages(collector, 'installExtension')).toHaveLength(1);
});

for (const config of ['config-gate-disabled', 'config-feature-disabled', 'config-minimal']) {
    test(`${config} makes macOS inert`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo, {
            config: `./integration-test/test-pages/chrome-webstore-patching/config/${config}.json`,
        });
        await expect(page.locator(BUTTON)).toBeVisible();
        await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
        expect(await messages(collector)).toHaveLength(0);
    });
}

test('shared Apple bundle leaves iOS inert', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { platform: 'ios' });
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
    expect(await messages(collector)).toHaveLength(0);
});

test('Apple page-world bundle does not patch the store or send native requests', async ({ page }) => {
    const collector = ResultsCollector.create(page, { injectName: 'apple', platform: 'macos' });
    await collector.load(HTML, CONFIG, { internal: true });
    await page.evaluate((path) => history.pushState({}, '', path), DETAIL);
    await expect(page.locator(BUTTON)).toBeVisible();
    await expect(page.locator(BUTTON)).toHaveText('Add to Chrome');
    expect(await messages(collector)).toHaveLength(0);
});

test('page-world replaceState without DOM mutations refreshes the isolated feature', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.evaluate((path) => /** @type {any} */ (window).storeReplaceState({}, '', path), OTHER);
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    await page.evaluate((path) => /** @type {any} */ (window).storeReplaceState({}, '', path), DETAIL);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(2);
});

test('DOM changes detect page-world navigation before the URL polling interval', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo);
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.evaluate((path) => {
        /** @type {any} */ (window).storePushState({}, '', path);
        document.body.append(document.createElement('div'));
    }, OTHER);
    // The catalog request proves re-evaluation started with the polling timer
    // paused; the mocked reply itself needs the clock running.
    await expect.poll(async () => (await messages(collector, 'getCatalogExtensionIds')).length).toBe(2);
    await page.clock.resume();
    await expect(page.locator(LABEL)).toHaveText('Unsupported extension');
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(1);
});

for (const status of ['installed', 'unsupported', 'unknown']) {
    test(`extensionChanged re-queries the supplied ID and reflects ${status}`, async ({ page }, testInfo) => {
        const collector = await setup(page, testInfo);
        await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
        await page.evaluate((status) => {
            /** @type {any} */ (window).__playwright_01.mockResponses.getExtensionStatus = { status };
        }, status);

        await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });

        await expect.poll(async () => (await messages(collector, 'getExtensionStatus')).length).toBe(2);
        expect((await messages(collector, 'getExtensionStatus'))[1]).toEqual(expect.objectContaining({ params: { extensionId: ID } }));
        if (status === 'unknown') {
            await expect(page.locator(BUTTON)).toBeHidden();
        } else {
            await expect(page.locator(LABEL)).toHaveText(status === 'installed' ? 'Remove from DuckDuckGo' : 'Unsupported extension');
        }
        expect(await messages(collector, 'installExtension')).toHaveLength(0);
        expect(await messages(collector, 'removeExtension')).toHaveLength(0);
    });
}

test('external removal refreshes the current extension and allows reinstalling', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { status: 'installed' });
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    await page.evaluate(() => {
        /** @type {any} */ (window).__playwright_01.mockResponses.getExtensionStatus = { status: 'installable' };
    });
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(2);
    expect(await messages(collector, 'removeExtension')).toHaveLength(0);
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    expect(await messages(collector, 'installExtension')).toHaveLength(1);
});

test('change notifications ignore other IDs, malformed payloads and non-detail pages', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { status: 'installed' });
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    for (const payload of [{ extensionId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, {}, { extensionId: null }, null]) {
        await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', /** @type {any} */ (payload));
    }
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(1);
    await navigate(page, '/category/extensions');
    await expect(page.locator(BUTTON)).toBeHidden();
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect(page.locator(BUTTON)).toBeHidden();
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(1);
});

test('change notification invalidates an older installed status response', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { status: 'installed' });
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    await page.evaluate(() => {
        /** @type {any} */ (window).holdNextStatus = true;
    });
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect.poll(() => page.evaluate(() => typeof (/** @type {any} */ (window).releaseStatus))).toBe('function');
    await page.evaluate(() => {
        /** @type {any} */ (window).__playwright_01.mockResponses.getExtensionStatus = { status: 'installable' };
    });
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    await page.evaluate(() => /** @type {any} */ (window).releaseStatus());
    await page.locator(BUTTON).click();
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    expect(await messages(collector, 'installExtension')).toHaveLength(1);
    expect(await messages(collector, 'removeExtension')).toHaveLength(0);
});

test('change notification cannot reveal a button while its operation is pending', async ({ page }, testInfo) => {
    const collector = await setup(page, testInfo, { status: 'installed', hold: true });
    await expect(page.locator(LABEL)).toHaveText('Remove from DuckDuckGo');
    await page.locator(BUTTON).click();
    await expect.poll(() => page.evaluate(() => typeof (/** @type {any} */ (window).completeOperation))).toBe('function');
    await collector.simulateSubscriptionMessage('chromeWebstorePatching', 'extensionChanged', { extensionId: ID });
    await expect(page.locator(BUTTON)).toBeHidden();
    expect(await messages(collector, 'getExtensionStatus')).toHaveLength(1);
    await page.evaluate(() => /** @type {any} */ (window).completeOperation());
    await expect(page.locator(LABEL)).toHaveText('Add to DuckDuckGo');
    expect(await messages(collector, 'removeExtension')).toHaveLength(1);
});
