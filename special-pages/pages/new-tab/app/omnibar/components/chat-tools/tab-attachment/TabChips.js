import { h } from 'preact';
import { ChipRemoveButton } from '../attachments/ChipRemoveButton';
import { TabFavicon } from './TabFavicon';
import styles from './TabChips.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
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
            <span class={styles.faviconTile} aria-hidden="true">
                <TabFavicon favicon={tab.favicon} iconSize={18} className={styles.favicon} fallbackClassName={styles.faviconFallback} />
            </span>
            <span class={styles.title} title={tab.title}>
                {tab.title}
            </span>
            <ChipRemoveButton className={styles.remove} onRemove={onRemove} label={removeLabel} />
        </div>
    );
}
