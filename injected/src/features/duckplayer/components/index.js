import { DDGVideoOverlay } from './ddg-video-overlay.js';
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js';
import { DDGVideoOverlayMobile } from './ddg-video-overlay-mobile.js';
import { DDGVideoOverlayMobile as DDGVideoOverlayMobileAlt } from './ddg-video-overlay-mobile-alt.js';
import { DDGVideoDrawerMobile } from './ddg-video-drawer-mobile.js';

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
    if (!customElementsGet(DDGVideoDrawerMobile.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoDrawerMobile.CUSTOM_TAG_NAME, DDGVideoDrawerMobile);
    }
    if (!customElementsGet(DDGVideoOverlayMobileAlt.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoOverlayMobileAlt.CUSTOM_TAG_NAME, DDGVideoOverlayMobileAlt);
    }
}
