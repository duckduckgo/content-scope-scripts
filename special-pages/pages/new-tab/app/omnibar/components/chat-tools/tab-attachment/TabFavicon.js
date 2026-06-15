import { h } from 'preact';
import { useState } from 'preact/hooks';
import { GlobeIcon } from '../../../../components/Icons';

/**
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * @param {object} props
 * @param {Favicon} props.favicon
 * @param {number} props.iconSize
 * @param {string} props.className
 * @param {string} props.fallbackClassName
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
