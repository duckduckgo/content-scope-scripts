import { test, expect } from '@playwright/test'
import { NewtabPage } from './new-tab.page.js'

test.describe('newtab widgets', () => {
    test('widget config single click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        // menu
        await page.getByRole('button', { name: 'Customize' }).click()

        // hide
        await page.locator('label').filter({ hasText: 'Privacy Stats' }).click()

        // debounced
        await page.waitForTimeout(500)

        // verify the single sync call, where one is hidden
        const outgoing = await ntp.mocks.outgoing({ names: ['widgets_setConfig'] })

        expect(outgoing).toStrictEqual([{
            payload: {
                context: 'specialPages',
                featureName: 'newTabPage',
                params: [
                    { id: 'favorites', visibility: 'visible' },
                    { id: 'privacyStats', visibility: 'hidden' }
                ],
                method: 'widgets_setConfig'
            }
        }])
    })
    test.skip('widget config double click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        // menu
        await page.getByRole('button', { name: 'Customize' }).click()

        // hide
        await page.locator('label').filter({ hasText: 'Privacy Stats' }).uncheck()

        // show
        await page.locator('label').filter({ hasText: 'Privacy Stats' }).check()

        // debounced
        await page.waitForTimeout(500)

        // verify the single sync call, where both are visible.
        const outgoing = await ntp.mocks.outgoing({ names: ['widgets_setConfig'] })
        expect(outgoing).toStrictEqual([{
            payload: {
                context: 'specialPages',
                featureName: 'newTabPage',
                params: [
                    { id: 'favorites', visibility: 'visible' },
                    { id: 'privacyStats', visibility: 'visible' }
                ],
                method: 'widgets_setConfig'
            }
        }])
    })
})
