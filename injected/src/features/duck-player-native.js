import ContentFeature from '../content-feature.js';
// import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/native-messages.js';
import { initDuckPlayerNative } from './duckplayer-native/duckplayer-native.js';

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    init(args) {
        console.log('LOADING DUCK PLAYER NATIVE SCRIPTS', args);
        console.log('Duck Player Native Feature', args?.bundledConfig?.features?.duckPlayerNative);

        /**
         * This feature never operates in a frame
         */
        // if (isBeingFramed()) return;

        const comms = new DuckPlayerNativeMessages(this.messaging);
        initDuckPlayerNative(comms);
    }
}

export default DuckPlayerNativeFeature;
