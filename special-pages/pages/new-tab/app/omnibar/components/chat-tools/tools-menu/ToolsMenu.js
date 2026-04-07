import { h } from 'preact';
import cn from 'classnames';
import { CreateImageIcon, CloseSmallIcon, ToolsIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useToolsMenu } from './useToolsMenu';
import styles from './ToolsMenu.module.css';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

/**
 * Tools menu for the AI chat toolbar. Contains a trigger button that opens a
 * dropdown letting the user activate tools like "Create Image". When a tool is
 * active, a chip is shown next to the button.
 *
 * @param {object} props
 * @param {boolean} props.active - Whether image generation mode is active
 * @param {() => void} props.onToggle - Toggle image generation mode
 */
export function ToolsMenu({ active, onToggle }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { menuOpen, buttonRef, dropdownRef, dropdownPos, toggleMenu, closeMenu } = useToolsMenu();

    const handleSelect = () => {
        onToggle();
        closeMenu();
    };

    /** @param {MouseEvent} e */
    const handleDismissChip = (e) => {
        e.stopPropagation();
        onToggle();
    };

    return (
        <div class={styles.toolsMenu}>
            <button
                ref={buttonRef}
                type="button"
                class={cn(styles.toolsButton, (menuOpen || active) && styles.toolsButtonActive)}
                aria-label={t('omnibar_toolsMenuLabel')}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu();
                }}
            >
                <ToolsIcon />
                {!active && <span class={styles.toolsLabel}>{t('omnibar_toolsMenuLabel')}</span>}
            </button>
            {active && (
                <button type="button" class={styles.activeToolChip} aria-label={t('omnibar_createImageLabel')} onClick={handleDismissChip}>
                    <CreateImageIcon />
                    <span class={styles.chipLabel}>{t('omnibar_createImageLabel')}</span>
                    <CloseSmallIcon width="12" height="12" />
                </button>
            )}
            {menuOpen && dropdownPos && (
                <ul
                    ref={dropdownRef}
                    class={styles.dropdown}
                    role="menu"
                    aria-label={t('omnibar_toolsMenuLabel')}
                    style={{ left: `${dropdownPos.left}px`, top: `${dropdownPos.top}px` }}
                >
                    <li
                        role="menuitemcheckbox"
                        aria-checked={active}
                        class={cn(styles.menuItem, active && styles.menuItemSelected)}
                        onClick={handleSelect}
                    >
                        <span class={styles.checkmark} aria-hidden="true" />
                        <CreateImageIcon />
                        <div class={styles.menuItemLabel}>
                            <span class={styles.menuItemName}>{t('omnibar_createImageLabel')}</span>
                            <span class={styles.menuItemDescription}>{t('omnibar_createImageDescription')}</span>
                        </div>
                    </li>
                </ul>
            )}
        </div>
    );
}
