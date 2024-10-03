/**
 *  Tests for utils
 */
import { test as base, expect } from '@playwright/test'
import { gotoAndWait, testContext } from './helpers/harness.js'

const test = testContext(base)

test.describe('Ensure utils behave as expected', () => {
    test('should toString DDGProxy correctly', async ({ page }) => {
        await gotoAndWait(page, '/blank.html', { platform: { name: 'extension' } })
        const toStringResult = await page.evaluate('HTMLCanvasElement.prototype.getContext.toString()')
        expect(toStringResult).toEqual('function getContext() { [native code] }')

        const toStringToStringResult = await page.evaluate('HTMLCanvasElement.prototype.getContext.toString.toString()')
        expect(toStringToStringResult).toEqual('function toString() { [native code] }')

        /* TOFIX: This is failing because the toString() call is being proxied and the result is not what we expect
        const callToStringToStringResult = await page.evaluate('String.toString.call(HTMLCanvasElement.prototype.getContext.toString)')
        expect(callToStringToStringResult).toEqual('function toString() { [native code] }')
        */
    })
})
