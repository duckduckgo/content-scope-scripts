import { Fragment, h } from 'preact';
import { useScrollToNewestChip } from './useScrollToNewestChip';
import styles from './AttachmentChips.module.css';

/**
 * A chip in the attachment row. Each attachment type builds its own (e.g. `tabChipItems`), so adding a type doesn't touch this file.
 *
 * @typedef {object} ChipItem
 * @property {string} key
 * @property {number} addedAtRelative - `performance.now()` at attach time.
 * @property {(enteringAnimationDelay: number) => import('preact').VNode} render
 */

/**
 * @param {object} props
 * @param {ChipItem[]} props.items
 */
export function AttachmentChips({ items }) {
    // Ordered by attach time so chips appear in the order the user attached them, not grouped by type.
    const sorted = [...items].sort((a, b) => a.addedAtRelative - b.addedAtRelative);

    const listRef = useScrollToNewestChip(sorted.length);

    if (sorted.length === 0) return null;

    return (
        <div ref={listRef} class={styles.chipsArea} data-testid="omnibar-attachment-chips">
            {sorted.map((item, index) => (
                <Fragment key={item.key}>{item.render(index * 50)}</Fragment>
            ))}
        </div>
    );
}
