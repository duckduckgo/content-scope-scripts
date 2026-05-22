import { h } from 'preact';
import cn from 'classnames';
import styles from './Dropdown.module.css';

/**
 * Visual item inside a {@link Dropdown}. Dumb — active state and keyboard
 * handling live on Dropdown, which injects `isActive`, `id`, `onMouseOver`,
 * and `onClick` via `cloneElement` when it renders its children.
 *
 * The caller supplies `onSelect`; Dropdown invokes it on click and on Enter.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} [props.icon]
 * @param {string} props.name
 * @param {string} [props.description]
 * @param {boolean} [props.isSelected]
 * @param {'option' | 'menuitemcheckbox' | 'menuitemradio' | 'menuitem'} props.role
 * @param {() => void} props.onSelect
 * @param {boolean} [props.ariaChecked]
 * @param {boolean} [props.ariaSelected]
 * @param {boolean} [props.isActive]
 * @param {string} [props.id]
 * @param {(e: MouseEvent) => void} [props.onMouseOver]
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
export function DropdownItem({
    icon,
    name,
    description,
    isSelected = false,
    role,
    ariaChecked,
    ariaSelected,
    isActive = false,
    id,
    onMouseOver,
    onClick,
}) {
    return (
        <li
            id={id}
            role={role}
            aria-checked={ariaChecked}
            aria-selected={ariaSelected}
            class={cn(styles.item, isActive && styles.itemActive, isSelected && styles.itemSelected)}
            onMouseOver={onMouseOver}
            onClick={onClick}
        >
            <span class={styles.checkmark} aria-hidden="true" />
            {icon}
            <div class={styles.itemLabel}>
                <span class={styles.itemName}>{name}</span>
                {description && <span class={styles.itemDescription}>{description}</span>}
            </div>
        </li>
    );
}
