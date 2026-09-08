import { Fragment, h } from 'preact';
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { usePlatformName } from '../../../../settings.provider';
import { Check12Icon, SearchIcon } from '../../../../components/Icons';
import { OpenTabsContext } from './OpenTabsProvider';
import { TabFavicon } from './TabFavicon';
import { filterTabs } from './tabFilter';
import styles from './AttachTabsModal.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * "Add Tabs" dialog opened from the attach dropdown: searchable checkbox rows for all open tabs.
 * Selection is staged locally and only committed on "Add" (diffed via `onToggleTab`); Cancel,
 * Escape, and backdrop clicks discard it. Mounted only while open, so state re-seeds per open.
 *
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {(tab: TabMetadata) => void} props.onToggleTab
 * @param {(tabId: string) => boolean} props.isAttached
 * @param {number} [props.maxTabs] - Selection cap; absent means no limit.
 */
export function AttachTabsModal({ onClose, onToggleTab, isAttached, maxTabs = Number.POSITIVE_INFINITY }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { openTabs, isLoadingTabs, refetchTabs } = useContext(OpenTabsContext);

    const seedStagedIds = () => new Set(openTabs.filter((tab) => isAttached(tab.tabId)).map((tab) => tab.tabId));

    const [stagedTabIds, setStagedTabIds] = useState(seedStagedIds);
    const [searchQuery, setSearchQuery] = useState('');
    const [wasLoading, setWasLoading] = useState(isLoadingTabs);

    // Re-seed once loading settles, so tabs attached before the list arrived aren't silently detached.
    if (isLoadingTabs !== wasLoading) {
        setWasLoading(isLoadingTabs);
        if (wasLoading && !isLoadingTabs) {
            setStagedTabIds(seedStagedIds());
        }
    }

    const dialogRef = useRef(/** @type {HTMLDialogElement|null} */ (null));
    const searchInputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        dialogRef.current?.showModal();
        refetchTabs();
        searchInputRef.current?.focus();
    }, [refetchTabs]);

    /** @param {TabMetadata} tab */
    const toggleStaged = (tab) => {
        setStagedTabIds((prev) => {
            const next = new Set(prev);
            if (next.has(tab.tabId)) {
                next.delete(tab.tabId);
            } else {
                next.add(tab.tabId);
            }
            return next;
        });
    };

    const atMaxSelection = stagedTabIds.size >= maxTabs;
    const visibleTabs = useMemo(() => filterTabs(openTabs, searchQuery), [openTabs, searchQuery]);

    const handleAttach = () => {
        for (const tab of openTabs) {
            const wasAttached = isAttached(tab.tabId);
            const isStaged = stagedTabIds.has(tab.tabId);
            if (isStaged !== wasAttached) {
                onToggleTab(tab);
            }
        }
        onClose();
    };

    const renderRows = () => {
        if (isLoadingTabs) {
            return <StatusRow text={t('omnibar_attachTabsLoading')} />;
        }
        if (visibleTabs.length === 0) {
            return <StatusRow text={searchQuery ? t('omnibar_attachTabsNoMatches') : t('omnibar_attachTabsNoPageContent')} />;
        }
        return visibleTabs.map((tab) => {
            const isStaged = stagedTabIds.has(tab.tabId);
            const disabled = atMaxSelection && !isStaged;
            return (
                <li
                    key={tab.tabId}
                    role="menuitemcheckbox"
                    aria-checked={isStaged}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : 0}
                    class={cn(styles.checkboxItem, disabled && styles.checkboxItemDisabled)}
                    onClick={() => {
                        if (!disabled) toggleStaged(tab);
                    }}
                    onKeyDown={(e) => {
                        if (disabled) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleStaged(tab);
                        }
                    }}
                >
                    <span class={cn(styles.checkboxIndicator, isStaged && styles.checkboxIndicatorChecked)} aria-hidden="true">
                        <Check12Icon class={styles.checkboxCheck} />
                    </span>
                    <TabFavicon favicon={tab.favicon} iconSize={16} className={styles.favicon} fallbackClassName={styles.faviconFallback} />
                    <span class={styles.tabTitle}>{tab.title || tab.url}</span>
                </li>
            );
        });
    };

    const cancelButton = (
        <button type="button" class={cn(styles.tabsFooterButton, styles.tabsFooterButtonSecondary)} onClick={onClose}>
            {t('omnibar_attachTabsCancel')}
        </button>
    );
    const confirmButton = (
        <button type="button" class={cn(styles.tabsFooterButton, styles.tabsFooterButtonPrimary)} onClick={handleAttach}>
            {t('omnibar_attachTabsConfirm')}
        </button>
    );

    // Native <dialog> + showModal(): the top layer positions against the viewport, so the
    // omnibar `.popup`'s `backdrop-filter` (applied on non-default backgrounds) can't trap
    // the modal inside the omnibar box the way a `position: fixed` overlay would be.
    // data-attach-tabs-modal lets the omnibar's focus styling ignore the modal's search input.
    return (
        <dialog
            ref={dialogRef}
            aria-label={t('omnibar_attachTabsModalTitle')}
            class={styles.tabsModal}
            data-attach-tabs-modal
            onClick={(e) => {
                // Clicks on the ::backdrop are dispatched on the <dialog> itself.
                if (e.target === e.currentTarget) onClose();
            }}
            onCancel={(e) => {
                // Route native Escape-close through onClose so open/close state stays in sync.
                e.preventDefault();
                onClose();
            }}
        >
            <header class={styles.tabsModalHeader}>
                <h4>{t('omnibar_attachTabsModalTitle')}</h4>
            </header>
            <div class={styles.tabsModalBody}>
                <div class={styles.tabsSearchWrapper}>
                    <div class={styles.tabsSearchField}>
                        <SearchIcon width={14} height={14} class={styles.tabsSearchIcon} aria-hidden="true" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            class={styles.tabsSearchInput}
                            value={searchQuery}
                            onInput={(e) => setSearchQuery(/** @type {HTMLInputElement} */ (e.currentTarget).value)}
                            placeholder={t('omnibar_attachTabsSearchLabel')}
                            aria-label={t('omnibar_attachTabsSearchLabel')}
                            autoComplete="off"
                        />
                    </div>
                </div>
                <ul role="menu" aria-label={t('omnibar_attachTabsModalTitle')} class={styles.tabsMenu}>
                    {renderRows()}
                </ul>
            </div>
            <footer class={styles.tabsModalFooter}>
                {platformName === 'windows' ? (
                    <Fragment>
                        {confirmButton}
                        {cancelButton}
                    </Fragment>
                ) : (
                    <Fragment>
                        {cancelButton}
                        {confirmButton}
                    </Fragment>
                )}
            </footer>
        </dialog>
    );
}

/**
 * Non-interactive status row ("Loading tabs…", "No matching tabs").
 *
 * @param {object} props
 * @param {string} props.text
 */
function StatusRow({ text }) {
    return (
        <li role="presentation" class={styles.statusItem}>
            <span class={styles.statusText}>{text}</span>
        </li>
    );
}
