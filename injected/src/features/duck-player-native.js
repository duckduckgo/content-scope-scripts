import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { mockTransport } from './duckplayer-native/mock-transport.js';
import { setupDuckPlayerForNoCookie, setupDuckPlayerForSerp, setupDuckPlayerForYouTube } from './duckplayer-native/duckplayer-native.js';
import { Environment } from './duckplayer-native/environment.js';

/**
 * @import {DuckPlayerNative} from './duckplayer-native/duckplayer-native.js'
 * @import {DuckPlayerNativeSettings} from '@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js'
 * @import {UrlChangeSettings} from './duckplayer-native/messages.js'
 */

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 * @property {UrlChangeSettings['pageType']} pageType - The type of the current page
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    /** @type {DuckPlayerNative} */
    current;

    async init(args) {
        console.log('DUCK PLAYER NATIVE LOADING', args, window.location.href); // TODO: REMOVE

        // TODO: May depend on page type
        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) {
            console.log('FRAMED. ABORTING.'); // TODO: REMOVE
            return;
        }

        const selectors = this.getFeatureSetting('selectors');
        console.log('DUCK PLAYER NATIVE SELECTORS', selectors); // TODO: REMOVE

        const locale = args?.locale || args?.language || 'en';
        const env = new Environment({
            debug: this.isDebug || true, // TODO: REMOVE
            injectName: import.meta.injectName,
            platform: this.platform,
            locale,
        });

        // TODO: Decide which feature to run

        if (env.isIntegrationMode()) {
            // TODO: Better way than patching transport?
            this.messaging.transport = mockTransport();
        }

        const messages = new DuckPlayerNativeMessages(this.messaging);
        messages.subscribeToURLChange(({ pageType }) => {
            console.log('GOT PAGE TYPE', pageType);
            this.urlChangeHandler(pageType, selectors, env, messages);
        });

        /** @type {InitialSettings} */
        let initialSetup;

        // TODO: This seems to get initted twice. Check with Daniel
        try {
            initialSetup = await messages.initialSetup();
        } catch (e) {
            console.error(e);
            return;
        }

        console.log('INITIAL SETUP', initialSetup);

        if (initialSetup.pageType) {
            console.log('GOT INITIAL PAGE TYPE', initialSetup.pageType); // TODO: REMOVE
            this.urlChangeHandler(initialSetup.pageType, selectors, env, messages);
        }
    }

    /**
     *
     * @param {UrlChangeSettings['pageType']} pageType
     * @param {DuckPlayerNativeSettings['selectors']} selectors
     * @param {Environment} env
     * @param {DuckPlayerNativeMessages} messages
     */
    urlChangeHandler(pageType, selectors, env, messages) {
        let next;

        switch (pageType) {
            case 'NOCOOKIE':
                next = setupDuckPlayerForNoCookie(selectors, env, messages);
                break;
            case 'YOUTUBE':
                next = setupDuckPlayerForYouTube(selectors, env, messages);
                break;
            case 'SERP':
                next = setupDuckPlayerForSerp(selectors, env, messages);
                break;
            case 'UNKNOWN':
            default:
                console.warn('No known pageType');
        }

        if (this.current) {
            console.log('DESTROYING CURRENT INSTANCE', this.current);
            this.current.destroy();
        }

        if (next) {
            console.log('LOADING NEXT INSTANCE', next);
            next.init();
            this.current = next;
        }
    }
}

export default DuckPlayerNativeFeature;
