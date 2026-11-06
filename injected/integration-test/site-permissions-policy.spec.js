import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/site-permissions/index.html';
const CONFIG_ENABLED = './integration-test/test-pages/site-permissions/config/policy-enabled.json';
const CONFIG_NOT_CONFIGURED = './integration-test/test-pages/site-permissions/config/not-configured.json';
// The collector's default `messageSecret`; bridge event names between the two features include it.
const MESSAGE_SECRET = 'duckduckgo-android-messaging-secret';
const PAGE_DOCUMENT_ID = 'b'.repeat(32);

/**
 * Answers the policy feature's identity requests as the page feature does.
 * @param {import('@playwright/test').Page} page
 */
async function announcePageDocument(page) {
    await page.evaluate(
        ({ secret, documentID }) => {
            const announce = () =>
                window.dispatchEvent(new CustomEvent(`ddg-site-permissions-geolocation-document-${secret}`, { detail: documentID }));
            window.addEventListener(`ddg-site-permissions-geolocation-document-request-${secret}`, announce);
            announce();
        },
        { secret: MESSAGE_SECRET, documentID: PAGE_DOCUMENT_ID },
    );
}

/**
 * Calls the delivery subscription the way native code does and returns the acknowledgement.
 * @param {import('@playwright/test').Page} page
 * @param {unknown} documentID
 */
async function deliver(page, documentID) {
    return await page.evaluate(
        ({ secret, documentID }) => {
            /** @type {unknown[]} */
            const received = [];
            window.addEventListener(`ddg-site-permissions-geolocation-deliver-${secret}`, (event) => {
                received.push(JSON.parse(/** @type {CustomEvent} */ (event).detail));
                event.preventDefault();
            });
            const acknowledged = navigator.duckduckgo?.messageHandlers?.geolocationDeliver?.({
                context: 'contentScopeScriptsIsolated',
                featureName: 'sitePermissionsGeolocationPolicy',
                subscriptionName: 'geolocationDeliver',
                params: { documentID, subscriptionName: 'geolocationWatchResult', params: { requestID: 'x:1' } },
            });
            return { acknowledged, received };
        },
        { secret: MESSAGE_SECRET, documentID },
    );
}

/**
 * Calls the policy subscription the way native code does and returns what it resolves to.
 * @param {import('@playwright/test').Page} page
 */
async function requestConstraints(page) {
    return await page.evaluate(async () => {
        const handler = navigator.duckduckgo?.messageHandlers?.geolocationPolicyConstraints;
        if (typeof handler !== 'function') return null;
        return await handler({
            context: 'contentScopeScriptsIsolated',
            featureName: 'sitePermissionsGeolocationPolicy',
            subscriptionName: 'geolocationPolicyConstraints',
            params: {},
        });
    });
}

test.describe('sitePermissionsGeolocationPolicy', () => {
    test('does not subscribe without the native signing token', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_NOT_CONFIGURED);

        expect(await requestConstraints(page)).toBeNull();
    });

    test('resolves the top-level document constraints with both document identities', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ENABLED);
        await announcePageDocument(page);

        const constraints = await requestConstraints(page);
        expect(constraints).toEqual({
            documentID: expect.stringMatching(/^[0-9a-f]{32}$/),
            pageDocumentID: PAGE_DOCUMENT_ID,
            isSecureContext: true,
            isPolicyAllowed: true,
            isSandboxed: false,
        });
        expect(await requestConstraints(page)).toEqual(constraints);
    });

    test('forwards a delivery to the page feature only for its own document', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ENABLED);
        const constraints = /** @type {{ documentID: string }} */ (await requestConstraints(page));

        expect(await deliver(page, 'c'.repeat(32))).toEqual({ acknowledged: false, received: [] });
        expect(await deliver(page, constraints.documentID)).toEqual({
            acknowledged: true,
            received: [{ subscriptionName: 'geolocationWatchResult', params: { requestID: 'x:1' } }],
        });
    });

    test('leaves no global for native code to read', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo.project.use);
        await collector.load(HTML, CONFIG_ENABLED);

        expect(await page.evaluate(() => '__ddgSitePermissionsGeolocationPolicy' in window)).toBe(false);
    });
});
