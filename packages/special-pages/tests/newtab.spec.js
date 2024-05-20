import { test } from '@playwright/test'
import { NewtabPage } from './page-objects/newtab'

test.describe('tracker stats widget', () => {
    test('states', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage({ stats: 'none' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-none.png')
        await ntp.openPage({ stats: 'few' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-few.png')
        await ntp.openPage({ stats: 'single' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-single.png')
        await ntp.openPage({ stats: 'norecent' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-norecent.png')

        await ntp.darkMode()
        await ntp.openPage({ stats: 'none' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-dark-none.png')
        await ntp.openPage({ stats: 'few' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-dark-few.png')
        await ntp.openPage({ stats: 'single' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-dark-single.png')
        await ntp.openPage({ stats: 'norecent' })
        await ntp.screenshot(page.getByTestId('TrackerStats'), 'tracker-stats-dark-norecent.png')
    })
})
