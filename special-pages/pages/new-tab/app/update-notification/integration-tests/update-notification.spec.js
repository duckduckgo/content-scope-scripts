import { test, expect } from '@playwright/test'
import { NewtabPage } from '../../../integration-tests/new-tab.page.js'

test.describe('newtab update notifications', () => {
    test('handles empty notes', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage({ updateNotification: 'empty' })

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })

        expect(calls1.length).toBe(1)
        const text = page.getByText('Browser Updated to version 1.65.0.')
        await text.waitFor()
        await page.getByRole('button', { name: 'Dismiss' }).click()
        await ntp.mocks.waitForCallCount({ method: 'updateNotification_dismiss', count: 1 })
        await expect(text).not.toBeVisible()
    })
    test('handles populated notes', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage({ updateNotification: 'populated' })

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })

        expect(calls1.length).toBe(1)

        await page.getByText("Browser Updated to version 1.91. See what's new in this release.").waitFor()
        await page.getByRole('link', { name: "what's new" }).click()
        await page.getByText('Bug fixes and improvements').waitFor()
        await page.getByRole('button', { name: 'Dismiss' }).click()
        await ntp.mocks.waitForCallCount({ method: 'updateNotification_dismiss', count: 1 })
    })
})
