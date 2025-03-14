import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/favicon/index.html';
const CONFIG = './integration-test/test-pages/favicon/config/favicon-enabled.json';

test('favicon feature absent', async ({ page }, testInfo) => {
    const CONFIG = './integration-test/test-pages/favicon/config/favicon-absent.json';
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    const messages = await favicon.waitForMessage('faviconFound', 1);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: './favicon.png', rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });
});

test('favicon + monitor', async ({ page }, testInfo) => {
    const favicon = ResultsCollector.create(page, testInfo.project.use);
    await favicon.load(HTML, CONFIG);

    // ensure first favicon item was sent
    await favicon.waitForMessage('faviconFound', 1);

    // now update it
    await page.getByRole('button', { name: 'Set override' }).click();

    // wait for the second message
    const messages = await favicon.waitForMessage('faviconFound', 2);

    expect(messages[0].payload.params).toStrictEqual({
        favicons: [{ href: './favicon.png', rel: 'shortcut icon' }],
        documentUrl: 'http://localhost:3220/favicon/index.html',
    });

    expect(messages[1].payload.params).toStrictEqual({
        favicons: [{ href: './new_favicon.png', rel: 'shortcut icon' }],
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

    //
    await expect(page.locator('link')).toHaveAttribute('href', './new_favicon.png');

    // account for the debounce
    await page.clock.fastForward(200);

    // ensure only 1 message was still sent (ie: the monitor is disabled)
    const messages = await favicon.outgoingMessages();
    expect(messages).toHaveLength(1);
});
