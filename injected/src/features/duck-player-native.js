import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { setupDuckPlayerForNoCookie, setupDuckPlayerForSerp, setupDuckPlayerForYouTube } from './duckplayer-native/duckplayer-native.js';
import { Environment } from './duckplayer/environment.js';

/**
 * @import {DuckPlayerNativePage} from './duckplayer-native/duckplayer-native.js'
 * @import {DuckPlayerNativeSettings} from '@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js'
 * @import {UrlChangeSettings} from './duckplayer-native/messages.js'
 */

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 * @property {UrlChangeSettings['pageType']} pageType - The type of the current page
 * @property {boolean} playbackPaused - Should video start playing or paused
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    /** @type {{init: () => void, destroy: () => void} | null} */
    currentPage;

    async init(args) {
        console.log('Duck Player Native loading...', args, window.location.href);

        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;

        const selectors = this.getFeatureSetting('selectors');
        if (!selectors) {
            console.warn('No selectors found. Check remote config. Feature will not be initialized.');
            return;
        }

        const locale = args?.locale || args?.language || 'en';
        const env = new Environment({
            debug: this.isDebug,
            injectName: import.meta.injectName,
            platform: this.platform,
            locale,
        });

        const messages = new DuckPlayerNativeMessages(this.messaging, env);
        messages.subscribeToURLChange(({ pageType }) => {
            const playbackPaused = false; // This can be added to the event data in the future if needed
            this.urlChanged(pageType, selectors, playbackPaused, env, messages);
        });

        /** @type {InitialSettings} */
        let initialSetup;

        try {
            initialSetup = await messages.initialSetup();
        } catch (e) {
            console.warn('Failed to get initial setup', e);
            return;
        }

        console.log('INITIAL SETUP', initialSetup);

        if (initialSetup.pageType) {
            const playbackPaused = initialSetup.playbackPaused || false;
            this.urlChanged(initialSetup.pageType, selectors, playbackPaused, env, messages);
        }
    }

    /**
     *
     * @param {UrlChangeSettings['pageType']} pageType
     * @param {DuckPlayerNativeSettings['selectors']} selectors
     * @param {boolean} playbackPaused
     * @param {Environment} env
     * @param {DuckPlayerNativeMessages} messages
     */
    urlChanged(pageType, selectors, playbackPaused, env, messages) {
        /** @type {DuckPlayerNativePage | null} */
        let nextPage = null;

        switch (pageType) {
            case 'NOCOOKIE':
                nextPage = setupDuckPlayerForNoCookie(selectors, env, messages);
                break;
            case 'YOUTUBE':
                nextPage = setupDuckPlayerForYouTube(selectors, playbackPaused, env, messages);
                break;
            case 'SERP':
                nextPage = setupDuckPlayerForSerp(selectors, env, messages);
                break;
            case 'UNKNOWN':
            default:
                console.warn('No known pageType');
        }

        if (this.currentPage) {
            this.currentPage.destroy();
        }

        if (nextPage) {
            nextPage.init();
            this.currentPage = nextPage;
        }
    }
}

export default DuckPlayerNativeFeature;
