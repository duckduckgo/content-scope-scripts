import { useEffect } from 'preact/hooks';
import { usePlatformName } from '../../types.js';
import { eventToTarget } from '../../../../../shared/handlers.js';
import { useHistoryServiceDispatch } from '../Providers/HistoryServiceProvider.js';

/**
 * Registers click event handlers for anchor links (`<a>` elements) having `href` and `data-url` attributes.
 * Directs the `click` events with these links to interact with the provided history service.
 *
 * - Anchors with `data-url` attribute are intercepted, and their URLs are processed to determine
 *   the target action (`new-tab`, `same-tab`, or `new-window`) based on the click event details.
 * - Prevents default navigation and propagation for handled events.
 */
export function useLinkClickHandler() {
    const platformName = usePlatformName();
    const dispatch = useHistoryServiceDispatch();
    useEffect(() => {
        /**
         * Handles click events on the document, intercepting interactions with anchor elements
         * that specify both `href` and `data-url` attributes.
         *
         * @param {MouseEvent} event - The mouse event triggered by a click.
         * @returns {void} - No return value.
         */
        function clickHandler(event) {
            if (!(event.target instanceof Element)) return;
            const anchor = /** @type {HTMLAnchorElement|null} */ (event.target.closest('a[href][data-url]'));
            if (anchor) {
                const url = anchor.dataset.url;
                if (!url) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platformName);
                dispatch({ kind: 'open-url', url, target });
            }
        }

        document.addEventListener('click', clickHandler);
        return () => {
            document.removeEventListener('click', clickHandler);
        };
    }, []);
}
