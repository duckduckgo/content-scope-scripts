import { h } from 'preact';
import cn from 'classnames';
import { CloseSmallIcon, ToolsIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
import { DropdownSeparator } from '../dropdown/DropdownSeparator';
import styles from './ToolsMenu.module.css';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 */

/**
 * @typedef {object} ToolConfig
 * @property {ToolId} id - Tool identifier
 * @property {import('preact').ComponentChildren} icon - Icon component
 * @property {string} label - Display label
 * @property {string} description - Description shown in the menu dropdown
 * @property {'menuitemcheckbox' | 'menuitem'} role - ARIA role for the row
 * @property {() => void} onSelect - Invoked when the row is selected
 * @property {boolean} [selected] - Checkbox state, for `menuitemcheckbox` rows
 * @property {boolean} [disabled] - Whether the row is disabled
 * @property {import('preact').ComponentChildren} [trailingControl] - Interactive trailing element (e.g. a toggle)
 */

/** @typedef {'image-generation' | 'web-search' | 'customize-responses'} ToolId */

/**
 * Tools menu for the AI chat toolbar. Contains a trigger button that opens a
 * dropdown of menu rows; when a row is active, a chip is shown next to the
 * button. This component only renders — the menu view model is built by
 * {@link import('./useToolsMenuItems').useToolsMenuItems}.
 *
 * @param {object} props
 * @param {ToolConfig[]} props.items - Complete, ordered list of menu rows
 * @param {ToolConfig|null} props.activeItem - Active row backing the collapsed chip, or null
 * @param {boolean} props.isCollapsed - Whether the trigger renders icon-only
 */
export function ToolsMenu({ items, activeItem, isCollapsed }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { isOpen: menuOpen, buttonRef, dropdownRef, dropdownPos, toggle: toggleMenu, close: closeMenu } = useDropdown({ align: 'left' });

    /** @param {{ restoreFocus: boolean }} opts */
    const handleClose = ({ restoreFocus }) => {
        closeMenu();
        if (restoreFocus) buttonRef.current?.focus();
    };

    return (
        <div class={styles.toolsMenu}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={0}
                class={cn(styles.toolsButton, isCollapsed && styles.toolsButtonCollapsed)}
                aria-label={t('omnibar_toolsMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
            >
                <ToolsIcon />
                {!isCollapsed && <span class={styles.toolsLabel}>{t('omnibar_toolsMenuLabel')}</span>}
            </button>
            {activeItem && (
                <button
                    type="button"
                    tabIndex={0}
                    class={styles.activeToolChip}
                    aria-label={activeItem.label}
                    onClick={(e) => {
                        e.stopPropagation();
                        activeItem.onSelect();
                    }}
                >
                    {activeItem.icon}
                    <span class={styles.chipLabel}>{activeItem.label}</span>
                    <CloseSmallIcon width="12" height="12" />
                </button>
            )}
            {menuOpen && dropdownPos && (
                <Dropdown
                    dropdownRef={dropdownRef}
                    role="menu"
                    ariaLabel={t('omnibar_toolsMenuLabel')}
                    position={dropdownPos}
                    onClose={handleClose}
                    idPrefix="tools-menu-item"
                >
                    {items.map((item, index) => {
                        const dropdownItem = (
                            <DropdownItem
                                key={item.id}
                                role={item.role}
                                icon={item.icon}
                                name={item.label}
                                description={item.description}
                                isSelected={item.selected}
                                ariaChecked={item.role === 'menuitemcheckbox' ? Boolean(item.selected) : undefined}
                                disabled={item.disabled}
                                trailingControl={item.trailingControl}
                                onSelect={item.onSelect}
                            />
                        );
                        if (item.id === 'customize-responses' && index > 0) {
                            return [<DropdownSeparator key={`${item.id}-separator`} />, dropdownItem];
                        }
                        return dropdownItem;
                    })}
                </Dropdown>
            )}
        </div>
    );
}
