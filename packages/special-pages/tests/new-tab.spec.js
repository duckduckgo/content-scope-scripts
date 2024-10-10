import { test, expect } from '@playwright/test'
import { NewtabPage } from './page-objects/newtab'

test.describe('newtab widgets', () => {
    test('widget config single click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        await page.pause()

        // hide
        await page.getByLabel('privacyStats').uncheck()

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
    test('widget config double click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        // hide
        await page.getByLabel('privacyStats').uncheck()

        // show
        await page.getByLabel('privacyStats').check()

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
