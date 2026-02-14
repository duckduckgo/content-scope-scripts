/**
 * Feature Smoke Tests
 *
 * Ensures that each feature (individually and all combined) can initialize
 * on a page without breaking basic page functionality.
 *
 * This is a data-driven test that reads feature names from features.js,
 * so new features are automatically covered when added.
 */
import { test as base, expect } from '@playwright/test';
import { testContextForExtension } from './helpers/harness.js';
import { ResultsCollector } from './page-objects/results-collector.js';
import { platformSupport } from '../src/features.js';

const test = testContextForExtension(base);

const SMOKE_HTML = '/smoke/pages/smoke.html';

/**
 * Generate a minimal config object enabling a single feature.
 * @param {string} featureName
 * @returns {object}
 */
function singleFeatureConfig(featureName) {
    return {
        version: 1,
        features: {
            [featureName]: {
                state: 'enabled',
                exceptions: [],
            },
        },
        unprotectedTemporary: [],
    };
}

/**
 * Generate a config object enabling all features from platformSupport.integration.
 * Built dynamically so new features added to features.js are automatically included.
 * @returns {object}
 */
function allFeaturesConfig() {
    /** @type {Record<string, {state: string, exceptions: any[]}>} */
    const features = {};
    for (const featureName of platformSupport.integration) {
        features[featureName] = {
            state: 'enabled',
            exceptions: [],
        };
    }
    return {
        version: 1,
        features,
        unprotectedTemporary: [],
    };
}

/**
 * @param {import("@playwright/test").Page} page
 * @param {import("@playwright/test").TestInfo} testInfo
 * @param {string} html
 * @param {string | object} config - path to config file or config object
 */
async function runSmokeTest(page, testInfo, html, config) {
    const collector = ResultsCollector.create(page, testInfo?.project?.use);
    if (typeof config === 'string') {
        await collector.load(html, config);
    } else {
        // Write config to a temp path for the collector
        const { writeFileSync, mkdirSync } = await import('fs');
        const { join } = await import('path');
        const tmpDir = join(import.meta.dirname, 'test-pages', 'smoke', 'config', '_generated');
        mkdirSync(tmpDir, { recursive: true });
        const tmpPath = join(tmpDir, `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        writeFileSync(tmpPath, JSON.stringify(config));
        await collector.load(html, tmpPath);
    }
    const results = await collector.results();
    for (const key in results) {
        for (const result of results[key]) {
            await test.step(`${key}: ${result.name}`, () => {
                expect(result.result).toEqual(result.expected);
            });
        }
    }
}

test.describe('Feature smoke tests', () => {
    // Test all features combined - the critical "nothing explodes" test
    test('All features combined', async ({ page }, testInfo) => {
        await runSmokeTest(page, testInfo, SMOKE_HTML, allFeaturesConfig());
    });

    // Test each feature individually
    const allFeatures = platformSupport.integration;
    for (const featureName of allFeatures) {
        test(`Smoke: ${featureName}`, async ({ page }, testInfo) => {
            const config = singleFeatureConfig(featureName);
            await runSmokeTest(page, testInfo, SMOKE_HTML, config);
        });
    }
});
