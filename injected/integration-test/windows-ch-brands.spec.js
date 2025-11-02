import { test, expect } from '@playwright/test';
import { ResultsCollector } from './page-objects/results-collector.js';

test('Windows CH Brands override', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/windows-ch-brands/pages/brand-override.html',
        './integration-test/test-pages/windows-ch-brands/config/brand-override.json',
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

test('Windows CH Brands when brands missing', async ({ page }, testInfo) => {
    const collector = ResultsCollector.create(page, testInfo.project.use);
    await collector.load(
        '/windows-ch-brands/pages/brands-missing.html',
        './integration-test/test-pages/windows-ch-brands/config/brands-missing.json',
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
