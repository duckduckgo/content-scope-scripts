import { h } from 'preact';
import { ChipRemoveButton } from '../attachments/ChipRemoveButton';
import { TabFavicon } from './TabFavicon';
import styles from './TabChips.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

const FAVICON_LINES = [
    { left: 22, top: 5, width: 10 },
    { left: 22, top: 11, width: 10 },
    { left: 22, top: 17, width: 10 },
    { left: 4, top: 23, width: 28 },
    { left: 4, top: 29, width: 23 },
];

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
                {FAVICON_LINES.map((line, i) => (
                    <span key={i} class={styles.faviconLine} style={{ left: line.left, top: line.top, width: line.width }} />
                ))}
                <span class={styles.faviconCorner}>
                    <TabFavicon favicon={tab.favicon} iconSize={16} className={styles.favicon} fallbackClassName={styles.faviconFallback} />
                </span>
            </span>
            <span class={styles.title} title={tab.title}>
                {tab.title}
            </span>
            <ChipRemoveButton onRemove={onRemove} label={removeLabel} />
        </div>
    );
}
