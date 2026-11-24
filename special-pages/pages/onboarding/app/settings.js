import { EVERY_PAGE_ID, ORDER_V4, STEPS_ORDER } from './types';
import { stepDefinitions as defaultStepDefinitions } from './v4/data/data';
import { regionalSites } from './v4/data/regional-sites';

/**
 * Settings that affect the Application, such as running order
 */
export class Settings {
    /**
     * @param {object} params
     * @param {{name: 'macos' | 'windows'}} [params.platform]
     * @param {import('./types.js').Step['id'][]} [params.order] - determine the order of screens
     * @param {import('./types.js').Step['id'][]} [params.exclude] - a list of screens to exclude
     * @param {boolean} [params.hasSteps] - true once native chose the steps; `exclude` is then ignored
     * @param {import('./types.js').Step['id']} [params.first] - choose which screen to start on
     * @param {import('./types.js').StepDefinitions} [params.stepDefinitions] - individual data for each step, eg: which rows to show
     * @param {'title'|null} [params.typingEffect] - typing effect variant for titles
     */
    constructor({
        platform = { name: 'macos' },
        order = ORDER_V4,
        stepDefinitions = defaultStepDefinitions,
        first = 'welcome',
        exclude = [],
        hasSteps = false,
        typingEffect = 'title',
    } = {}) {
        this.platform = platform;
        this.order = order;
        this.stepDefinitions = stepDefinitions;
        this.first = first;
        this.exclude = exclude;
        this.hasSteps = hasSteps;
        this.typingEffect = typingEffect;
    }

    withPlatformName(name) {
        /** @type {ImportMeta['platform'][]} */
        const valid = ['windows', 'macos', 'ios', 'android'];
        if (valid.includes(/** @type {any} */ (name))) {
            return new Settings({
                ...this,
                platform: { name },
            });
        }
        return this;
    }

    /**
     * @param {string[]|null|undefined} order
     * @return {Settings}
     */
    withOrder(order) {
        if (!order) return this;
        if (Array.isArray(order) && order.length === 0) return this;

        const valid = order.filter((item) => EVERY_PAGE_ID.includes(/** @type {any} */ (item)));
        const invalid = order.filter((item) => !EVERY_PAGE_ID.includes(/** @type {any} */ (item)));
        if (invalid.length > 0) {
            console.error('ignoring screen order because of invalid entries:', invalid);
        } else {
            return new Settings({
                order: /** @type {any} */ (valid),
                stepDefinitions: this.stepDefinitions,
            });
        }
        return this;
    }

    /**
     * Show only the steps native asks for, in the page's own order (`STEPS_ORDER`).
     * Unknown entries are ignored one by one. Missing or empty `steps` keeps today's onboarding.
     *
     * @param {string[]|null|undefined} steps
     * @return {Settings}
     */
    withSteps(steps) {
        if (!Array.isArray(steps) || steps.length === 0) return this;
        const unknown = steps.filter((id) => !STEPS_ORDER.includes(/** @type {any} */ (id)));
        if (unknown.length > 0) console.warn('ignoring unknown steps:', unknown);
        const order = STEPS_ORDER.filter((id) => steps.includes(id));
        if (order.length === 0) return this;
        return new Settings({ ...this, order, exclude: [], hasSteps: true });
    }

    /**
     * @param {string[]|null|undefined} exclude
     */
    withExcludedScreens(exclude) {
        if (this.hasSteps) return this;
        if (!exclude) return this;
        if (!Array.isArray(exclude) || exclude.length === 0) return this;
        if (!exclude.every((screen) => /** @type {string[]} */ (this.order).includes(screen))) return this;
        return new Settings({
            ...this,
            exclude,
            order: this.order.filter((screen) => !exclude.includes(screen)),
        });
    }

    /**
     * @param {string|undefined|null} first
     * @return {Settings}
     */
    withFirst(first) {
        if (!first) return this;
        // you can only set 'first' to an element in the running order
        if (/** @type {string[]} */ (this.order).includes(first)) {
            return new Settings({
                ...this,
                first,
            });
        }
        return this;
    }

    /**
     * @param {string|null|undefined} typingEffect
     * @return {Settings}
     */
    withTypingEffect(typingEffect) {
        if (typingEffect === 'none') return new Settings({ ...this, typingEffect: null });
        if (typingEffect === 'title') return new Settings({ ...this, typingEffect: 'title' });
        return this;
    }

    /**
     * Points the picker's default Amazon and Wikipedia sites at the user's store and language.
     * Call it before `withStepDefinitions`, so a site list native sends replaces these URLs instead of being rewritten.
     *
     * @param {{ locale?: string | null, region?: string | null }} where
     * @return {Settings}
     */
    withRegionalSites(where) {
        const picker = this.stepDefinitions.picker;
        if (picker?.id !== 'picker' || !picker.sites) return this;
        return new Settings({
            ...this,
            stepDefinitions: { ...this.stepDefinitions, picker: { ...picker, sites: regionalSites(picker.sites, where) } },
        });
    }

    /**
     * @param {import('./types.js').StepDefinitions | Record<string, any> | null | undefined} stepDefinitions
     * @return {Settings}
     */
    withStepDefinitions(stepDefinitions) {
        if (!stepDefinitions) return this;
        if (!Object.keys(stepDefinitions)?.length) return this;

        const nextSteps = { ...this.stepDefinitions };

        for (const [key, value] of Object.entries(stepDefinitions || {})) {
            if (!this.order.includes(/** @type {any} */ (key))) {
                continue;
            }
            console.log('KV', key, value);
            nextSteps[key] = { ...nextSteps[key], ...value };
        }

        return new Settings({
            ...this,
            stepDefinitions: nextSteps,
        });
    }
}
