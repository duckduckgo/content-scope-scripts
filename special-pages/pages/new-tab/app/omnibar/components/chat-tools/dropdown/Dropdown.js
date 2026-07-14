import { h, cloneElement, toChildArray } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './Dropdown.module.css';

/**
 * @typedef {import('../useDropdown.js').DropdownPosition} DropdownPosition
 */

/**
 * @typedef {{ isSelected?: boolean, ariaHasPopup?: boolean, disabled?: boolean, onSelect?: () => void }} DropdownItemProps
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
 * Children must be {@link DropdownItem} nodes; {@link DropdownSeparator} may be used
 * between groups. Dropdown injects `isActive`,
 * `id`, `onMouseOver`, and `onClick` via `cloneElement`, and invokes each
 * item's `onSelect` on click or Enter.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 * @param {import('preact').ComponentChildren} [props.header] - header rendered at the top of the panel.
 * @param {import('preact').ComponentChildren} [props.emptyMessage] - shown when there are no items.
 * @param {string} props.ariaLabel
 * @param {'menu' | 'listbox'} props.role
 * @param {DropdownPosition} props.position
 * @param {(options: {restoreFocus: boolean}) => void} props.onClose
 * @param {import('preact').RefObject<HTMLUListElement>} props.dropdownRef
 * @param {string} [props.idPrefix]
 * @param {string} [props.className]
 * @param {boolean} [props.multiSelect] - open with no row highlighted instead of the first `isSelected` row.
 */
export function Dropdown({
    children,
    header,
    emptyMessage,
    ariaLabel,
    role,
    position,
    onClose,
    dropdownRef,
    idPrefix = 'dropdown-item',
    className,
    multiSelect = false,
}) {
    const items = toChildArray(children);

    const isItemEnabled = (/** @type {import('preact').ComponentChild} */ child) => !getItemProps(child)?.disabled;

    /** @returns {number[]} */
    const getNavigableIndices = () =>
        items.map((child, index) => (getItemProps(child) === null ? -1 : index)).filter((index) => index >= 0);

    const navigableIndices = getNavigableIndices();

    const getInitialActiveIndex = () => {
        if (navigableIndices.length === 0) return -1;
        if (multiSelect) return -1;

        const selected = items.findIndex((c) => getItemProps(c)?.isSelected);
        if (selected >= 0 && isItemEnabled(items[selected])) return selected;

        return navigableIndices[0];
    };

    const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex);
    const clearActiveIndex = () => setActiveIndex(-1);

    /** @param {number} direction */
    const focusNavigable = (direction) => {
        if (navigableIndices.length === 0) return;

        const currentPos = navigableIndices.indexOf(activeIndex);
        const startPos = currentPos < 0 ? (direction >= 0 ? -1 : navigableIndices.length) : currentPos;
        let nextPos = startPos + direction;

        if (nextPos < 0) nextPos = navigableIndices.length - 1;
        else if (nextPos >= navigableIndices.length) nextPos = 0;

        setActiveIndex(navigableIndices[nextPos]);
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
        if (!isItemEnabled(items[index])) return;
        getItemProps(items[index])?.onSelect?.();
    };

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusNavigable(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusNavigable(-1);
                break;
            case 'Home':
                e.preventDefault();
                setActiveIndex(navigableIndices[0]);
                break;
            case 'End':
                e.preventDefault();
                setActiveIndex(navigableIndices[navigableIndices.length - 1]);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex < 0 || activeIndex >= items.length) {
                    break;
                }

                selectAt(activeIndex);
                if (!getItemProps(items[activeIndex])?.ariaHasPopup) {
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
            onMouseOver: isItemEnabled(child) ? () => setActiveIndex(index) : undefined,
            onClick: (/** @type {MouseEvent} */ e) => {
                e.stopPropagation();
                if (!isItemEnabled(child)) return;
                selectAt(index);
                if (!getItemProps(child)?.ariaHasPopup) {
                    onClose({ restoreFocus: false });
                }
            },
        });
    });

    return (
        <ul
            ref={dropdownRef}
            class={cn(styles.dropdown, className)}
            tabIndex={-1}
            role={role}
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? getItemId(activeIndex) : undefined}
            style={{ left: position.left, right: position.right, top: position.top }}
            onKeyDown={handleKeyDown}
            onMouseLeave={clearActiveIndex}
        >
            {header && (
                <li role="presentation" class={styles.header}>
                    {header}
                </li>
            )}
            {items.length === 0 && emptyMessage ? (
                <li role="presentation" class={styles.empty}>
                    {emptyMessage}
                </li>
            ) : (
                clonedItems
            )}
        </ul>
    );
}
