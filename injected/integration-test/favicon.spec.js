import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/favicon/index.html';
const CONFIG = './integration-test/test-pages/favicon/config/favicon-enabled.json';

test('favicon feature absent', async ({ page, baseURL }, testInfo) => {
    const CONFIG = './integration-test/test-pages/favicon/config/favicon-absent.json';
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    const messages = await favicon.waitForMessage('faviconFound', 1);
    const url = new URL('/favicon/favicon.png', baseURL);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: url.href, rel: 'shortcut icon' }],
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
        favicons: [{ href: url1.href, rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(messages[1].payload.params).toStrictEqual({
        favicons: [{ href: url2.href, rel: 'shortcut icon' }],
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
        favicons: [{ href: url1.href, rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(messages[1].payload.params).toStrictEqual({
        favicons: [
            { href: url1.href, rel: 'shortcut icon' },
            { href: url2.href, rel: 'shortcut icon' },
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

    // No mutation has happened yet (the first update is after a 40ms timeout),
    // so we should still only have the initial message.
    {
        const messages = (await favicon.outgoingMessages()).filter((x) => x.payload.method === 'faviconFound');
        expect(messages).toHaveLength(1);
    }

    // `setManyOverrides()` performs 100 updates, each separated by 40ms (4 seconds total).
    // Fast-forward beyond the full sequence plus debounce, then assert on first + final payloads.
    await page.clock.fastForward(4500);
    await favicon.waitForMessage('faviconFound', 2);

    const url1 = new URL('/favicon/favicon.png', baseURL);
    const urlLast = new URL('/favicon/new_favicon.png?count=99', baseURL);

    const faviconMessages = (await favicon.outgoingMessages())
        .filter((x) => x.payload.method === 'faviconFound')
        .map((x) => /** @type {{params: any}} */ (x.payload).params);

    expect(faviconMessages[0]).toStrictEqual({
        favicons: [{ href: url1.href, rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(faviconMessages.at(-1)).toStrictEqual({
        favicons: [{ href: urlLast.href, rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });
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
