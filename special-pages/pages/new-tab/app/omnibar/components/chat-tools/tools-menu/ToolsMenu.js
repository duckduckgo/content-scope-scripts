import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { CloseSmallIcon, CreateImageIcon, GlobeIcon, ToolsIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useToolsMenu } from './useToolsMenu';
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
    const { menuOpen, buttonRef, dropdownRef, dropdownPos, toggleMenu, closeMenu } = useToolsMenu();
    const [activeIndex, setActiveIndex] = useState(-1);
    const clearActiveIndex = () => setActiveIndex(-1);

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

    /** @param {ToolId} toolId */
    const handleSelect = (toolId) => {
        onToggle(toolId);
        closeMenu();
    };

    const getInitialActiveIndex = () => {
        if (resolvedTools.length === 0) return -1;

        const initialIndex = activeTool ? resolvedTools.findIndex((tool) => tool.id === activeTool) : -1;
        return initialIndex >= 0 ? initialIndex : 0;
    };

    useEffect(() => {
        if (!menuOpen) {
            clearActiveIndex();
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            dropdownRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [dropdownRef, menuOpen]);

    /**
     * @param {number} index
     */
    const getMenuItemId = (index) => `tools-menu-item-${resolvedTools[index]?.id ?? index}`;

    /**
     * @param {number} nextIndex
     */
    const focusIndex = (nextIndex) => {
        if (resolvedTools.length === 0) return;

        if (nextIndex < 0) {
            setActiveIndex(resolvedTools.length - 1);
        } else if (nextIndex >= resolvedTools.length) {
            setActiveIndex(0);
        } else {
            setActiveIndex(nextIndex);
        }
    };

    /** @type {(e: KeyboardEvent) => void} */
    const handleMenuKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusIndex(activeIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusIndex(activeIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(resolvedTools.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0) {
                    handleSelect(resolvedTools[activeIndex].id);
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeMenu();
                buttonRef.current?.focus();
                break;
            case 'Tab':
                window.setTimeout(() => closeMenu(), 0);
                break;
        }
    };

    return (
        <div class={styles.toolsMenu}>
            <button
                ref={buttonRef}
                type="button"
                tabIndex={0}
                class={cn(styles.toolsButton, (menuOpen || activeToolConfig) && styles.toolsButtonActive)}
                aria-label={t('omnibar_toolsMenuLabel')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!menuOpen) {
                        setActiveIndex(getInitialActiveIndex());
                    }
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
                <ul
                    ref={dropdownRef}
                    class={styles.dropdown}
                    tabIndex={-1}
                    role="menu"
                    aria-label={t('omnibar_toolsMenuLabel')}
                    aria-activedescendant={activeIndex >= 0 ? getMenuItemId(activeIndex) : undefined}
                    style={{ left: `${dropdownPos.left}px`, top: `${dropdownPos.top}px` }}
                    onKeyDown={handleMenuKeyDown}
                    onMouseLeave={clearActiveIndex}
                >
                    {resolvedTools.map((tool, index) => (
                        <li
                            key={tool.id}
                            id={getMenuItemId(index)}
                            role="menuitemcheckbox"
                            aria-checked={activeTool === tool.id}
                            class={cn(
                                styles.menuItem,
                                activeIndex === index && styles.menuItemActive,
                                activeTool === tool.id && styles.menuItemSelected,
                            )}
                            onMouseOver={() => setActiveIndex(index)}
                            onClick={() => handleSelect(tool.id)}
                        >
                            <span class={styles.checkmark} aria-hidden="true" />
                            {tool.icon}
                            <div class={styles.menuItemLabel}>
                                <span class={styles.menuItemName}>{tool.label}</span>
                                <span class={styles.menuItemDescription}>{tool.description}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
