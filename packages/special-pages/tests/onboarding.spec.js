import { test, expect } from '@playwright/test'
import { OnboardingPage } from './page-objects/onboarding.js'

test.describe('onboarding', () => {
    test('full flow (reduced motion)', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.reducedMotion()
        await onboarding.openPage()
        await fullFlow(page)
    })
    test('full flow', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.openPage()
        await fullFlow(page)
    })
    test.only('components', async ({ page }, workerInfo) => {
        const onboarding = OnboardingPage.create(page, workerInfo)
        await onboarding.openPage({ env: 'components' })
        await fullFlow(page)
    })
})

/**
 * Performs a full flow on the given page.
 *
 * @param {import("@playwright/test").Page} page - The page object representing the webpage to perform the flow on.
 * @returns {Promise} - A promise that resolves when the full flow is completed.
 */
async function fullFlow (page) {
    await page.getByRole('button', { name: 'Get Started' }).click()
    await expect(page.getByLabel('Unlike other browsers,')).toContainText('Unlike other browsers, DuckDuckGo is private by default')
    await page.getByRole('heading', { name: 'Private Search' }).click()
    await expect(page.getByRole('list')).toContainText('Private Search')
    await expect(page.getByRole('list')).toContainText('Tracking Protection')
    await expect(page.getByRole('list')).toContainText('Automatic Cookie Pop-Up Blocking')
    await page.pause()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Private also means\nfewer ads and pop-ups')).toContainText('Private also means fewer ads and pop-ups')
    await page.getByRole('button', { name: 'Got it' }).click()
    await expect(page.getByRole('list')).toContainText('While watching YouTube')
    await expect(page.locator('h4')).toContainText('Enforce YouTube’s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.')
    await page.getByRole('button', { name: 'Got it' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByText('Make privacy your go-to').nth(1).click()
    await expect(page.getByLabel('Make privacy your go-to')).toContainText('Make privacy your go-to')
    await page.getByRole('button', { name: 'Keep in Dock' }).click()
    await expect(page.getByRole('list')).toContainText('Bring your stuff')
    await page.getByRole('button', { name: 'Import' }).click()
    await expect(page.getByRole('list')).toContainText('Switch your default browser')
    await page.getByRole('button', { name: 'Make Default' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('Customize your experience')).toContainText('Customize your experience')
    await expect(page.locator('h3')).toContainText('Put your bookmarks in easy reach')
    await page.getByRole('button', { name: 'Show Bookmarks Bar' }).click()
    await expect(page.getByRole('list')).toContainText('Pick up where you left off')
    await page.getByRole('button', { name: 'Enable Session Restore' }).click()
    await expect(page.getByRole('list')).toContainText('Add a shortcut to your homepage')
    await page.getByRole('button', { name: 'Show Home Button' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByLabel('You\'re all set!')).toContainText('You\'re all set!')
    await page.getByRole('button', { name: 'Start Browsing' }).click()
    await page.getByRole('heading', { name: 'Remember, DuckDuckGo will be' }).click()
}
