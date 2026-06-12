import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CloseSmallIcon, GlobeIcon } from '../../../../components/Icons';
import styles from './TabChips.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * @param {object} props
 * @param {TabMetadata} props.tab
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function TabChip({ tab, onRemove, removeLabel }) {
    return (
        <div class={styles.chip} data-attachment-kind="tab">
            <TabFavicon favicon={tab.favicon} />
            <span class={styles.title} title={tab.title}>
                {tab.title}
            </span>
            <button type="button" tabIndex={0} class={styles.remove} aria-label={removeLabel} onClick={onRemove}>
                <CloseSmallIcon width="10" height="10" />
            </button>
        </div>
    );
}

/**
 * @param {object} props
 * @param {Favicon} props.favicon
 */
function TabFavicon({ favicon }) {
    const [errored, setErrored] = useState(false);
    const showFallback = !favicon || !favicon.src || errored;
    return (
        <span class={styles.faviconTile} aria-hidden="true">
            {showFallback ? (
                <GlobeIcon width="18" height="18" />
            ) : (
                <img class={styles.favicon} src={favicon.src} alt="" onError={() => setErrored(true)} loading="lazy" />
            )}
        </span>
    );
}
