import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import styles from './Dropdown.module.css';

/**
 * @typedef {Object} DropdownProps
 * @property {import('preact').ComponentChild} trigger - The button/element that triggers the dropdown
 * @property {import('preact').ComponentChild} children - The dropdown content
 * @property {string} [className] - Additional class for the container
 */

/**
 * Reusable dropdown component with click-outside handling
 *
 * @param {DropdownProps} props
 */
export function Dropdown({ trigger, children, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`${styles.container} ${isOpen ? styles.open : ''} ${className || ''}`} ref={menuRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
            {isOpen && (
                <div className={styles.dropdown} role="menu">
                    {children}
                </div>
            )}
        </div>
    );
}

/**
 * @typedef {Object} DropdownItemProps
 * @property {import('preact').ComponentChild} children - The item content
 * @property {() => void} onClick - Click handler
 * @property {boolean} [checked] - Whether the item is checked (shows checkmark)
 * @property {'menuitem' | 'menuitemcheckbox' | 'menuitemradio'} [role] - ARIA role
 * @property {import('preact').ComponentChild} [icon] - Optional icon to display
 */

/**
 * Dropdown menu item
 *
 * @param {DropdownItemProps} props
 */
export function DropdownItem({ children, onClick, checked, role, icon }) {
    return (
        <button className={styles.item} onClick={onClick} role={role} aria-checked={role ? checked : undefined} type="button">
            <span className={styles.checkmark}>{icon || (checked ? '\u2713' : '')}</span>
            <span className={styles.itemLabel}>{children}</span>
        </button>
    );
}

/**
 * Dropdown separator
 */
export function DropdownSeparator() {
    return <div className={styles.separator} role="separator" />;
}
