import ContentFeature from '../content-feature.js';
// import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { mockTransport } from './duckplayer-native/mock-transport.js';
import { setupDuckPlayerForNoCookie, setupDuckPlayerForSerp, setupDuckPlayerForYouTube } from './duckplayer-native/duckplayer-native.js';
import { Environment } from './duckplayer-native/environment.js';

/** @import {DuckPlayerNative} from './duckplayer-native/duckplayer-native.js' */

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    /** @type {DuckPlayerNative} */
    current;

    init(args) {
        console.log('DUCK PLAYER NATIVE LOADING', args);

        // TODO: May depend on page type
        /**
         * This feature never operates in a frame
         */
        // if (isBeingFramed()) return;

        /**
         * @type {import("@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js").DuckPlayerNativeSettings['selectors']}
         */
        const selectors = this.getFeatureSetting('selectors');
        console.log('DUCK PLAYER NATIVE SELECTORS', selectors);

        const locale = args?.locale || args?.language || 'en';
        const env = new Environment({
            debug: this.isDebug,
            injectName: import.meta.injectName,
            platform: this.platform,
            locale,
        });

        // TODO: Decide which feature to run

        if (env.isIntegrationMode()) {
            // TODO: Better way than patching transport?
            this.messaging.transport = mockTransport();
        }

        const comms = new DuckPlayerNativeMessages(this.messaging);
        const settings = { selectors };

        comms.subscribeToURLChange(({ pageType }) => {
            console.log('GOT PAGE TYPE', pageType);
            let next;

            switch (pageType) {
                case 'NOCOOKIE':
                    next = setupDuckPlayerForNoCookie(settings, env, comms);
                    break;
                case 'YOUTUBE':
                    next = setupDuckPlayerForYouTube(settings, env, comms);
                    break;
                case 'SERP':
                    next = setupDuckPlayerForSerp(settings, env, comms);
                    break;
                case 'UNKNOWN':
                default:
                    console.warn('No known pageType');
            }

            if (next) {
                if (this.current) {
                    this.current.destroy();
                }
                next.init();
                this.current = next;
            }
        });

        /** Fire onReady event */
        comms.notifyFeatureIsReady();
    }
}

export default DuckPlayerNativeFeature;
