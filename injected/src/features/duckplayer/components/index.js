import { DDGVideoOverlay } from './ddg-video-overlay.js';
import { ddgGlobals } from '../../../captured-globals.js';
import { DDGVideoOverlayMobile } from './ddg-video-overlay-mobile.js';
import { DDGVideoThumbnailOverlay } from './ddg-video-thumbnail-overlay-mobile.js';
import { DDGVideoDrawerMobile } from './ddg-video-drawer-mobile.js';

/**
 * Register custom elements in this wrapper function to be called only when we need to
 * and also to allow remote-config later if needed.
 *
 */
export function registerCustomElements() {
    if (!ddgGlobals.customElementsGet(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
        ddgGlobals.customElementsDefine(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay);
    }
    if (!ddgGlobals.customElementsGet(DDGVideoOverlayMobile.CUSTOM_TAG_NAME)) {
        ddgGlobals.customElementsDefine(DDGVideoOverlayMobile.CUSTOM_TAG_NAME, DDGVideoOverlayMobile);
    }
    if (!ddgGlobals.customElementsGet(DDGVideoDrawerMobile.CUSTOM_TAG_NAME)) {
        ddgGlobals.customElementsDefine(DDGVideoDrawerMobile.CUSTOM_TAG_NAME, DDGVideoDrawerMobile);
    }
    if (!ddgGlobals.customElementsGet(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME)) {
        ddgGlobals.customElementsDefine(DDGVideoThumbnailOverlay.CUSTOM_TAG_NAME, DDGVideoThumbnailOverlay);
    }
}
