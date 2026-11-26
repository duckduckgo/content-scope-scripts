import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const CONFIG = readFileSync('integration-test/test-pages/message-bridge/config/message-bridge-enabled.json', 'utf8');
/** @param {string} path */
const bundle = (path) =>
    readFileSync(path, 'utf8')
        .replace('$BUNDLED_CONFIG$', () => CONFIG)
        .replace('$TRACKER_LOOKUP$', '{}');
const MAIN = bundle('../build/chrome-mv3/inject.js');
const ISOLATED = bundle('../build/chrome-mv3/isolated.js');

// Both bundles share one world; the mock stands in for chrome.runtime and the extension's content script.
function mockExtension() {
    const site = { domain: location.hostname, isBroken: false, allowlisted: false };

    addEventListener('ddg-secret', (e) => {
        const argumentsObject = {
            platform: { name: 'extension' },
            site: { ...site, enabledFeatures: ['navigatorInterface'] },
            featureSettings: {},
        };
        dispatchEvent(
            new CustomEvent(/** @type {CustomEvent} */ (e).detail, { detail: JSON.stringify({ type: 'register', argumentsObject }) }),
        );
    });

    /** @type {any[]} */
    const outgoing = [];
    /** @type {((msg: any) => void)[]} */
    const listeners = [];
    const port = {
        onMessage: { addListener: (/** @type {any} */ fn) => listeners.push(fn) },
        onDisconnect: { addListener() {}, removeListener() {} },
        postMessage(/** @type {any} */ msg) {
            outgoing.push(msg);
            const { context, featureName, id } = msg;
            if (id) setTimeout(() => listeners.forEach((fn) => fn({ context, featureName, id, result: { ghi: 'jkl' } })));
        },
    };

    /** @type {any} */ (window).chrome = {
        runtime: {
            onMessage: { addListener() {} },
            connect: () => port,
            sendMessage: (/** @type {any} */ _msg, /** @type {(args: any) => void} */ cb) =>
                setTimeout(() =>
                    cb({
                        platform: { name: 'extension' },
                        site: { ...site, enabledFeatures: ['messageBridge'] },
                        featureSettings: { messageBridge: { exampleFeature: 'enabled' } },
                    }),
                ),
        },
    };
    /** @type {any} */ (window).__outgoing = outgoing;
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function requestSampleData(page) {
    await page.waitForFunction(
        () => {
            try {
                return Boolean(/** @type {any} */ (navigator).duckduckgo?.createMessageBridge?.('exampleFeature'));
            } catch {
                return false;
            }
        },
        null,
        { timeout: 2000 },
    );
    const result = await page.evaluate(() =>
        /** @type {any} */ (navigator).duckduckgo.createMessageBridge('exampleFeature').request('sampleData'),
    );
    const outgoing = await page.evaluate(() => /** @type {any} */ (window).__outgoing);
    return { result, outgoing };
}

const EXPECTED_OUTGOING = [{ context: 'contentScopeScripts', featureName: 'exampleFeature', method: 'sampleData' }];

test('bridge works when the isolated script runs first', async ({ page }) => {
    await page.addInitScript(mockExtension);
    await page.addInitScript({ content: ISOLATED });
    await page.addInitScript({ content: MAIN });
    await page.goto('/blank.html');

    const { result, outgoing } = await requestSampleData(page);

    expect(result).toStrictEqual({ ghi: 'jkl' });
    expect(outgoing).toMatchObject(EXPECTED_OUTGOING);
});

test('bridge works when the main world script runs first', async ({ page }) => {
    await page.addInitScript(mockExtension);
    await page.addInitScript({ content: MAIN });
    await page.addInitScript({ content: ISOLATED });
    await page.goto('/blank.html');

    const { result, outgoing } = await requestSampleData(page);

    expect(result).toStrictEqual({ ghi: 'jkl' });
    expect(outgoing).toMatchObject(EXPECTED_OUTGOING);
});
