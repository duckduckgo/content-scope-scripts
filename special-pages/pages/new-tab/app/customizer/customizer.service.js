/**
 * @typedef {import("../../types/new-tab.js").CustomizerData} CustomizerData
 * @typedef {import("../../types/new-tab.js").UserImageData} UserImageData
 * @typedef {import("../../types/new-tab.js").UserColorData} UserColorData
 * @typedef {import("../../types/new-tab.js").ThemeData} ThemeData
 * @typedef {import("../../types/new-tab.js").BackgroundData} BackgroundData
 */
import { Service } from '../service.js';

/**
 * @document ./customizer.md
 */

export class CustomizerService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {CustomizerData} initial
     * @internal
     */
    constructor(ntp, initial) {
        this.ntp = ntp;
        /** @type {Service<BackgroundData>} */
        this.bgService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onBackgroundUpdate', cb),
                persist: (data) => {
                    ntp.messaging.notify('customizer_setBackground', data);
                },
            },
            { background: initial.background },
        );
        /** @type {Service<ThemeData>} */
        this.themeService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onThemeUpdate', cb),
            },
            { theme: initial.theme },
        );
        /** @type {Service<UserImageData>} */
        this.imagesService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onImagesUpdate', cb),
            },
            { userImages: initial.userImages },
        );
        /** @type {Service<UserColorData>} */
        this.colorService = new Service(
            {
                subscribe: (cb) => ntp.messaging.subscribe('customizer_onColorUpdate', cb),
            },
            { userColor: initial.userColor },
        );
    }

    /**
     * @internal
     */
    destroy() {
        this.bgService.destroy();
        this.themeService.destroy();
        this.imagesService.destroy();
        this.colorService.destroy();
    }
}
