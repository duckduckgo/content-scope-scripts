import { Fragment, h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { GlobeIcon } from '../../../../components/Icons';
import styles from './MentionPicker.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * @param {object} props
 * @param {TabMetadata[]} props.filtered — Already-filtered tabs from the hook
 * @param {number} props.activeIndex — Index of the currently highlighted row, or -1 when none
 * @param {(index: number) => void} props.onActiveIndexChange — Hover handler that promotes a row to highlighted
 * @param {(tab: TabMetadata) => void} props.onSelect
 * @param {(tabId: string) => boolean} props.isAttached — Whether a tab is already attached, to show its checked state.
 * @param {string} props.listboxId — id assigned to the rendered listbox, used by `aria-controls` on the input
 */
export function MentionPicker({ filtered, activeIndex, onActiveIndexChange, onSelect, isAttached, listboxId }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    return (
        <div class={styles.panel} role="dialog" aria-label={t('omnibar_attachTabsPickerLabel')}>
            {filtered.length === 0 ? (
                <div class={styles.empty}>{t('omnibar_attachTabsNoMatches')}</div>
            ) : (
                <Fragment>
                    <div class={styles.header}>
                        <span class={styles.headerTitle}>{t('omnibar_attachTabsPickerTitle')}</span>
                    </div>
                    <ul class={styles.list} role="listbox" id={listboxId} aria-label={t('omnibar_attachTabsPickerTitle')}>
                        {filtered.map((tab, index) => {
                            const isActive = index === activeIndex;
                            const attached = isAttached(tab.tabId);
                            return (
                                <li
                                    id={`${listboxId}-${tab.tabId}`}
                                    key={tab.tabId}
                                    role="option"
                                    aria-selected={attached}
                                    class={cn(styles.row, isActive && styles.rowActive, attached && styles.rowSelected)}
                                    onMouseDown={(e) => {
                                        // Prevent the textarea from losing focus when the row is clicked.
                                        e.preventDefault();
                                    }}
                                    onMouseEnter={() => onActiveIndexChange(index)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(tab);
                                    }}
                                >
                                    <span class={styles.check} aria-hidden="true" />
                                    <TabFavicon favicon={tab.favicon} />
                                    <span class={styles.rowTitle}>{tab.title}</span>
                                </li>
                            );
                        })}
                    </ul>
                </Fragment>
            )}
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
