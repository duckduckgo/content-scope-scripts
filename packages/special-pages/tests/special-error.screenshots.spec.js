import { expect, test } from '@playwright/test'
import { SpecialErrorPage } from './page-objects/special-error'

test.describe('screenshots @screenshots', () => {
    test(`expired certificate`, async ({ page }, workerInfo) => {
        const errorId = 'ssl.expired'
        const errorName = errorId.replace('.', '-')
        const { platform } = workerInfo.project.use
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage({ errorId, platformName: platform })
        await expect(page).toHaveScreenshot(`${errorName}.png`, { maxDiffPixels: 20 })
        await special.showsAdvancedInfo()
        await expect(page).toHaveScreenshot(`${errorName}-advanced.png`, { maxDiffPixels: 20 })
    })

    test(`invalid certificate`, async ({ page }, workerInfo) => {
        const errorId = 'ssl.invalid'
        const errorName = errorId.replace('.', '-')
        const { platform } = workerInfo.project.use
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage({ errorId, platformName: platform })
        await expect(page).toHaveScreenshot(`${errorName}.png`, { maxDiffPixels: 20 })
        await special.showsAdvancedInfo()
        await expect(page).toHaveScreenshot(`${errorName}-advanced.png`, { maxDiffPixels: 20 })
    })

    test(`self-signed certificate`, async ({ page }, workerInfo) => {
        const errorId = 'ssl.selfSigned'
        const errorName = errorId.replace('.', '-')
        const { platform } = workerInfo.project.use
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage({ errorId, platformName: platform })
        await expect(page).toHaveScreenshot(`${errorName}.png`, { maxDiffPixels: 20 })
        await special.showsAdvancedInfo()
        await expect(page).toHaveScreenshot(`${errorName}-advanced.png`, { maxDiffPixels: 20 })
    })

    test(`wrong host`, async ({ page }, workerInfo) => {
        const errorId = 'ssl.wrongHost'
        const errorName = errorId.replace('.', '-')
        const { platform } = workerInfo.project.use
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage({ errorId, platformName: platform })
        await expect(page).toHaveScreenshot(`${errorName}.png`, { maxDiffPixels: 20 })
        await special.showsAdvancedInfo()
        await expect(page).toHaveScreenshot(`${errorName}-advanced.png`, { maxDiffPixels: 20 })
    })

    test(`phishing`, async ({ page }, workerInfo) => {
        const errorId = 'phishing'
        const errorName = errorId.replace('.', '-')
        const { platform } = workerInfo.project.use
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage({ errorId, platformName: platform })
        await expect(page).toHaveScreenshot(`${errorName}.png`, { maxDiffPixels: 20 })
        await special.showsAdvancedInfo()
        await expect(page).toHaveScreenshot(`${errorName}-advanced.png`, { maxDiffPixels: 20 })
    })
})
