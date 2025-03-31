import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

export class DuckPlayerNative extends ContentFeature {
    init() {
        if (this.platform.name !== 'ios') return;

        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;
    }
}

export default DuckPlayerNative;
