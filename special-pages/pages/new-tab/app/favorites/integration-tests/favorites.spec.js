import { test, expect } from '@playwright/test'
import { NewtabPage } from '../../../integration-tests/new-tab.page.js'
import { FavoritesPage } from './favorites.page.js'

test.describe('newtab favorites', () => {
    test('fetches config + favorites data', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        await ntp.reducedMotion()
        await ntp.openPage()

        const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })
        const calls2 = await ntp.mocks.waitForCallCount({ method: 'favorites_getConfig', count: 1 })
        const calls3 = await ntp.mocks.waitForCallCount({ method: 'favorites_getData', count: 1 })

        expect(calls1.length).toBe(1)
        expect(calls2.length).toBe(1)
        expect(calls3.length).toBe(1)
    })
    test('Toggles expansion', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage()
        await favorites.togglesExpansion()
    })
    test('Adds an item', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage()
        await favorites.addsAnItem()
    })
    test('Opens context menu', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage()
        await favorites.rightClickInvokesContextMenuFor()
    })
    test('Supports keyboard nav', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage()
        await favorites.tabsThroughItems()
    })
    test('initial empty state', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage({ favoritesCount: 0 })
        await favorites.tabsPastEmptyFavorites()
    })
    test('re-orders items', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo)
        const favorites = new FavoritesPage(ntp)
        await ntp.reducedMotion()
        await ntp.openPage()
        await favorites.drags({ index: 0, to: 2 })
    })
})

// test.describe('newtab privacy stats', () => {
//     test('fetches config + stats', async ({ page }, workerInfo) => {
//         const ntp = NewtabPage.create(page, workerInfo)
//         await ntp.reducedMotion()
//         await ntp.openPage()
//
//         const calls1 = await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 })
//         const calls2 = await ntp.mocks.waitForCallCount({ method: 'stats_getData', count: 1 })
//         const calls3 = await ntp.mocks.waitForCallCount({ method: 'stats_getConfig', count: 1 })
//
//         expect(calls1.length).toBe(1)
//         expect(calls2.length).toBe(1)
//         expect(calls3.length).toBe(1)
//     })
// })
