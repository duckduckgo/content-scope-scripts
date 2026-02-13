/**
 *  Tests for shared pages.
 *  Note: these only run in the extension setup for now.
 *
 *  IMPORTANT TESTING GUIDELINES:
 *
 *  1. AVOID CUSTOM STATE IN SPEC FILES:
 *     It's unadvisable to add custom state for tests directly in .spec.js files as it makes
 *     validation difficult and reduces test reliability. If custom state is absolutely required,
 *     ensure this is clearly explained in the corresponding test HTML file with detailed
 *     comments about what state is being set and why it's necessary.
 *
 *  2. PLATFORM CONFIGURATION:
 *     The 'Platform' parameter can be passed as an argument to testPage() to simulate different
 *     platform environments. This is demonstrated in the version tests:
 *     - minSupportedVersion (string): Uses { version: '1.5.0' }
 *     - minSupportedVersion (int): Uses { version: 99 }
 *     - maxSupportedVersion (string): Uses { version: '1.5.0' }
 *     - maxSupportedVersion (int): Uses { version: 99 }
 *
 *     This is needed when testing features that have platform-specific behavior or version
 *     requirements. The platform object allows testing how features behave under different
 *     version constraints without modifying the core test infrastructure.
 *
 *  3. CONFIG-DRIVEN TESTING:
 *     Where possible, prefer purely config-driven testing to validate features. This approach:
 *     - Makes tests more maintainable and readable
 *     - Reduces coupling between test logic and implementation details
 *     - Allows for easier test data management and updates
 *     - Provides better separation of concerns between test setup and validation
 */
import { test as base, expect } from '@playwright/test';
import { testContextForExtension } from './helpers/harness.js';
import { ResultsCollector } from './page-objects/results-collector.js';

const test = testContextForExtension(base);
/**
 * @typedef {import('../../injected/src/utils.js').Platform} Platform
 */

test.describe('Test integration pages', () => {
    /**
     * @param {import("@playwright/test").Page} page
     * @param {import("@playwright/test").TestInfo} testInfo
     * @param {string} html
     * @param {string} config
     * @param {Partial<Platform>} [platform]
     */
    async function testPage(page, testInfo, html, config, platform = {}) {
        const collector = ResultsCollector.create(page, testInfo?.project?.use);
        await collector.load(html, config, platform);
        const results = await collector.results();
        for (const key in results) {
            for (const result of results[key]) {
                await test.step(`${key}: ${result.name}`, () => {
                    expect(result.result).toEqual(result.expected);
                });
            }
        }
    }

    test('Test infra', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching.html',
            './integration-test/test-pages/infra/config/conditional-matching.json',
        );
    });

    test('Test infra with experiments', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching-experiments.html',
            './integration-test/test-pages/infra/config/conditional-matching-experiments.json',
        );
    });

    test('Test infra fallback', async ({ page }, testInfo) => {
        await page.addInitScript(() => {
            // This ensures that our fallback code applies and so we simulate other platforms than Chromium.
            delete globalThis.navigation;
        });
        await testPage(
            page,
            testInfo,
            '/infra/pages/conditional-matching.html',
            './integration-test/test-pages/infra/config/conditional-matching.json',
        );
    });

    test('Test manipulating APIs', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/api-manipulation/pages/apis.html',
            './integration-test/test-pages/api-manipulation/config/apis.json',
        );
    });

    test('Web compat shims correctness', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/shims.html',
            `./integration-test/test-pages/webcompat/config/shims.json`,
        );
    });

    test('Properly modifies localStorage entries', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/modify-localstorage.html',
            `./integration-test/test-pages/webcompat/config/modify-localstorage.json`,
        );
    });

    test('Properly modifies cookies', async ({ page }, testInfo) => {
        // prettier-ignore
        await testPage(
            page,
            testInfo,
            'webcompat/pages/modify-cookies.html',
            `./integration-test/test-pages/webcompat/config/modify-cookies.json`,
        );
    });

    test('enumerateDevices API functionality', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            'webcompat/pages/enumerate-devices-api-test.html',
            './integration-test/test-pages/webcompat/config/enumerate-devices-api.json',
        );
    });

    test('minSupportedVersion (string)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/min-supported-version-string.html',
            './integration-test/test-pages/infra/config/min-supported-version-string.json',
            { version: '1.5.0' },
        );
    });

    test('minSupportedVersion (int)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/min-supported-version-int.html',
            './integration-test/test-pages/infra/config/min-supported-version-int.json',
            { version: 99 },
        );
    });

    test('maxSupportedVersion (string)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/max-supported-version-string.html',
            './integration-test/test-pages/infra/config/max-supported-version-string.json',
            { version: '1.5.0' },
        );
    });

    test('maxSupportedVersion (int)', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/infra/pages/max-supported-version-int.html',
            './integration-test/test-pages/infra/config/max-supported-version-int.json',
            { version: 99 },
        );
    });

    test('Element Hiding', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/element-hiding/pages/element-hiding.html',
            './integration-test/test-pages/element-hiding/config/element-hiding.json',
        );
    });

    test('GPC', async ({ page }, testInfo) => {
        const collector = ResultsCollector.create(page, testInfo?.project?.use);
        collector.withUserPreferences({ globalPrivacyControlValue: true });
        await collector.load(
            '/gpc/pages/gpc.html',
            './integration-test/test-pages/gpc/config/gpc.json',
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

    test('Google Rejected', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/google-rejected/pages/google-rejected.html',
            './integration-test/test-pages/google-rejected/config/google-rejected.json',
        );
    });

    test('Fingerprinting Hardware', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-hardware/pages/fingerprinting-hardware.html',
            './integration-test/test-pages/fingerprinting-hardware/config/fingerprinting-hardware.json',
        );
    });

    test('Fingerprinting Screen Size', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-screen-size/pages/fingerprinting-screen-size.html',
            './integration-test/test-pages/fingerprinting-screen-size/config/fingerprinting-screen-size.json',
        );
    });

    test('Fingerprinting Battery', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-battery/pages/fingerprinting-battery.html',
            './integration-test/test-pages/fingerprinting-battery/config/fingerprinting-battery.json',
        );
    });

    test('Fingerprinting Audio', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-audio/pages/fingerprinting-audio.html',
            './integration-test/test-pages/fingerprinting-audio/config/fingerprinting-audio.json',
        );
    });

    test('Fingerprinting Canvas', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-canvas/pages/fingerprinting-canvas.html',
            './integration-test/test-pages/fingerprinting-canvas/config/fingerprinting-canvas.json',
        );
    });

    test('Fingerprinting Temporary Storage', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/fingerprinting-temporary-storage/pages/fingerprinting-temporary-storage.html',
            './integration-test/test-pages/fingerprinting-temporary-storage/config/fingerprinting-temporary-storage.json',
        );
    });

    test('Referrer', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/referrer/pages/referrer.html',
            './integration-test/test-pages/referrer/config/referrer.json',
        );
    });

    test('Navigator Interface', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/navigator-interface/pages/navigator-interface.html',
            './integration-test/test-pages/navigator-interface/config/navigator-interface.json',
        );
    });

    test('Exception Handler', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/exception-handler/pages/exception-handler.html',
            './integration-test/test-pages/exception-handler/config/exception-handler.json',
        );
    });

    test('Print', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/print/pages/print.html',
            './integration-test/test-pages/print/config/print.json',
        );
    });

    test('Performance Metrics', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/performance-metrics/pages/performance-metrics.html',
            './integration-test/test-pages/performance-metrics/config/performance-metrics.json',
        );
    });

    test('Web Telemetry', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/web-telemetry/pages/web-telemetry.html',
            './integration-test/test-pages/web-telemetry/config/web-telemetry.json',
        );
    });

    test('Web Interference Detection', async ({ page }, testInfo) => {
        await testPage(
            page,
            testInfo,
            '/web-interference-detection/pages/web-interference-detection.html',
            './integration-test/test-pages/web-interference-detection/config/web-interference-detection.json',
        );
    });
});
