import { h } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import cn from 'classnames';
import styles from './Dropdown.module.css';

/**
 * Visual item inside a {@link Dropdown}. Dumb — active state and keyboard
 * handling live on Dropdown, which injects `isActive`, `id`, `onMouseOver`,
 * and `onClick` via `cloneElement` when it renders its children.
 *
 * The caller supplies `onSelect`; Dropdown invokes it on click and on Enter.
 * `onHover` fires on `mouseenter`, independent of active-index tracking — used for submenus.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} [props.icon]
 * @param {import('preact').ComponentChildren} [props.trailingIcon]
 * @param {string} props.name
 * @param {string} [props.description]
 * @param {boolean} [props.isSelected]
 * @param {boolean} [props.isDimmed] - Grays the icon and label (e.g. gated options) while keeping the trailing badge legible
 * @param {'option' | 'menuitemcheckbox' | 'menuitemradio' | 'menuitem'} props.role
 * @param {() => void} props.onSelect
 * @param {boolean} [props.ariaChecked]
 * @param {boolean} [props.ariaSelected]
 * @param {boolean} [props.ariaHasPopup]
 * @param {boolean} [props.ariaExpanded]
 * @param {boolean} [props.isActive]
 * @param {string} [props.id]
 * @param {import('preact').RefObject<HTMLLIElement>} [props.elementRef]
 * @param {(e: MouseEvent) => void} [props.onMouseOver]
 * @param {(e: MouseEvent) => void} [props.onHover]
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
export function DropdownItem({
    icon,
    trailingIcon,
    name,
    description,
    isSelected = false,
    isDimmed = false,
    role,
    ariaChecked,
    ariaSelected,
    ariaHasPopup,
    ariaExpanded,
    isActive = false,
    id,
    elementRef,
    onMouseOver,
    onHover,
    onClick,
}) {
    const itemRef = useRef(/** @type {HTMLLIElement | null} */ (null));

    useLayoutEffect(() => {
        if (isActive) itemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [isActive]);

    /** @param {HTMLLIElement | null} el */
    const setRef = (el) => {
        itemRef.current = el;
        if (elementRef) elementRef.current = el;
    };

    return (
        <li
            ref={setRef}
            id={id}
            role={role}
            aria-checked={ariaChecked}
            aria-selected={ariaSelected}
            aria-haspopup={ariaHasPopup}
            aria-expanded={ariaExpanded}
            class={cn(styles.item, isActive && styles.itemActive, isSelected && styles.itemSelected, isDimmed && styles.itemDimmed)}
            onMouseOver={onMouseOver}
            onMouseEnter={onHover}
            onClick={onClick}
        >
            <span class={styles.checkmark} aria-hidden="true" />
            {icon}
            <div class={styles.itemLabel}>
                <span class={styles.itemName}>{name}</span>
                {description && <span class={styles.itemDescription}>{description}</span>}
            </div>
            {trailingIcon && (
                <span class={styles.trailingIcon} aria-hidden="true">
                    {trailingIcon}
                </span>
            )}
        </li>
    );
}
