import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { OmnibarService } from '../omnibar.service.js';

/**
 * Minimal fake NewTabPage exposing just the `messaging.request` surface the
 * tab-attachment bridge methods use. Records the last request so we can assert
 * on the message name and params.
 *
 * @param {unknown} response - value the stubbed `request` resolves to.
 */
function createFakeNtp(response) {
    const calls = /** @type {{ name: string, params: any }[]} */ ([]);
    const ntp = {
        messaging: {
            /** @param {string} name @param {any} [params] */
            request(name, params) {
                calls.push({ name, params });
                return Promise.resolve(response);
            },
            subscribe() {
                return () => {};
            },
            notify() {},
        },
    };
    return { ntp: /** @type {any} */ (ntp), calls };
}

/** @type {import('../../../types/new-tab.js').PageContext} */
const samplePageContext = {
    tabId: 'tab-1',
    title: 'MacBook Neo - Apple',
    url: 'https://apple.com/macbook',
    favicon: { src: 'https://apple.com/favicon.ico', maxAvailableSize: 64 },
    content: '## MacBook Neo\n\nMarkdown content...',
    truncated: false,
    fullContentLength: 4200,
};

test.describe('OmnibarService.getOpenTabs', () => {
    test('requests omnibar_getOpenTabs and returns the response', async () => {
        const tabs = [{ tabId: 'tab-1', title: 'Apple', url: 'https://apple.com', favicon: null }];
        const { ntp, calls } = createFakeNtp({ tabs });
        const service = new OmnibarService(ntp);

        const result = await service.getOpenTabs();

        equal(calls.length, 1);
        equal(calls[0].name, 'omnibar_getOpenTabs');
        deepEqual(result, { tabs });
    });
});

test.describe('OmnibarService.getTabContent', () => {
    test('requests omnibar_getTabContent with the tabId param', async () => {
        const { ntp, calls } = createFakeNtp({ pageContext: samplePageContext });
        const service = new OmnibarService(ntp);

        await service.getTabContent('tab-1');

        equal(calls.length, 1);
        equal(calls[0].name, 'omnibar_getTabContent');
        deepEqual(calls[0].params, { tabId: 'tab-1' });
    });

    test('unwraps and returns pageContext when present', async () => {
        const { ntp } = createFakeNtp({ pageContext: samplePageContext });
        const service = new OmnibarService(ntp);

        const result = await service.getTabContent('tab-1');

        deepEqual(result, samplePageContext);
    });

    test('returns null when the response is null', async () => {
        const { ntp } = createFakeNtp(null);
        const service = new OmnibarService(ntp);

        equal(await service.getTabContent('tab-1'), null);
    });

    test('returns null when the response omits pageContext', async () => {
        const { ntp } = createFakeNtp({});
        const service = new OmnibarService(ntp);

        equal(await service.getTabContent('tab-1'), null);
    });

    test('returns null when pageContext is explicitly null', async () => {
        const { ntp } = createFakeNtp({ pageContext: null });
        const service = new OmnibarService(ntp);

        equal(await service.getTabContent('tab-broken'), null);
    });
});
