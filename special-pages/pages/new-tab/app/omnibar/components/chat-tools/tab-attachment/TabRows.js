import { h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import cn from 'classnames';
import { Check10Icon } from '../../../../components/Icons';
import { TabFavicon } from './TabFavicon';
import styles from './TabRows.module.css';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * An open-tab row inside the attach {@link Dropdown}. Satisfies the same contract as
 * `DropdownItem` (Dropdown injects `id`, `isActive`, `onMouseOver`, and `onClick`), but owns
 * its layout: optional checkmark gutter, favicon, ellipsizing title.
 *
 * @param {object} props
 * @param {TabMetadata} props.tab
 * @param {boolean} props.showGutter - Reserve the checkmark gutter so titles stay aligned.
 * @param {boolean} props.isAttached
 * @param {() => void} props.onSelect - Read only by Dropdown's wiring; makes the row navigable.
 * @param {boolean} [props.isActive]
 * @param {string} [props.id]
 * @param {(e: MouseEvent) => void} [props.onMouseOver]
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
export function TabRow({ tab, showGutter, isAttached, isActive = false, id, onMouseOver, onClick }) {
    const itemRef = useRef(/** @type {HTMLLIElement | null} */ (null));

    useLayoutEffect(() => {
        if (isActive) itemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [isActive]);

    return (
        <li
            ref={itemRef}
            id={id}
            role="menuitemcheckbox"
            aria-checked={isAttached}
            class={cn(styles.tabItem, isActive && styles.tabItemActive)}
            onMouseOver={onMouseOver}
            onClick={onClick}
        >
            {showGutter && (
                <span class={styles.checkGutter} aria-hidden="true">
                    {isAttached && <Check10Icon />}
                </span>
            )}
            <TabFavicon favicon={tab.favicon} iconSize={12} className={styles.favicon} fallbackClassName={styles.faviconFallback} />
            <span class={styles.tabTitle}>{tab.title || tab.url}</span>
        </li>
    );
}

/**
 * Non-interactive status row ("Loading tabs…" / "No open tabs"), skipped by keyboard navigation.
 *
 * @param {object} props
 * @param {string} props.text
 */
export function TabStatusRow({ text }) {
    return (
        <li role="presentation" class={styles.statusItem}>
            <span class={styles.statusText}>{text}</span>
        </li>
    );
}

/**
 * "Recent Tabs" section header. `showGutter` pads it to align with rows that reserve a checkmark gutter.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {boolean} props.showGutter
 */
export function TabsSectionHeader({ label, showGutter }) {
    return (
        <li role="presentation" class={cn(styles.sectionHeader, showGutter && styles.sectionHeaderGutter)}>
            {label}
        </li>
    );
}
