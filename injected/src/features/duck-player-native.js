import ContentFeature from '../content-feature.js';
// import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { mockTransport } from './duckplayer-native/mock-transport.js';
import { DuckPlayerNative } from './duckplayer-native/duckplayer-native.js';
import { Environment } from './duckplayer-native/environment.js';

/**
 * @typedef {'UNKNOWN'|'YOUTUBE'|'NOCOOKIE'|'SERP'} PageType
 */

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 * @property {PageType} pageType - The type of page that has been loaded
 */

export class DuckPlayerNativeFeature extends ContentFeature {
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
        // @ts-expect-error TODO: Fix this
        const duckPlayerNative = new DuckPlayerNative({ selectors }, env, comms);
        duckPlayerNative.init();
    }
}

export default DuckPlayerNativeFeature;
