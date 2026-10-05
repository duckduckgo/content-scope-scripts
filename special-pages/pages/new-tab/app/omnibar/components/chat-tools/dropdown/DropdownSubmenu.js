import { h, cloneElement, toChildArray, Fragment } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { ChevronSmall } from '../../../../components/Icons';
import { findContainingBlock } from '../useDropdown';
import { Dropdown } from './Dropdown';
import { DropdownItem } from './DropdownItem';
import styles from './Dropdown.module.css';

/**
 * @typedef {import('../useDropdown.js').DropdownPosition} DropdownPosition
 */

/**
 * A row inside a {@link Dropdown} that opens a fly-out panel of further {@link DropdownItem}s
 * beside it. Place it among the parent's children like a `DropdownItem`; the parent owns which
 * submenu is open and injects the open/close props below.
 *
 * The panel renders inside the parent `<ul>` (so the parent's click-outside and mouse-leave
 * treat it as part of the menu) with `position: fixed`, so the parent's `overflow: hidden` does
 * not clip it. It takes focus when it opens; Escape and ArrowLeft return focus to the parent.
 * Choosing a row closes the whole menu, then runs that row's `onSelect`.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children - the submenu's {@link DropdownItem}s.
 * @param {import('preact').ComponentChildren} props.name
 * @param {string} props.ariaLabel - accessible name of the submenu panel.
 * @param {import('preact').ComponentChildren} [props.icon]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.showCheckGutter]
 * @param {string} [props.className] - extra class for the row.
 * @param {string} [props.panelClassName] - extra class for the submenu panel.
 * @param {{ x: number, y: number }} [props.offset] - panel offset from the row's top-right corner, in CSS pixels.
 * @param {string} [props.idPrefix]
 * @param {boolean} [props.isOpen] - injected by Dropdown.
 * @param {() => void} [props.onOpen] - injected by Dropdown.
 * @param {(options: { restoreFocus: boolean }) => void} [props.onCloseSubmenu] - injected by Dropdown.
 * @param {(options: { restoreFocus: boolean }) => void} [props.onCloseMenu] - injected by Dropdown.
 * @param {boolean} [props.isActive] - injected by Dropdown.
 * @param {string} [props.id] - injected by Dropdown.
 * @param {(e: MouseEvent) => void} [props.onMouseOver] - injected by Dropdown.
 * @param {(e: MouseEvent) => void} [props.onClick] - injected by Dropdown.
 */
export function DropdownSubmenu({
    children,
    name,
    ariaLabel,
    icon,
    disabled = false,
    showCheckGutter,
    className,
    panelClassName,
    offset = { x: 0, y: 0 },
    idPrefix = 'dropdown-submenu-item',
    isOpen = false,
    onOpen,
    onCloseSubmenu,
    onCloseMenu,
    isActive,
    id,
    onMouseOver,
    onClick,
}) {
    const rowRef = useRef(/** @type {HTMLLIElement | null} */ (null));
    const panelRef = useRef(/** @type {HTMLUListElement | null} */ (null));
    const [position, setPosition] = useState(/** @type {DropdownPosition | null} */ (null));
    // Set once a submenu row is chosen: the whole menu is closing, so the panel must not pull focus back to the parent.
    const choseRowRef = useRef(false);

    useLayoutEffect(() => {
        const row = rowRef.current;
        if (!isOpen || !row) {
            setPosition(null);
            return;
        }
        choseRowRef.current = false;
        const rect = row.getBoundingClientRect();
        const cbRect = findContainingBlock(row)?.getBoundingClientRect();
        setPosition({ left: rect.right - (cbRect?.left ?? 0) + offset.x, top: rect.top - (cbRect?.top ?? 0) + offset.y });
    }, [isOpen, offset.x, offset.y]);

    const items = toChildArray(children).map((child) => {
        if (typeof child !== 'object' || child === null || !('props' in child)) return child;
        const vnode = /** @type {import('preact').VNode<{ onSelect?: () => void }>} */ (child);
        return cloneElement(vnode, {
            onSelect: () => {
                choseRowRef.current = true;
                onCloseMenu?.({ restoreFocus: true });
                vnode.props.onSelect?.();
            },
        });
    });

    return (
        <Fragment>
            <DropdownItem
                role="menuitem"
                className={className}
                showCheckGutter={showCheckGutter}
                icon={icon}
                name={name}
                disabled={disabled}
                trailingIcon={
                    <span class={styles.submenuChevron} aria-hidden="true">
                        <ChevronSmall />
                    </span>
                }
                ariaHasPopup
                ariaExpanded={isOpen}
                elementRef={rowRef}
                isActive={isActive}
                id={id}
                onMouseOver={onMouseOver}
                onHover={onOpen}
                onClick={onClick}
                onSelect={() => onOpen?.()}
            />
            {isOpen && position && (
                // Keys pressed inside the panel belong to it; don't let the parent navigate as well.
                <li
                    role="presentation"
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            onCloseSubmenu?.({ restoreFocus: true });
                        }
                    }}
                >
                    <Dropdown
                        dropdownRef={panelRef}
                        role="menu"
                        ariaLabel={ariaLabel}
                        position={position}
                        onClose={({ restoreFocus }) => {
                            if (choseRowRef.current) return;
                            onCloseSubmenu?.({ restoreFocus });
                        }}
                        idPrefix={idPrefix}
                        className={panelClassName}
                    >
                        {items}
                    </Dropdown>
                </li>
            )}
        </Fragment>
    );
}
