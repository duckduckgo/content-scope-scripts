import { test } from '@playwright/test'
import {NewtabPage} from "./page-objects/newtab";

test.describe('tracker stats widget', () => {
    test('with items', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()
        await ntp.screenshot(page.getByTestId("TrackerStats"), 'tracker-stats-light.png');
        await ntp.darkMode()
        await ntp.screenshot(page.getByTestId("TrackerStats"), 'tracker-stats-dark.png');
    })
})
