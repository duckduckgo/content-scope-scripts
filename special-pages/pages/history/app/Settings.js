export class Settings {
    /**
     * @param {object} params
     * @param {{name: 'macos' | 'windows'}} [params.platform]
     * @param {number} [params.typingDebounce=500] how long to debounce typing in the search field
     */
    constructor({ platform = { name: 'macos' }, typingDebounce = 100 }) {
        this.platform = platform;
        this.typingDebounce = typingDebounce;
    }

    withPlatformName(name) {
        /** @type {ImportMeta['platform'][]} */
        const valid = ['windows', 'macos'];
        if (valid.includes(/** @type {any} */ (name))) {
            return new Settings({
                ...this,
                platform: { name },
            });
        }
        return this;
    }

    /**
     * @param {null|undefined|number|string} value
     */
    withDebounce(value) {
        if (!value) return this;
        const input = String(value).trim();
        if (input.match(/^\d+$/)) {
            return new Settings({
                ...this,
                typingDebounce: parseInt(input, 10),
            });
        }
        return this;
    }
}
