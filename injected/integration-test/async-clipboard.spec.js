import { gotoAndWait, testContextForExtension } from './helpers/harness.js';
import { test as base, expect } from '@playwright/test';

const test = testContextForExtension(base);

const HTML = '/webcompat/pages/async-clipboard.html';

/**
 * The state that the test page records for us.
 *
 * @typedef {Window & typeof globalThis & {
 *     clipboardResults: Record<string, { status: string, value?: unknown, name?: string, message?: string }>,
 *     nativeClipboard: Clipboard
 * }} ClipboardTestWindow
 */

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} [platformName]
 */
async function load(page, platformName = 'windows') {
    await gotoAndWait(page, HTML, {
        platform: { name: platformName },
        site: { enabledFeatures: ['webCompat'] },
        featureSettings: {
            webCompat: {
                asyncClipboard: 'enabled',
            },
        },
    });
}

/**
 * The integration build marks every shimmed class, which is how we tell our
 * implementation apart from the browser's own.
 */
function isShimmed() {
    const mark = globalThis.ddgShimMark;
    if (!mark) return false;
    return globalThis.Clipboard[mark] === true && globalThis.ClipboardItem[mark] === true;
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} name - key under `window.clipboardResults`
 */
async function clipboardResult(page, name) {
    await page.waitForFunction((key) => key in /** @type {ClipboardTestWindow} */ (window).clipboardResults, name);
    return await page.evaluate((key) => /** @type {ClipboardTestWindow} */ (window).clipboardResults[key], name);
}

test.describe('Async Clipboard API shim', () => {
    // The tests below share one system clipboard, so they must not run at the same time.
    test.describe.configure({ mode: 'serial' });

    test('is not installed on other platforms', async ({ page }) => {
        await load(page, 'extension');
        expect(await page.evaluate(isShimmed)).toBe(false);
    });

    test('is installed on windows when the API is missing', async ({ page }) => {
        await load(page);
        expect(await page.evaluate(isShimmed)).toBe(true);

        const api = await page.evaluate(() => {
            return {
                isClipboard: navigator.clipboard instanceof Clipboard,
                methods: ['read', 'readText', 'write', 'writeText'].map((name) => typeof navigator.clipboard[name]),
                clipboardToString: Clipboard.toString(),
                writeTextToString: navigator.clipboard.writeText.toString(),
                clipboardItemToString: ClipboardItem.toString(),
                supportsPlainText: ClipboardItem.supports('text/plain'),
                supportsHtml: ClipboardItem.supports('text/html'),
                supportsPng: ClipboardItem.supports('image/png'),
            };
        });

        expect(api.isClipboard).toBe(true);
        expect(api.methods).toEqual(['function', 'function', 'function', 'function']);
        expect(api.clipboardToString).toEqual('function Clipboard() { [native code] }');
        expect(api.writeTextToString).toEqual('function writeText() { [native code] }');
        expect(api.clipboardItemToString).toEqual('function ClipboardItem() { [native code] }');
        expect(api.supportsPlainText).toBe(true);
        expect(api.supportsHtml).toBe(true);
        expect(api.supportsPng).toBe(false);
    });

    test('keeps the descriptor shape of the original navigator.clipboard', async ({ page }) => {
        await load(page);
        const descriptors = await page.evaluate(() => {
            const entry = globalThis.origPropDescriptors.find(([, propertyName]) => propertyName === 'clipboard');
            const [host, propertyName, original] = entry;
            const current = Object.getOwnPropertyDescriptor(host, propertyName);
            const shape = (descriptor) =>
                Object.keys(descriptor)
                    .sort()
                    .map((key) => `${key}:${typeof descriptor[key] === 'function' ? 'function' : descriptor[key]}`);
            return { original: shape(original), current: shape(current) };
        });
        expect(descriptors.current).toEqual(descriptors.original);
    });

    test('Clipboard cannot be constructed', async ({ page }) => {
        await load(page);
        const error = await page.evaluate(() => {
            try {
                // eslint-disable-next-line no-new
                new Clipboard();
                return null;
            } catch (e) {
                return { name: e.name, message: e.message };
            }
        });
        expect(error).toEqual({ name: 'TypeError', message: 'Illegal constructor' });
    });

    test('writeText puts plain text on the system clipboard', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await load(page);

        // A real click, so the deprecated copy command sees a user gesture.
        await page.click('#write-text');
        expect(await clipboardResult(page, 'writeText')).toEqual({ status: 'fulfilled', value: null });

        // Read it back with the browser's own implementation, captured before we shimmed it.
        const text = await page.evaluate(() => /** @type {ClipboardTestWindow} */ (window).nativeClipboard.readText());
        expect(text).toEqual('copied by the shim');
    });

    test('write puts every supported format of a ClipboardItem on the system clipboard', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await load(page);

        await page.click('#write-item');
        expect(await clipboardResult(page, 'write')).toEqual({ status: 'fulfilled', value: null });

        const contents = await page.evaluate(async () => {
            const [item] = await /** @type {ClipboardTestWindow} */ (window).nativeClipboard.read();
            /** @type {Record<string, string>} */
            const out = {};
            for (const type of item.types) {
                out[type] = await (await item.getType(type)).text();
            }
            return out;
        });
        expect(contents['text/plain']).toEqual('plain from the shim');
        expect(contents['text/html']).toContain('<b>rich from the shim</b>');
    });

    test('readText rejects when the browser refuses the paste command', async ({ page }) => {
        await load(page);

        // Chromium only enables the deprecated paste command for embedders that opt in,
        // so in this test browser the shim reports the same failure as a denied permission.
        await page.click('#read-text');
        const result = await clipboardResult(page, 'readText');
        expect(result.status).toEqual('rejected');
        expect(result.name).toEqual('NotAllowedError');
    });
});
