import { h } from 'preact';
import cn from 'classnames';
import { CloseSmallIcon, CreateImageIcon, GlobeIcon, ToolsIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useCustomizeResponsesItem } from './useCustomizeResponsesItem';
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
 * dropdown letting the user activate tools like "Create Image" and "Web Search".
 * When a tool is active, a chip is shown next to the button.
 *
 * @param {object} props
 * @param {ToolId[]} props.tools - IDs of available tools to show in the menu
 * @param {ToolId|null} props.activeTool - Currently active tool id, or null
 * @param {(toolId: ToolId) => void} props.onToggle - Toggle a tool by id
 */
export function ToolsMenu({ tools, activeTool, onToggle }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const customizeResponses = useCustomizeResponsesItem({ activeTool });
    const { isOpen: menuOpen, buttonRef, dropdownRef, dropdownPos, toggle: toggleMenu, close: closeMenu } = useDropdown({ align: 'left' });

    /** @param {ToolId} id @returns {ToolConfig|null} */
    const getToolConfig = (id) => {
        switch (id) {
            case 'image-generation':
                return {
                    id,
                    role: 'menuitemcheckbox',
                    icon: <CreateImageIcon />,
                    label: t('omnibar_createImageLabel'),
                    description: t('omnibar_createImageDescription'),
                    selected: activeTool === id,
                    onSelect: () => onToggle(id),
                };
            case 'web-search':
                return {
                    id,
                    role: 'menuitemcheckbox',
                    icon: <GlobeIcon />,
                    label: t('omnibar_webSearchLabel'),
                    description: t('omnibar_webSearchDescription'),
                    selected: activeTool === id,
                    onSelect: () => onToggle(id),
                };
            case 'customize-responses':
                return customizeResponses.item;
            default: {
                /**
                 * Exhaustiveness check — `never` means all ToolId cases are handled;
                 * adding a new one without a case will cause a type error here.
                 * @type {never}
                 */
                const _exhaustiveCheck = id;
                console.error(`Unknown tool id: ${_exhaustiveCheck}`);
                return null;
            }
        }
    };

    const menuItemIds = [...tools, ...(customizeResponses.item ? [/** @type {const} */ ('customize-responses')] : [])];
    const menuItems = /** @type {ToolConfig[]} */ (menuItemIds.map(getToolConfig).filter(Boolean));
    const activeToolConfig = activeTool ? getToolConfig(activeTool) : null;
    const isToolsButtonCollapsed = Boolean(activeToolConfig) || customizeResponses.isApplied;

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
                class={cn(styles.toolsButton, isToolsButtonCollapsed && styles.toolsButtonCollapsed)}
                aria-label={t('omnibar_toolsMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
            >
                <ToolsIcon />
                {!isToolsButtonCollapsed && <span class={styles.toolsLabel}>{t('omnibar_toolsMenuLabel')}</span>}
            </button>
            {activeToolConfig && (
                <button
                    type="button"
                    tabIndex={0}
                    class={styles.activeToolChip}
                    aria-label={activeToolConfig.label}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(activeToolConfig.id);
                    }}
                >
                    {activeToolConfig.icon}
                    <span class={styles.chipLabel}>{activeToolConfig.label}</span>
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
                    {menuItems.map((item, index) => {
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
