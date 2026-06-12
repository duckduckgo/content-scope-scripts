import { h } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { OpenTabsContext } from './OpenTabsProvider';
import { TabFavicon } from './TabFavicon';
import styles from './AttachMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * @param {object} props
 * @param {import('../useDropdown.js').DropdownPosition} props.position
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(tab: TabMetadata) => void} props.onSelect
 * @param {(tabId: string) => boolean} props.isAttached — Whether a tab is already attached, to show its checked state.
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 */
export function TabPicker({ position, dropdownRef, onSelect, isAttached, onClose }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { openTabs, refetchTabs } = useContext(OpenTabsContext);

    useEffect(() => {
        refetchTabs();
    }, [refetchTabs]);

    return (
        <Dropdown
            dropdownRef={dropdownRef}
            role="menu"
            ariaLabel={t('omnibar_attachTabsPickerTitle')}
            header={openTabs.length > 0 ? t('omnibar_attachTabsPickerTitle') : undefined}
            emptyMessage={t('omnibar_attachTabsNoOpenTabs')}
            position={position}
            onClose={onClose}
            idPrefix="tab-picker-item"
            className={styles.tabPicker}
            multiSelect
        >
            {openTabs.map((tab) => {
                const attached = isAttached(tab.tabId);
                return (
                    <DropdownItem
                        key={tab.tabId}
                        role="menuitemcheckbox"
                        ariaChecked={attached}
                        isSelected={attached}
                        icon={
                            <TabFavicon
                                favicon={tab.favicon}
                                iconSize={12}
                                className={styles.favicon}
                                fallbackClassName={styles.faviconFallback}
                            />
                        }
                        name={tab.title}
                        onSelect={() => onSelect(tab)}
                    />
                );
            })}
        </Dropdown>
    );
}
