import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { CloseSmallIcon, GlobeIcon } from '../../../../components/Icons';
import styles from './TabChips.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./useTabAttachments').AttachedTab} AttachedTab
 */

/**
 * Renders the row of chips for attached tabs above the AI chat toolbar. Empty
 * arrays render nothing — the caller should still mount the component so the
 * area can fade in/out without layout jumps.
 *
 * @param {object} props
 * @param {AttachedTab[]} props.attachedTabs
 * @param {(tabId: string) => void} props.onRemove
 */
export function TabChips({ attachedTabs, onRemove }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    if (attachedTabs.length === 0) return null;

    return (
        <div class={styles.chipsArea} data-testid="omnibar-tab-chips">
            {attachedTabs.map((tab) => (
                <TabChip
                    key={tab.tabId}
                    tab={tab}
                    onRemove={() => onRemove(tab.tabId)}
                    removeLabel={t('omnibar_removeAttachedTabLabel', { title: tab.metadata.title })}
                />
            ))}
        </div>
    );
}

/**
 * @param {object} props
 * @param {AttachedTab} props.tab
 * @param {() => void} props.onRemove
 * @param {string} props.removeLabel
 */
function TabChip({ tab, onRemove, removeLabel }) {
    return (
        <div class={cn(styles.chip, tab.status === 'pending' && styles.chipPending)} data-status={tab.status}>
            <TabFavicon favicon={tab.metadata.favicon} />
            <span class={styles.title} title={tab.metadata.title}>
                {tab.metadata.title}
            </span>
            <button type="button" class={styles.remove} aria-label={removeLabel} onClick={onRemove}>
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
