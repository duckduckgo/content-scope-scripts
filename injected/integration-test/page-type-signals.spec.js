import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

const HTML = '/page-context/pages/page-type-signals.html';
const CONFIG = './integration-test/test-pages/page-context/config/page-type-signals.json';

/**
 * Return the page-type signals from the first collectionResult message that carries them.
 * @param {ResultsCollector} collector
 */
async function collectedSignals(collector) {
    const messages = await collector.waitForMessage('collectionResult', 1);
    for (const message of messages) {
        const params = /** @type {{ serializedPageData?: string }} */ (message.payload.params);
        if (!params?.serializedPageData) continue;
        const data = JSON.parse(params.serializedPageData);
        if (data.pageTypeSignals) return data.pageTypeSignals;
    }
    return null;
}

test('page-context collects page-type signals end-to-end', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(HTML, CONFIG);

    const signals = await collectedSignals(collector);

    // jsonLdType is collected in priority order (Recipe before the embedded VideoObject); the
    // second block uses non-canonical casing to exercise case-insensitive discovery.
    expect(signals).toStrictEqual({
        jsonLdType: ['Recipe', 'NewsArticle', 'VideoObject'],
        ogType: 'article',
        lang: 'en',
    });
});
