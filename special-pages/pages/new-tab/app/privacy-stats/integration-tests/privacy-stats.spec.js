import { test, expect } from '@playwright/test'
import { NewtabPage } from '../../../integration-tests/new-tab.page.js'

test.describe('newtab privacy stats', () => {
    test('fetches config + stats', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'stats_getData', count: 1 })
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'stats_getConfig', count: 1 })

        expect(calls1.length).toBe(1)
        expect(calls2.length).toBe(1)
        expect(calls3.length).toBe(1)
    })
})
