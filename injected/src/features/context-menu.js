import ContentFeature from '../content-feature.js';
import { getSelectedText, extractElementMetadata } from '../utils/dom-metadata.js';
import { isBeingFramed } from '../utils.js';

/**
 * Replaces the native WebKit "contextmenu" user-script on Apple platforms.
 *
 * Listens for `contextmenu` DOM events (capture phase), collects metadata
 * about the clicked element and current text selection, and notifies the
 * native layer via the isolated C-S-S messaging bridge.
 *
 * This keeps `window.webkit` out of the page world.
 */
export default class ContextMenu extends ContentFeature {
    init() {
        if (isBeingFramed()) return;

        document.addEventListener(
            'contextmenu',
            (event) => {
                const target = /** @type {EventTarget | null} */ (event.target);
                const metadata = extractElementMetadata(target);

                this.notify('contextMenuEvent', {
                    selectedText: getSelectedText(),
                    linkUrl: metadata.href,
                    imageSrc: metadata.src,
                    imageAlt: metadata.alt,
                    title: metadata.title,
                    elementTag: metadata.tagName,
                });
            },
            true,
        );
    }
}
