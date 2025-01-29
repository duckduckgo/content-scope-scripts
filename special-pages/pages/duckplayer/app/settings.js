export class Settings {
    /**
     * @param {object} params
     * @param {{name: ImportMeta['platform']}} [params.platform]
     * @param {{state: 'enabled' | 'disabled'}} [params.pip]
     * @param {{state: 'enabled' | 'disabled'}} [params.autoplay]
     * @param {{state: 'enabled' | 'disabled'}} [params.focusMode]
     */
    constructor({
        platform = { name: 'macos' },
        pip = { state: 'disabled' },
        autoplay = { state: 'enabled' },
        focusMode = { state: 'enabled' },
    }) {
        this.platform = platform;
        this.pip = pip;
        this.autoplay = autoplay;
        this.focusMode = focusMode;
    }

    /**
     * @param {keyof import("../types/duckplayer.js").DuckPlayerPageSettings} named
     * @param {{state: 'enabled' | 'disabled'} | null | undefined} settings
     * @return {Settings}
     */
    withFeatureState(named, settings) {
        if (!settings) return this;
        /** @type {(keyof import("../types/duckplayer.js").DuckPlayerPageSettings)[]} */
        const valid = ['pip', 'autoplay', 'focusMode'];
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
     * @param {string|null|undefined} newState
     * @return {Settings}
     */
    withDisabledFocusMode(newState) {
        if (newState === 'disabled' || newState === 'enabled') {
            return new Settings({
                ...this,
                focusMode: { state: newState },
            });
        }

        return this;
    }

    /**
     * @return {string}
     */
    get youtubeBase() {
        switch (this.platform.name) {
            case 'windows':
            case 'ios':
            case 'android': {
                return 'duck://player/openInYoutube';
            }
            case 'macos': {
                return 'https://www.youtube.com/watch';
            }
            default:
                throw new Error('unreachable');
        }
    }

    /**
     * @return {'desktop' | 'mobile'}
     */
    get layout() {
        switch (this.platform.name) {
            case 'windows':
            case 'macos': {
                return 'desktop';
            }
            case 'ios':
            case 'android': {
                return 'mobile';
            }
            default:
                return 'desktop';
        }
    }

    /**
     * Enables sending events to video embed
     *
     * @returns {boolean}
     */
    get playbackEvents() {
        return this.layout === 'desktop';
    }
}
