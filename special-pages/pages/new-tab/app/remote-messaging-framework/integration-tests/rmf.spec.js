import { test, expect } from '@playwright/test'
import { NewtabPage } from '../../../integration-tests/new-tab.page.js'

test.describe('newtab remote messaging framework rmf', () => {
    test('fetches config + data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage({ rmf: 'medium' })

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'rmf_getData', count: 1 })

        expect(calls1.length).toBe(1)
        expect(calls2.length).toBe(1)
    })

    test('renders a title and button', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage({ rmf: 'big_single_action' })

        await page.getByText('Tell Us Your Thoughts on Privacy Pro').waitFor()
        await page.getByRole('button', { name: 'Take Survey' }).click();
        await ntp.mocks.waitForCallCount({ method: 'rmf_primaryAction', count: 1 })
    })
})
