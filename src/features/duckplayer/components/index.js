import { DDGVideoOverlay } from './ddg-video-overlay.js'

/**
 * Register custom elements in this wrapper function to be called only when we need to
 * and also to allow remote-config later if needed.
 */
export function registerCustomElements () {
    if (!customElements.get(DDGVideoOverlay.CUSTOM_TAG_NAME)) {
        customElements.define(DDGVideoOverlay.CUSTOM_TAG_NAME, DDGVideoOverlay)
    }
}
