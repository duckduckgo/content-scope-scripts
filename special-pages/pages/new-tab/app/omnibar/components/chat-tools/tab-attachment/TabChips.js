import { h } from 'preact';
import { useState } from 'preact/hooks';
import { CloseSmallIcon, GlobeIcon } from '../../../../components/Icons';
import styles from './TabChips.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * A single attached-tab chip: favicon, title, and a remove button. Rendered by
 * the shared `AttachmentChips` container, which owns the row layout. Shows only
 * the tab's metadata — page content is extracted lazily on submit, so there is
 * no per-chip loading state.
 *
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
    if (!favicon || !favicon.src || errored) {
        return (
            <span class={styles.faviconFallback} aria-hidden="true">
                <GlobeIcon width="14" height="14" />
            </span>
        );
    }
    return <img class={styles.favicon} src={favicon.src} alt="" onError={() => setErrored(true)} loading="lazy" />;
}
