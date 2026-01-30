import { h, createContext } from 'preact';
import { useState, useRef, useEffect, useContext } from 'preact/hooks';
import styles from './Dropdown.module.css';

/**
 * Context for dropdown state management
 * @type {import('preact').Context<{close: () => void} | null>}
 */
const DropdownContext = createContext(/** @type {{close: () => void} | null} */ (null));

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

    const close = () => setIsOpen(false);

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
        <DropdownContext.Provider value={{ close }}>
            <div className={`${styles.container} ${isOpen ? styles.open : ''} ${className || ''}`} ref={menuRef}>
                <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
                {isOpen && (
                    <div className={styles.dropdown} role="menu">
                        {children}
                    </div>
                )}
            </div>
        </DropdownContext.Provider>
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
 * Dropdown menu item with checkmark and icon support
 *
 * @param {DropdownItemProps} props
 */
export function DropdownItem({ children, onClick, checked, role, icon }) {
    const dropdown = useContext(DropdownContext);

    const handleClick = () => {
        onClick();
        dropdown?.close();
    };

    return (
        <button className={styles.item} onClick={handleClick} role={role} aria-checked={role ? checked : undefined} type="button">
            <span className={styles.checkmark}>{checked ? <CheckIcon /> : null}</span>
            <span className={styles.icon}>{icon}</span>
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

/**
 * Checkmark icon for selected menu items
 */
function CheckIcon() {
    return (
        <svg viewBox="0 0 11 11" fill="none" className={styles.checkIcon}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.0615 1.17262C10.5185 1.48273 10.6376 2.1046 10.3275 2.5616L5.57748 9.5616C5.40579 9.81462 5.12778 9.97518 4.82282 9.99745C4.51786 10.0197 4.21947 9.90122 4.01285 9.67582L1.26285 6.67582C0.889659 6.2687 0.917162 5.63614 1.32428 5.26294C1.7314 4.88975 2.36397 4.91726 2.73716 5.32437L4.63262 7.39215L8.67253 1.4386C8.98264 0.981595 9.60451 0.862514 10.0615 1.17262Z"
                fill="currentColor"
            />
        </svg>
    );
}
