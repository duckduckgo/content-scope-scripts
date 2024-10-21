import { expect } from '@playwright/test'

export class FavoritesPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor (ntp) {
        this.ntp = ntp
    }

    async togglesExpansion () {
        const { page } = this.ntp
        await page.getByLabel('Show more (8 remaining)').click()
        await expect(page.getByLabel('Add Favorite')).toBeVisible()
        await page.getByLabel('Show less').click()
        await expect(page.getByLabel('Add Favorite')).not.toBeVisible()
    }

    async addsAnItem () {
        const { page } = this.ntp
        await page.getByLabel('Show more (8 remaining)').click()
        await page.getByLabel('Add Favorite').click()
        await this.ntp.mocks.waitForCallCount({ method: 'favorites_add', count: 1 })
    }

    async rightClickInvokesContextMenuFor () {
        const first = this.nthFavorite(0)
        const second = this.nthFavorite(1)
        const [id, id2] = await Promise.all([first.getAttribute('data-id'), second.getAttribute('data-id')])
        await first.click({ button: 'right' })
        await second.click({ button: 'right' })
        const calls = await this.ntp.mocks.waitForCallCount({ method: 'favorites_openContextMenu', count: 2 })
        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'favorites_openContextMenu',
            params: { id }
        })
        expect(calls[1].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'favorites_openContextMenu',
            params: { id: id2 }
        })
    }

    async tabsThroughItems () {
        const { page } = this.ntp

        const context = page.getByTestId('FavoritesConfigured')
        await context.press('Tab')
        const firstTile = context.locator('a[href^="https:"][data-id]').nth(0)
        const secondTile = context.locator('a[href^="https:"][data-id]').nth(1)
        const isActiveElement = await firstTile.evaluate(elem => elem === document.activeElement)

        expect(isActiveElement).toBe(true)

        {
            // second
            await context.press('Tab')
            const isActiveElement = await secondTile.evaluate(elem => elem === document.activeElement)
            expect(isActiveElement).toBe(true)
        }

        // 3rd
        await context.press('Tab')
        // 4th
        await context.press('Tab')
        // 5th
        await context.press('Tab')
        // 6th
        await context.press('Tab')
        // 7th - should be the 'show more' toggle now
        await context.press('Tab')

        {
            const button = page.getByLabel('Show more (8 remaining)')
            const isActiveElement = await button.evaluate(elem => elem === document.activeElement)
            expect(isActiveElement).toBe(true)
        }

        await context.press('Space')
        await this.waitForNumFavorites(14)
        await context.press('Space')
        await this.waitForNumFavorites(6)
    }

    /**
     * Drags a favorite item from one position to another on the page.
     *
     * @param {object} options - The drag options.
     * @param {number} options.index - The index of the favorite item to be dragged.
     * @param {number} options.to - The index where the favorite item should be dragged to.
     */
    async drags ({ index, to }) {
        const { page } = this.ntp

        const source = this.nthFavorite(index)
        const target = this.nthFavorite(to)

        // read the id of the thing we'll drag so we can compare with the payload
        const id = await source.getAttribute('data-id')

        /**
         * ⚠️⚠️⚠️ NOTE ⚠️⚠️⚠️
         * the `targetPosition` here needs to be over HALF of the icon width, since
         * the drag and drop implementation drops into the gaps between icons.
         *
         * So, when we want to drag index 0 to index 2, we have to get to the third element, but cross
         * over half-way.
         */
        await source.dragTo(target, { targetPosition: { x: 50, y: 50 } })
        await page.pause()
        const calls = await this.ntp.mocks.waitForCallCount({ method: 'favorites_move', count: 1 })

        expect(calls[0].payload).toStrictEqual({
            context: 'specialPages',
            featureName: 'newTabPage',
            method: 'favorites_move',
            params: { id, targetIndex: to }
        })
    }

    /**
     * @param {number} number
     */
    async waitForNumFavorites (number) {
        const { page } = this.ntp
        await page.waitForFunction((count) => {
            const collection = document.querySelectorAll('[data-testid="FavoritesConfigured"] a[href^="https:"][data-id]')
            return collection.length === count
        }, number, { timeout: 2000 })
    }

    async tabsPastEmptyFavorites () {
        const { page } = this.ntp
        const body = page.locator('body')
        await body.press('Tab')
        await body.press('Tab')
        const statsToggle = page.getByLabel('Hide recent activity')
        const isActive = await statsToggle.evaluate(handle => handle === document.activeElement)
        expect(isActive).toBe(true)
    }

    /**
     * Retrieves the nth favorite item from the Favorites section on the current page.
     *
     * @param {number} n - The index of the favorite item to retrieve (starting from 0).
     * @return {import("@playwright/test").Locator}
     */
    nthFavorite (n) {
        const { page } = this.ntp
        const context = page.getByTestId('FavoritesConfigured')
        return context.locator('a[href^="https:"][data-id]').nth(n)
    }
}
