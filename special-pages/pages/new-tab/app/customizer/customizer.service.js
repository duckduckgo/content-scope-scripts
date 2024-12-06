/**
 * @typedef {import("../../types/new-tab.js").CustomizerData} CustomizerData
 */
import { Service } from '../service.js';

/**
 * @document ./customizer.md
 */

export class CustomizerService {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {CustomizerData} initial
     * @internal
     */
    constructor(ntp, initial) {
        this.ntp = ntp;
        /** @type {Service<CustomizerData['background']>} */
        this.bgService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onBackgroundUpdate', cb),
                persist: (data) => {
                    ntp.messaging.notify('customizer_setBackground', { background: data });
                },
            },
            initial.background,
        );
        /** @type {Service<CustomizerData['theme']>} */
        this.themeService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onThemeUpdate', cb),
            },
            initial.theme,
        );
        /** @type {Service<CustomizerData['userImages']>} */
        this.imagesService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onImagesUpdate', cb),
            },
            initial.userImages,
        );
    }

    /**
     * @internal
     */
    destroy() {
        this.bgService.destroy();
        this.themeService.destroy();
        this.imagesService.destroy();
    }

    /**
     * @param {(evt: {data: CustomizerData['background'], source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onBackground(cb) {
        return this.bgService.onData(cb);
    }
    /**
     * @param {(evt: {data: CustomizerData['theme'], source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onTheme(cb) {
        return this.themeService.onData(cb);
    }
    /**
     * @param {(evt: {data: CustomizerData['userImages'], source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onImages(cb) {
        return this.imagesService.onData(cb);
    }

    /**
     * @param {CustomizerData['background']} bg
     */
    setBackground(bg) {
        this.bgService.update((data) => {
            return bg;
        });
    }

    /**
     * @param {string} id
     */
    deleteImage(id) {
        this.imagesService.update((data) => {
            return data.filter((img) => img.id !== id);
        });
        this.ntp.messaging.notify('customizer_deleteImage', { id });
    }

    /**
     *
     */
    upload() {
        this.ntp.messaging.notify('customizer_upload');
    }

    /**
     * @param {import('../../types/new-tab').CustomizerData['theme']} theme
     */
    setTheme(theme) {
        this.themeService.update((_data) => {
            return theme;
        });
        this.ntp.messaging.notify('customizer_setTheme', { theme });
    }
}
