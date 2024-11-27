import { h } from 'preact';
import { useEffect, useRef, useState, useCallback, useId } from 'preact/hooks';
import styles from './Customizer.module.css';
import { VisibilityMenu } from './VisibilityMenu.js';
import { CustomizeIcon } from '../../components/Icons.js';
import cn from 'classnames';
import { useMessaging, useTypedTranslation } from '../../types.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem } from '../../../../../types/new-tab.js'
 */

/**
 * Represents the NTP customizer. For now it's just the ability to toggle sections.
 */
export function Customizer() {
    const { setIsOpen, buttonRef, dropdownRef, isOpen } = useDropdown();
    const [rowData, setRowData] = useState(/** @type {VisibilityRowData[]} */ ([]));

    useContextMenu();

    /**
     * Dispatch an event every time the customizer is opened - this
     * allows widgets to register themselves and provide titles/icons etc.
     */
    const toggleMenu = useCallback(() => {
        if (isOpen) return setIsOpen(false);
        setRowData(getItems());
        setIsOpen(true);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function handler() {
            setRowData(getItems());
        }
        window.addEventListener(Customizer.UPDATE_EVENT, handler);
        return () => {
            window.removeEventListener(Customizer.UPDATE_EVENT, handler);
        };
    }, [isOpen]);

    const MENU_ID = useId();
    const BUTTON_ID = useId();

    return (
        <div class={styles.root} ref={dropdownRef}>
            <CustomizerButton buttonId={BUTTON_ID} menuId={MENU_ID} toggleMenu={toggleMenu} buttonRef={buttonRef} isOpen={isOpen} />
            <div id={MENU_ID} class={cn(styles.dropdownMenu, { [styles.show]: isOpen })} aria-labelledby={BUTTON_ID}>
                <VisibilityMenu rows={rowData} />
            </div>
        </div>
    );
}

Customizer.OPEN_EVENT = 'ntp-customizer-open';
Customizer.UPDATE_EVENT = 'ntp-customizer-update';

export function getItems() {
    /** @type {VisibilityRowData[]} */
    const next = [];
    const detail = {
        register: (/** @type {VisibilityRowData} */ incoming) => {
            next.push(incoming);
        },
    };
    const event = new CustomEvent(Customizer.OPEN_EVENT, { detail });
    window.dispatchEvent(event);
    next.sort((a, b) => a.index - b.index);
    return next;
}

/**
 * Forward the contextmenu event
 */
export function useContextMenu() {
    const messaging = useMessaging();
    useEffect(() => {
        function handler(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const items = getItems();
            /** @type {VisibilityMenuItem[]} */
            const simplified = items
                .filter((x) => x.id !== 'debug')
                .map((item) => {
                    return {
                        id: item.id,
                        title: item.title,
                    };
                });
            messaging.contextMenu({ visibilityMenuItems: simplified });
        }
        document.body.addEventListener('contextmenu', handler);
        return () => {
            document.body.removeEventListener('contextmenu', handler);
        };
    }, [messaging]);
}

/**
 * @param {object} props
 * @param {string} [props.menuId]
 * @param {string} [props.buttonId]
 * @param {boolean} props.isOpen
 * @param {() => void} [props.toggleMenu]
 * @param {import("preact").Ref<HTMLButtonElement>} [props.buttonRef]
 */
export function CustomizerButton({ menuId, buttonId, isOpen, toggleMenu, buttonRef }) {
    const { t } = useTypedTranslation();
    return (
        <button
            ref={buttonRef}
            className={styles.customizeButton}
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={menuId}
            id={buttonId}
        >
            <CustomizeIcon />
            <span>{t('ntp_customizer_button')}</span>
        </button>
    );
}

export function CustomizerMenuPositionedFixed({ children }) {
    return <div class={styles.lowerRightFixed}>{children}</div>;
}

function useDropdown() {
    /** @type {import("preact").Ref<HTMLDivElement>} */
    const dropdownRef = useRef(null);
    /** @type {import("preact").Ref<HTMLButtonElement>} */
    const buttonRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);

    /**
     * Event handlers when it's open
     */
    useEffect(() => {
        if (!isOpen) return;
        const handleFocusOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains?.(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus?.();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', handleFocusOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', handleFocusOutside);
        };
    }, [isOpen]);

    return { dropdownRef, buttonRef, isOpen, setIsOpen };
}

export class VisibilityRowState {
    checked;
    /**
     * @param {object} params
     * @param {boolean} params.checked - whether this item should appear 'checked'
     */
    constructor({ checked }) {
        this.checked = checked;
    }
}

export class VisibilityRowData {
    /**
     * @param {object} params
     * @param {string} params.id - a unique id
     * @param {string} params.title - the title as it should appear in the menu
     * @param {'shield' | 'star'} params.icon - known icon name, maps to an SVG
     * @param {(id: string) => void} params.toggle - toggle function for this item
     * @param {number} params.index - position in the menu
     * @param {WidgetVisibility} params.visibility - known icon name, maps to an SVG
     */
    constructor({ id, title, icon, toggle, visibility, index }) {
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.toggle = toggle;
        this.index = index;
        this.visibility = visibility;
    }
}

/**
 * Call this to opt-in to the visibility menu
 * @param {VisibilityRowData} row
 */
export function useCustomizer({ title, id, icon, toggle, visibility, index }) {
    useEffect(() => {
        const handler = (/** @type {CustomEvent<any>} */ e) => {
            e.detail.register({ title, id, icon, toggle, visibility, index });
        };
        window.addEventListener(Customizer.OPEN_EVENT, handler);
        return () => window.removeEventListener(Customizer.OPEN_EVENT, handler);
    }, [title, id, icon, toggle, visibility, index]);

    useEffect(() => {
        window.dispatchEvent(new Event(Customizer.UPDATE_EVENT));
    }, [visibility]);
}
