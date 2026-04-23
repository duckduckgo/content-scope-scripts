import { h } from 'preact';
import { CloseSmallIcon, CreateImageIcon, GlobeIcon, ToolsIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useDropdown } from '../useDropdown';
import { Dropdown } from '../dropdown/Dropdown';
import { DropdownItem } from '../dropdown/DropdownItem';
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
 */

/** @typedef {'image-generation' | 'web-search'} ToolId */

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
    const { isOpen: menuOpen, buttonRef, dropdownRef, dropdownPos, toggle: toggleMenu, close: closeMenu } = useDropdown({ align: 'left' });

    /** @param {ToolId} id @returns {ToolConfig|null} */
    const getToolConfig = (id) => {
        switch (id) {
            case 'image-generation':
                return {
                    id,
                    icon: <CreateImageIcon />,
                    label: t('omnibar_createImageLabel'),
                    description: t('omnibar_createImageDescription'),
                };
            case 'web-search':
                return { id, icon: <GlobeIcon />, label: t('omnibar_webSearchLabel'), description: t('omnibar_webSearchDescription') };
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

    const resolvedTools = /** @type {ToolConfig[]} */ (tools.map(getToolConfig).filter(Boolean));
    const activeToolConfig = activeTool ? getToolConfig(activeTool) : null;

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
                class={styles.toolsButton}
                aria-label={t('omnibar_toolsMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
            >
                <ToolsIcon />
                {!activeToolConfig && <span class={styles.toolsLabel}>{t('omnibar_toolsMenuLabel')}</span>}
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
                    {resolvedTools.map((tool) => (
                        <DropdownItem
                            key={tool.id}
                            role="menuitemcheckbox"
                            icon={tool.icon}
                            name={tool.label}
                            description={tool.description}
                            isSelected={activeTool === tool.id}
                            ariaChecked={activeTool === tool.id}
                            onSelect={() => onToggle(tool.id)}
                        />
                    ))}
                </Dropdown>
            )}
        </div>
    );
}
