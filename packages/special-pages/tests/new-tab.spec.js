import { test, expect } from '@playwright/test'
import { NewtabPage } from './page-objects/newtab'

test.describe('newtab widgets', () => {
    test('widget config single click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        // hide
        await page.getByRole('button', { name: 'Toggle Privacy Stats' }).click()
        await expect(page.locator('#app')).toContainText('privacyStats visibility: hidden')

        // debounced
        await page.waitForTimeout(500)

        // verify the single sync call, where one is hidden
        const outgoing = await ntp.mocks.outgoing({ names: ['setWidgetConfig'] })
        expect(outgoing).toStrictEqual([{
            payload: {
                context: 'specialPages',
                featureName: 'newTabPage',
                params: {
                    widgetConfig: [
                        { id: 'favorites', visibility: 'visible' },
                        { id: 'privacyStats', visibility: 'hidden' }
                    ]
                },
                method: 'setWidgetConfig'
            }
        }])
    })
    test('widget config double click', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        // hide
        await page.getByRole('button', { name: 'Toggle Privacy Stats' }).click()
        await expect(page.locator('#app')).toContainText('privacyStats visibility: hidden')

        // show
        await page.getByRole('button', { name: 'Toggle Privacy Stats' }).click()
        await expect(page.locator('#app')).toContainText('privacyStats visibility: visible')

        // debounced
        await page.waitForTimeout(500)

        // verify the single sync call, where both are visible.
        const outgoing = await ntp.mocks.outgoing({ names: ['setWidgetConfig'] })
        expect(outgoing).toStrictEqual([{
            payload: {
                context: 'specialPages',
                featureName: 'newTabPage',
                params: {
                    widgetConfig: [
                        { id: 'favorites', visibility: 'visible' },
                        { id: 'privacyStats', visibility: 'visible' }
                    ]
                },
                method: 'setWidgetConfig'
            }
        }])
    })
})
