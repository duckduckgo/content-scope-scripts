import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { MULTI_INSTANCE_WIDGETS } from '../../widget-list/widget-config.service.js';
import styles from './WidgetsSection.module.css';

/**
 * @param {object} props
 * @param {(widgetType: typeof MULTI_INSTANCE_WIDGETS[number]) => void} props.onAdd
 */
export function AddWidgetMenu({ onAdd }) {
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

    /**
     * @param {typeof MULTI_INSTANCE_WIDGETS[number]} widgetType
     */
    const handleSelect = (widgetType) => {
        onAdd(widgetType);
        setIsOpen(false);
    };

    const widgetLabels = {
        weather: 'Weather',
        news: 'News',
        stock: 'Stock',
    };

    return (
        <div className={styles.addWidgetContainer} ref={menuRef}>
            <button
                className={styles.addButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                type="button"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
            </button>
            {isOpen && (
                <ul className={styles.dropdown}>
                    {MULTI_INSTANCE_WIDGETS.map((widgetType) => (
                        <li key={widgetType}>
                            <button className={styles.dropdownItem} onClick={() => handleSelect(widgetType)} type="button">
                                {widgetLabels[widgetType]}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
