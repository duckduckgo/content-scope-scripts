import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

/**
 * Notifies the native layer when the page DOM has loaded.
 * Runs in the isolated world to keep WebKit message handlers
 * out of the page's JavaScript context.
 */
export class PageObserver extends ContentFeature {
    init() {
        // Only operate in the main frame
        if (isBeingFramed()) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.domLoaded(), { once: true });
        } else {
            // DOM already parsed (e.g. script ran late)
            this.domLoaded();
        }
    }

    domLoaded() {
        this.notify('domLoaded', {});
    }
}

export default PageObserver;
