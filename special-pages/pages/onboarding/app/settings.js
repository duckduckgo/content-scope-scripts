import { ALT_ORDER, DEFAULT_ORDER, EVERY_PAGE_ID } from './types'
import { stepDefinitions as defaultStepDefinitions } from './data'

/**
 * Settings that affect the Application, such as running order
 */
export class Settings {
    /**
     * @param {object} params
     * @param {import('./types.js').Step['id'][]} [params.order] - determine the order of screens
     * @param {import('./types.js').Step['id'][]} [params.exclude] - a list of screens to exclude
     * @param {import('./types.js').Step['id']} [params.first] - choose which screen to start on
     * @param {import('./data.js').StepDefinitions} [params.stepDefinitions] - individual data for each step, eg: which rows to show
     */
    constructor ({
        order = DEFAULT_ORDER,
        stepDefinitions = defaultStepDefinitions,
        first = 'welcome',
        exclude = []
    } = {}) {
        this.order = order
        this.stepDefinitions = stepDefinitions
        this.first = first
        this.exclude = exclude
    }

    /**
     * @param {string[]|null|undefined} order
     * @return {Settings}
     */
    withOrder (order) {
        if (!order) return this
        if (Array.isArray(order) && order.length === 0) return this

        const valid = order.filter(item => EVERY_PAGE_ID.includes(/** @type {any} */(item)))
        const invalid = order.filter(item => !EVERY_PAGE_ID.includes(/** @type {any} */(item)))
        if (invalid.length > 0) {
            console.error('ignoring screen order because of invalid entries:', invalid)
        } else {
            return new Settings({
                order: /** @type {any} */(valid),
                stepDefinitions: this.stepDefinitions
            })
        }
        return this
    }

    /**
     * @param {string|null|undefined} named
     * @return {Settings}
     */
    withNamedOrder (named) {
        if (!named) return this
        if (named === 'v1') {
            return new Settings({
                ...this,
                order: DEFAULT_ORDER
            })
        }
        if (named === 'v2') {
            return new Settings({
                ...this,
                order: ALT_ORDER
            })
        } else {
            console.warn('ignoring named order:', named)
        }
        return this
    }

    /**
     * @param {string[]|null|undefined} exclude
     */
    withExcludedScreens (exclude) {
        if (!exclude) return this
        if (!Array.isArray(exclude) || exclude.length === 0) return this
        if (!exclude.every(screen => /** @type {string[]} */(this.order).includes(screen))) return this
        return new Settings({
            ...this,
            exclude,
            order: this.order.filter(screen => !exclude.includes(screen))
        })
    }

    /**
     * @param {string|undefined|null} first
     * @return {Settings}
     */
    withFirst (first) {
        if (!first) return this
        // you can only set 'first' to an element in the running order
        if (/** @type {string[]} */(this.order).includes(first)) {
            return new Settings({
                ...this,
                first
            })
        }
        return this
    }

    /**
     * @param {import('./data.js').StepDefinitions | Record<string, any> | null | undefined} stepDefinitions
     * @return {Settings}
     */
    withStepDefinitions (stepDefinitions) {
        if (!stepDefinitions) return this
        if (!Object.keys(stepDefinitions)?.length) return this

        const nextSteps = { ...this.stepDefinitions }

        for (const [key, value] of Object.entries(stepDefinitions || {})) {
            if (!this.order.includes(/** @type {any} */(key))) {
                continue
            }

            nextSteps[key] = { ...nextSteps[key], ...value }
        }

        return new Settings({
            ...this,
            stepDefinitions: nextSteps
        })
    }
}
