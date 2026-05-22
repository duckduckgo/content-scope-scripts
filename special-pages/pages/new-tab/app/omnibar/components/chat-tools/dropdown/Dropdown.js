import { h, cloneElement, toChildArray } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import styles from './Dropdown.module.css';

/**
 * @typedef {import('../useDropdown.js').DropdownPosition} DropdownPosition
 */

/**
 * @typedef {{ isSelected?: boolean, onSelect?: () => void }} DropdownItemProps
 */

/**
 * Extract DropdownItem props from a child vnode, or `null` for non-element
 * children (strings, numbers, booleans, null, undefined).
 *
 * @param {import('preact').ComponentChild} child
 * @returns {DropdownItemProps | null}
 */
function getItemProps(child) {
    if (typeof child !== 'object' || child === null || !('props' in child)) return null;
    return /** @type {DropdownItemProps} */ (child.props);
}

/**
 * Shared dropdown panel for the chat-tools toolbar. Owns `activeIndex`, keyboard
 * navigation, aria-activedescendant, focus-on-open, and hover/leave tracking.
 * Children must be {@link DropdownItem} nodes; Dropdown injects `isActive`,
 * `id`, `onMouseOver`, and `onClick` via `cloneElement`, and invokes each
 * item's `onSelect` on click or Enter.
 *
 * Parent controls visibility — Dropdown calls `onClose({restoreFocus})` when it
 * wants to be dismissed, and the parent unmounts it. This lets the initial
 * active index be re-seeded from `isSelected` on each remount without extra
 * state plumbing.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 * @param {string} props.ariaLabel
 * @param {'menu' | 'listbox'} props.role
 * @param {DropdownPosition} props.position
 * @param {(options: {restoreFocus: boolean}) => void} props.onClose
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {string} [props.idPrefix]
 */
export function Dropdown({ children, ariaLabel, role, position, onClose, dropdownRef, idPrefix = 'dropdown-item' }) {
    const items = toChildArray(children);

    const getInitialActiveIndex = () => {
        if (items.length === 0) return -1;
        const selected = items.findIndex((c) => getItemProps(c)?.isSelected);
        return selected >= 0 ? selected : 0;
    };

    const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex);
    const clearActiveIndex = () => setActiveIndex(-1);

    /** @param {number} nextIndex */
    const focusIndex = (nextIndex) => {
        if (items.length === 0) return;
        if (nextIndex < 0) setActiveIndex(items.length - 1);
        else if (nextIndex >= items.length) setActiveIndex(0);
        else setActiveIndex(nextIndex);
    };

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            dropdownRef.current?.focus();
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [dropdownRef]);

    /** @param {number} index */
    const getItemId = (index) => `${idPrefix}-${index}`;

    /** @param {number} index */
    const selectAt = (index) => {
        getItemProps(items[index])?.onSelect?.();
    };

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = (e) => {
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
                focusIndex(0);
                break;
            case 'End':
                e.preventDefault();
                focusIndex(items.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < items.length) {
                    selectAt(activeIndex);
                    onClose({ restoreFocus: true });
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose({ restoreFocus: true });
                break;
            case 'Tab':
                window.setTimeout(() => onClose({ restoreFocus: false }), 0);
                break;
        }
    };

    const clonedItems = items.map((child, index) => {
        if (getItemProps(child) === null) return child;

        return cloneElement(/** @type {import('preact').VNode} */ (child), {
            id: getItemId(index),
            isActive: activeIndex === index,
            onMouseOver: () => setActiveIndex(index),
            onClick: (/** @type {MouseEvent} */ e) => {
                e.stopPropagation();
                selectAt(index);
                onClose({ restoreFocus: false });
            },
        });
    });

    return (
        <ul
            ref={dropdownRef}
            class={styles.dropdown}
            tabIndex={-1}
            role={role}
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? getItemId(activeIndex) : undefined}
            style={{ left: position.left, right: position.right, top: position.top }}
            onKeyDown={handleKeyDown}
            onMouseLeave={clearActiveIndex}
        >
            {clonedItems}
        </ul>
    );
}
