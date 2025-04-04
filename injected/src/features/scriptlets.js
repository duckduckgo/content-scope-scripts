import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { trustedSetAttr } from '../../Scriptlets/src/scriptlets/trusted-set-attr.js'

export class Scriptlets extends ContentFeature {
    init() {
        if (isBeingFramed()) {
            return;
        }
        trustedSetAttr({}, 'test', 'test', '');
    }
}

export default Scriptlets;