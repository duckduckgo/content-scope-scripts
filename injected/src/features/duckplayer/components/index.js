import { DDGVideoOverlay } from './ddg-video-overlay.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';
import { DDGVideoOverlayMobile } from './ddg-video-overlay-mobile.js';
import { DDGVideoToastMobile } from './ddg-video-toast-mobile.js';

/**
 * Register custom elements in this wrapper function to be called only when we need to
 * and also to allow remote-config later if needed.
 *
 */
export function registerCustomElements() {
    if (!customElementsGet(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay);
    }
    if (!customElementsGet(DDGVideoOverlayMobile.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoOverlayMobile.CUSTOM_TAG_NAME, DDGVideoOverlayMobile);
    }
    if (!customElementsGet(DDGVideoToastMobile.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoToastMobile.CUSTOM_TAG_NAME, DDGVideoToastMobile);
    }
}
