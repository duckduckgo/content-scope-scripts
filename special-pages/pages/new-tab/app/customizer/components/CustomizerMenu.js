import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import styles from './Customizer.module.css';
import { CustomizeIcon } from '../../components/Icons.js';
import { useTypedTranslation } from '../../types.js';

/**
 * @import { WidgetVisibility, VisibilityMenuItem } from '../../../types/new-tab.js'
 */

/**
 * @typedef {object} VisibilityRowData
 * @property {string} id - a unique id
 * @property {string} title - the title as it should appear in the menu
 * @property {import('preact').ComponentChild} icon - icon to display in the menu
 * @property {(id: string) => void} toggle - toggle function for this item
 * @property {number} index - position in the menu
 * @property {WidgetVisibility} visibility - known icon name, maps to an SVG
 */

export const OPEN_EVENT = 'ntp-customizer-open';
export const UPDATE_EVENT = 'ntp-customizer-update';

/**
 * @returns {VisibilityRowData[]}
 */
export function getCustomizerItems() {
    /** @type {VisibilityRowData[]} */
    const next = [];
    const detail = {
        register: (/** @type {VisibilityRowData} */ incoming) => {
            next.push(incoming);
        },
    };
    const event = new CustomEvent(OPEN_EVENT, { detail });
    window.dispatchEvent(event);
    next.sort((a, b) => a.index - b.index);
    return next;
}

/**
 * @param {object} props
 * @param {string} [props.menuId]
 * @param {string} [props.buttonId]
 * @param {import("@preact/signals").Signal<boolean>|boolean} props.isOpen
 * @param {() => void} [props.toggleMenu]
 * @param {import("preact").Ref<HTMLButtonElement>} [props.buttonRef]
 * @param {"menu" | "drawer"} props.kind
 */
export function CustomizerButton({ menuId, buttonId, isOpen, toggleMenu, buttonRef, kind }) {
    const { t } = useTypedTranslation();
    return (
        <button
            ref={buttonRef}
            class={styles.customizeButton}
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={menuId}
            data-kind={kind}
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

/**
 * Call this to opt-in to the visibility menu
 * @param {VisibilityRowData} row
 */
export function useCustomizer({ title, id, icon, toggle, visibility, index }) {
    useEffect(() => {
        const handler = (/** @type {CustomEvent<any>} */ e) => {
            e.detail.register({ title, id, icon, toggle, visibility, index });
        };
        window.addEventListener(OPEN_EVENT, handler);
        return () => window.removeEventListener(OPEN_EVENT, handler);
    }, [title, id, icon, toggle, visibility, index]);

    useEffect(() => {
        window.dispatchEvent(new Event(UPDATE_EVENT));
        return () => {
            window.dispatchEvent(new Event(UPDATE_EVENT));
        };
    }, [visibility]);
}
