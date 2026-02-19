import ContentFeature from '../content-feature.js';

/**
 * Forwards hovered link URLs to the native layer so the browser
 * can display them in the status bar. Runs in the isolated world
 * to keep the WebKit message handler out of the page's JS context.
 *
 * Sends every mouseover — deduplication is handled natively.
 */
export class Hover extends ContentFeature {
    init() {
        document.addEventListener(
            'mouseover',
            (event) => {
                if (!(event.target instanceof Element)) return;
                const anchor = event.target.closest('a');
                const href = anchor instanceof HTMLAnchorElement ? anchor.href : null;
                this.notify('hoverChanged', { href });
            },
            true,
        );
    }
}

export default Hover;
