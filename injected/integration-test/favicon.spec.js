import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/favicon/index.html';
const SVG_HTML = '/favicon/svg-test.html';
const CONFIG = './integration-test/test-pages/favicon/config/favicon-enabled.json';

test('favicon feature absent', async ({ page, baseURL }, testInfo) => {
    const CONFIG = './integration-test/test-pages/favicon/config/favicon-absent.json';
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    const messages = await favicon.waitForMessage('faviconFound', 1);
    const url = new URL('/favicon/favicon.png', baseURL);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: url.href, rel: 'shortcut icon', type: '' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });
});

test('favicon + monitor', async ({ page, baseURL }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    await favicon.waitForMessage('faviconFound', 1);

    // now update it
    await page.getByRole('button', { name: 'Set override' }).click();

    // wait for the second message
    const messages = await favicon.waitForMessage('faviconFound', 2);

    const url1 = new URL('/favicon/favicon.png', baseURL);
    const url2 = new URL('/favicon/new_favicon.png', baseURL);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: url1.href, rel: 'shortcut icon', type: '' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(messages[1].payload.params).toStrictEqual({
        favicons: [{ href: url2.href, rel: 'shortcut icon', type: '' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });
});

test('favicon + monitor + newly added links', async ({ page, baseURL }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    await favicon.waitForMessage('faviconFound', 1);

    // now cause a new item to be added
    await page.getByRole('button', { name: 'Add new' }).click();

    // wait for the second message
    const messages = await favicon.waitForMessage('faviconFound', 2);

    const url1 = new URL('/favicon/favicon.png', baseURL);
    const url2 = new URL('/favicon/new_favicon.png', baseURL);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: url1.href, rel: 'shortcut icon', type: '' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(messages[1].payload.params).toStrictEqual({
        favicons: [
            { href: url1.href, rel: 'shortcut icon', type: '' },
            { href: url2.href, rel: 'shortcut icon', type: '' },
        ],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });
});

test('favicon + monitor (many updates)', async ({ page, baseURL }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await page.clock.install();
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    await favicon.waitForMessage('faviconFound', 1);

    // now update it
    await page.getByRole('button', { name: 'Set many overrides' }).click();
    await page.clock.fastForward(20);

    const messages = await favicon.outgoingMessages();
    expect(messages).toHaveLength(1);

    await page.clock.fastForward(60);
    await page.clock.fastForward(100);

    {
        const messages = await favicon.outgoingMessages();
        expect(messages).toHaveLength(3);
    }

    {
        const url1 = new URL('/favicon/favicon.png', baseURL);
        const url2 = new URL('/favicon/new_favicon.png?count=0', baseURL);
        const url3 = new URL('/favicon/new_favicon.png?count=1', baseURL);

        const messages = await favicon.outgoingMessages();
        expect(messages.map((x) => /** @type {{params: any}} */ (x.payload).params)).toStrictEqual([
            {
                favicons: [{ href: url1.href, rel: 'shortcut icon', type: '' }],
                documentUrl: 'http://localhost:3220/favicon/index.html',
            },
            {
                favicons: [{ href: url2.href, rel: 'shortcut icon', type: '' }],
                documentUrl: 'http://localhost:3220/favicon/index.html',
            },
            {
                favicons: [{ href: url3.href, rel: 'shortcut icon', type: '' }],
                documentUrl: 'http://localhost:3220/favicon/index.html',
            },
        ]);
    }
});

test('favicon + monitor disabled', async ({ page }, testInfo) => {
    const CONFIG = './integration-test/test-pages/favicon/config/favicon-monitor-disabled.json';
    const favicon = ResultsCollector.create(page, testInfo.project.use);

    await page.clock.install();

    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    await favicon.waitForMessage('faviconFound', 1);

    // now update it
    await page.getByRole('button', { name: 'Set override' }).click();

    await expect(page.locator('link')).toHaveAttribute('href', './new_favicon.png');

    // account for the debounce
    await page.clock.fastForward(200);

    // ensure only 1 message was still sent (ie: the monitor is disabled)
    const messages = await favicon.outgoingMessages();
    expect(messages).toHaveLength(1);
});

test('favicon feature disabled completely', async ({ page }, testInfo) => {
    const CONFIG = './integration-test/test-pages/favicon/config/favicon-disabled.json';
    const favicon = ResultsCollector.create(page, testInfo.project.use);

    await favicon.load(HTML, CONFIG);

    // this is here purely to guard against a false positive in this test.
    // without this manual `wait`, it might be possible for the following assertion to
    // pass, but just because it was too quick (eg: the first message wasn't sent yet)
    await page.waitForTimeout(100);

    const messages = await favicon.outgoingMessages();
    expect(messages).toHaveLength(0);
});

test('favicon filters SVGs on iOS platform', async ({ page, baseURL }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    // Load the SVG test page with iOS platform override
    await favicon.load(SVG_HTML, CONFIG, { name: 'ios' });

    const messages = await favicon.waitForMessage('faviconFound', 1);

    const pngUrl = new URL('/favicon/favicon.png', baseURL);
    const appleTouchUrl = new URL('/favicon/apple-touch-icon.png', baseURL);

    // SVG favicon should be filtered out on iOS, only PNG and apple-touch-icon should remain
    expect(messages[0].payload.params).toStrictEqual({
        favicons: [
            { href: pngUrl.href, rel: 'icon', type: 'image/png' },
            { href: appleTouchUrl.href, rel: 'apple-touch-icon', type: '' },
        ],
        documentUrl: 'http://localhost:3220/favicon/svg-test.html',
    });
});

test('favicon includes SVGs on non-iOS platforms', async ({ page, baseURL }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    // Load the SVG test page with macOS platform (default for apple-isolated)
    await favicon.load(SVG_HTML, CONFIG);

    const messages = await favicon.waitForMessage('faviconFound', 1);

    const pngUrl = new URL('/favicon/favicon.png', baseURL);
    const svgUrl = new URL('/favicon/favicon.svg', baseURL);
    const appleTouchUrl = new URL('/favicon/apple-touch-icon.png', baseURL);

    // On non-iOS platforms, all favicons including SVG should be present
    expect(messages[0].payload.params).toStrictEqual({
        favicons: [
            { href: pngUrl.href, rel: 'icon', type: 'image/png' },
            { href: svgUrl.href, rel: 'icon', type: 'image/svg+xml' },
            { href: appleTouchUrl.href, rel: 'apple-touch-icon', type: '' },
        ],
        documentUrl: 'http://localhost:3220/favicon/svg-test.html',
    });
});
