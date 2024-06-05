import { test } from '@playwright/test'
import { SpecialErrorPage } from './page-objects/specialerror'

test.describe('specialerror', () => {
    test('leaves site', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage('ssl')
        await special.leavesSite()
    })
    test('visits site', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage('ssl')
        await special.visitsSite()
    })
    test.only('opens phishing help page in a new window', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo)
        await special.openPage('phishing')
        await special.opensNewPage('Learn more', 'https://duckduckgo.com/duckduckgo-help-pages/')
        await special.showsAdvancedInfo()
        await special.opensNewPage('Phishing and Malware Protection help page', 'https://duckduckgo.com/duckduckgo-help-pages/')
    })
})
