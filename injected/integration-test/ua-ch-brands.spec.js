import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

test('UA CH Brands override', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/brand-override.html',
        './integration-test/test-pages/ua-ch-brands/config/brand-override.json',
    );
    const results = await collector.results();

    for (const key in results) {
        for (const result of results[key]) {
            await test.step(`${key}: ${result.name}`, () => {
                expect(result.result).toEqual(result.expected);
            });
        }
    }
});

test('UA CH Brands when brands missing', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/ua-ch-brands/pages/brands-missing.html',
        './integration-test/test-pages/ua-ch-brands/config/brands-missing.json',
    );
    const results = await collector.results();

    for (const key in results) {
        for (const result of results[key]) {
            await test.step(`${key}: ${result.name}`, () => {
                expect(result.result).toEqual(result.expected);
            });
        }
    }
});
