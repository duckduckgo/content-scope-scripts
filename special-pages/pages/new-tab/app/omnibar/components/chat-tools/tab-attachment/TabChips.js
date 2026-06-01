import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { CloseSmallIcon, GlobeIcon } from '../../../../components/Icons';
import styles from './TabChips.module.css';

/**
 * @typedef {import('./useTabAttachments').AttachedTab} AttachedTab
 */

/**
 * A single attached-tab chip: favicon, title, and a remove button. Rendered by
 * the shared `AttachmentChips` container, which owns the row layout.
 *
 * @param {object} props
 * @param {AttachedTab} props.tab
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
export function TabChip({ tab, onRemove, removeLabel }) {
    return (
        <div class={cn(styles.chip, tab.status === 'pending' && styles.chipPending)} data-attachment-kind="tab" data-status={tab.status}>
            <TabFavicon favicon={tab.metadata.favicon} />
            <span class={styles.title} title={tab.metadata.title}>
                {tab.metadata.title}
            </span>
            <button type="button" tabIndex={0} class={styles.remove} aria-label={removeLabel} onClick={onRemove}>
                <CloseSmallIcon width="10" height="10" />
            </button>
        </div>
    );
}

/**
 * @param {object} props
 * @param {import('../../../../../types/new-tab.js').Favicon} props.favicon
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
