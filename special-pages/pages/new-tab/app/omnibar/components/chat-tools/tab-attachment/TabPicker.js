import { h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { GlobeIcon } from '../../../../components/Icons';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { OpenTabsContext } from './OpenTabsProvider';
import styles from './AttachMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').Favicon} Favicon
 */

/**
 * Recent-tabs picker — a Dropdown with a "Recent Tabs" header and a
 * DropdownItem per open tab.
 *
 * @param {object} props
 * @param {(key: keyof Strings) => string} props.t
 * @param {import('../useDropdown.js').DropdownPosition} props.position
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {(tab: TabMetadata) => void} props.onSelect
 * @param {(tabId: string) => boolean} props.isAttached — Whether a tab is already attached, to show its checked state.
 * @param {(opts: { restoreFocus: boolean }) => void} props.onClose
 */
export function TabPicker({ t, position, dropdownRef, onSelect, isAttached, onClose }) {
    const { openTabs, refetchTabs } = useContext(OpenTabsContext);

    useEffect(() => {
        refetchTabs();
    }, [refetchTabs]);

    return (
        <Dropdown
            dropdownRef={dropdownRef}
            role="menu"
            ariaLabel={t('omnibar_attachTabsPickerTitle')}
            header={t('omnibar_attachTabsPickerTitle')}
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
                        icon={<TabFavicon favicon={tab.favicon} />}
                        name={tab.title}
                        onSelect={() => onSelect(tab)}
                    />
                );
            })}
        </Dropdown>
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
                <GlobeIcon width="12" height="12" />
            </span>
        );
    }
    return <img class={styles.favicon} src={favicon.src} alt="" onError={() => setErrored(true)} loading="lazy" />;
}
