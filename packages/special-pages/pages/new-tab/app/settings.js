export class Settings {
    /**
     * @param {object} params
     * @param {{name: ImportMeta['platform']}} [params.platform]
     */
    constructor ({
        platform = { name: 'windows' }
    }) {
        this.platform = platform
    }

    /**
     * @param {keyof import("../../../types/duckplayer").DuckPlayerPageSettings} named
     * @param {{state: 'enabled' | 'disabled'} | null | undefined} settings
     * @return {Settings}
     */
    withFeatureState (named, settings) {
        if (!settings) return this
        /** @type {(keyof import("../../../types/duckplayer").DuckPlayerPageSettings)[]} */
        const valid = ['pip', 'autoplay', 'focusMode']
        if (!valid.includes(named)) {
            console.warn(`Excluding invalid feature key ${named}`)
            return this
        }

        if (settings.state === 'enabled' || settings.state === 'disabled') {
            return new Settings({
                ...this,
                [named]: settings
            })
        }
        return this
    }

    withPlatformName (name) {
        /** @type {ImportMeta['platform'][]} */
        const valid = ['windows', 'macos', 'ios', 'android']
        if (valid.includes(/** @type {any} */(name))) {
            return new Settings({
                ...this,
                platform: { name }
            })
        }
        return this
    }
}
