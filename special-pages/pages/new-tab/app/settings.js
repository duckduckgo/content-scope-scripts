export class Settings {
    /**
     * @param {object} params
     * @param {{name: ImportMeta['platform']}} [params.platform]
     * @param {{state: 'enabled' | 'disabled'}} [params.customizerDrawer]
     */
    constructor({ platform = { name: 'macos' }, customizerDrawer = { state: 'disabled' } }) {
        this.platform = platform;
        this.customizerDrawer = customizerDrawer;
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
     * @param {keyof import("../types/new-tab.js").NewTabPageSettings} named
     * @param {{state: 'enabled' | 'disabled'} | null | undefined} settings
     * @return {Settings}
     */
    withFeatureState(named, settings) {
        if (!settings) return this;
        /** @type {(keyof import("../types/new-tab.js").NewTabPageSettings)[]} */
        const valid = ['customizerDrawer'];
        if (!valid.includes(named)) {
            console.warn(`Excluding invalid feature key ${named}`);
            return this;
        }

        if (settings.state === 'enabled' || settings.state === 'disabled') {
            return new Settings({
                ...this,
                [named]: settings,
            });
        }
        return this;
    }
}
