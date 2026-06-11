import { h } from 'preact';
import { useState } from 'preact/hooks';
import { GlobeIcon } from '../../../../components/Icons';

/**
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * Tab favicon with a globe fallback when the tab has no favicon or the image
 * fails to load. Sizing is caller-supplied (the picker and mention list differ).
 *
 * @param {object} props
 * @param {Favicon} props.favicon
 * @param {number} props.iconSize - Fallback globe icon size in px.
 * @param {string} props.className - Class for the favicon image.
 * @param {string} props.fallbackClassName - Class for the fallback wrapper.
 */
export function TabFavicon({ favicon, iconSize, className, fallbackClassName }) {
    const [errored, setErrored] = useState(false);
    if (!favicon || !favicon.src || errored) {
        return (
            <span class={fallbackClassName} aria-hidden="true">
                <GlobeIcon width={iconSize} height={iconSize} />
            </span>
        );
    }
    return <img class={className} src={favicon.src} alt="" onError={() => setErrored(true)} loading="lazy" />;
}
