/**
 * A container for environment related settings/updates
 */
export class Environment {
    /**
     * @param {object} params
     * @param {'app' | 'components'} [params.display] - whether to show the application or component list
     * @param {'production' | 'development'} [params.env] - application environment
     * @param {URLSearchParams} [params.urlParams] - URL params passed into the page
     * @param {ImportMeta['injectName']} [params.platform] - application platform
     * @param {boolean} [params.willThrow] - whether the application will simulate an error
     * @param {boolean} [params.debugState] - whether to show debugging UI
     * @param {string} [params.locale] - for applications strings
     * @param {number} [params.textLength] - what ratio of text should be used. Set a number higher than 1 to have longer strings for testing
     */
    constructor ({
        env = 'production',
        urlParams = new URLSearchParams(location.search),
        platform = 'windows',
        willThrow = urlParams.get('willThrow') === 'true',
        debugState = urlParams.has('debugState'),
        display = 'app',
        locale = 'en',
        textLength = 1
    } = {}) {
        this.display = display
        this.urlParams = urlParams
        this.platform = platform
        this.willThrow = willThrow
        this.debugState = debugState
        this.env = env
        this.locale = locale
        this.textLength = textLength
    }

    /**
     * @param {string|null|undefined} platform
     * @returns {Environment}
     */
    withPlatform (platform) {
        if (!platform) return this
        if (!isPlatform(platform)) return this
        return new Environment({
            ...this,
            platform
        })
    }

    /**
     * @param {string|null|undefined} env
     * @returns {Environment}
     */
    withEnv (env) {
        if (!env) return this
        if (env !== 'production' && env !== 'development') return this

        return new Environment({
            ...this,
            env
        })
    }

    /**
     * @param {string|null|undefined} display
     * @returns {Environment}
     */
    withDisplay (display) {
        if (!display) return this
        if (display !== 'app' && display !== 'components') return this

        return new Environment({
            ...this,
            display
        })
    }

    /**
     * @param {string|null|undefined} locale
     * @returns {Environment}
     */
    withLocale (locale) {
        if (!locale) return this
        if (typeof locale !== 'string') return this
        if (locale.length !== 2) return this

        return new Environment({
            ...this,
            locale
        })
    }

    /**
     * @param {string|number|null|undefined} length
     * @returns {Environment}
     */
    withTextLength (length) {
        if (!length) return this
        const num = Number(length)
        if (num >= 1 && num <= 2) {
            return new Environment({
                ...this,
                textLength: num
            })
        }
        return this
    }
}

/**
 * @param {any} input
 * @returns {input is ImportMeta['injectName']}
 */
function isPlatform (input) {
    /** @type {ImportMeta['injectName'][]} */
    const allowed = ['windows', 'apple', 'integration', 'android']
    return allowed.includes(input)
}
