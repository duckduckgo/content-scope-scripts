import ContentFeature from '../content-feature.js';

export class Favicon extends ContentFeature {
    /** @type {undefined|number} */
    #debounce = undefined;
    init() {
        window.addEventListener('DOMContentLoaded', () => {
            // send once, immediately
            this.send();

            // then optionally watch for changes
            this.monitorChanges();
        });
    }

    monitorChanges() {
        // if there was an explicit opt-out, do nothing
        if (this.getFeatureSetting('monitor') === false) return;

        // otherwise, monitor and send updates
        monitor(() => {
            clearTimeout(this.#debounce);
            const id = setTimeout(() => this.send(), 100);
            this.#debounce = /** @type {any} */ (id);
        });
    }

    send() {
        const favicons = getFaviconList();
        this.notify('faviconFound', { favicons, documentUrl: document.URL });
    }
}

export default Favicon;

/**
 * @param {()=>void} changeObservedCallback
 * @param {Element} [target]
 */
function monitor(changeObservedCallback, target = document.head) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target instanceof HTMLLinkElement) {
                changeObservedCallback();
                break;
            }
        }
    });
    observer.observe(target, { attributeFilter: ['rel', 'href'], attributes: true, subtree: true });
}

/**
 * @returns {import('../types/favicon.js').FaviconAttrs[]}
 */
function getFaviconList() {
    const selectors = [
        "link[href][rel='favicon']",
        "link[href][rel*='icon']",
        "link[href][rel='apple-touch-icon']",
        "link[href][rel='apple-touch-icon-precomposed']",
    ];
    const elements = document.head.querySelectorAll(selectors.join(','));
    return Array.from(elements).map((x) => {
        const href = x.getAttribute('href') || '';
        const rel = x.getAttribute('rel') || '';
        return { href, rel };
    });
}
