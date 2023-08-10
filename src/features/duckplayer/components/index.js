import { DDGVideoOverlay } from './ddg-video-overlay.js'
import { customElementsDefine, customElementsGet } from '../../../captured-globals.js'

/**
 * Register custom elements in this wrapper function to be called only when we need to
 * and also to allow remote-config later if needed.
 *
 */
export function registerCustomElements () {
    if (!customElementsGet(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
        customElementsDefine(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay)
    }
}
