/**
 *  Tests for injecting navigator.duckduckgo into the page
 */
import { test as base, expect } from '@playwright/test';
import { gotoAndWait, testContextForExtension } from './helpers/harness.js';

const test = testContextForExtension(base);

test.describe('Ensure navigator interface is injected', () => {
    test('should expose navigator.navigator.isDuckDuckGo(): Promise<boolean> and platform === "extension"', async ({ page }) => {
        await gotoAndWait(page, '/blank.html');
        const isDuckDuckGoResult = await page.evaluate(() => {
            const fn = navigator.duckduckgo?.isDuckDuckGo;
            if (typeof fn !== 'function') {
                throw new Error('navigator.duckduckgo.isDuckDuckGo was missing');
            }
            return fn();
        });
        expect(isDuckDuckGoResult).toEqual(true);

        const platformResult = await page.evaluate("navigator.duckduckgo.platform === 'extension'");
        expect(platformResult).toEqual(true);
    });
});
