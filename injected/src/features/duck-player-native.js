import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/native-messages.js';
import { initDuckPlayerNative } from './duckplayer-native/duckplayer-native.js';

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} version - TODO: this is only here to test config. Replace with actual settings.
 */

export class DuckPlayerNative extends ContentFeature {
    init() {
        if (this.platform.name !== 'ios') return;

        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;

        const comms = new DuckPlayerNativeMessages(this.messaging);
        initDuckPlayerNative(comms);
    }
}

export default DuckPlayerNative;
