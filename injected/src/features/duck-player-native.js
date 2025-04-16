import ContentFeature from '../content-feature.js';
// import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { mockTransport } from './duckplayer-native/mock-transport.js';
import { DuckPlayerNative } from './duckplayer-native/duckplayer-native.js';
import { Environment } from './duckplayer-native/environment.js';

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    init(args) {
        console.log('[duckplayer-native] Loading', args);

        // TODO: Should we keep this?
        /**
         * This feature never operates in a frame
         */
        // if (isBeingFramed()) return;

        /**
         * @type {import("@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js").DuckPlayerNativeSettings}
         */
        // TODO: Why isn't this working?
        // const settings = this.getFeatureSetting('settings');
        const settings = args?.featureSettings?.duckPlayerNative;
        console.log('[duckplayer-native] Selectors', settings?.selectors);

        const locale = args?.locale || args?.language || 'en';
        const env = new Environment({
            debug: this.isDebug,
            injectName: import.meta.injectName,
            platform: this.platform,
            locale,
        });

        if (env.isIntegrationMode()) {
            // TODO: Better way than patching transport?
            this.messaging.transport = mockTransport();
        }

        const comms = new DuckPlayerNativeMessages(this.messaging);
        const duckPlayerNative = new DuckPlayerNative(settings, env, comms);
        duckPlayerNative.init();
    }
}

export default DuckPlayerNativeFeature;
