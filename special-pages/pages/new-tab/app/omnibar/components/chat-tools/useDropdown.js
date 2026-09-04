import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * @typedef {{left?: number, right?: number, top: number}} DropdownPosition
 * @typedef {ReturnType<typeof useDropdown>} DropdownState
 */

/**
 * Walks up the DOM to find the nearest ancestor that creates a containing block
 * for `position: fixed` (e.g. transform, will-change, filter, backdrop-filter).
 * @param {Element} el
 * @returns {Element | null}
 */
function findContainingBlock(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const wc = style.willChange;
        if (
            style.transform !== 'none' ||
            style.filter !== 'none' ||
            style.backdropFilter !== 'none' ||
            (wc && (wc.includes('transform') || wc.includes('perspective') || wc.includes('filter')))
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

/**
 * Computes dropdown position relative to the trigger button.
 * @param {DOMRect} buttonRect
 * @param {DOMRect | null} cbRect - containing-block rect, if any
 * @param {'left' | 'right'} align
 * @param {number} offsetY - Gap below the anchor; 0 seats the menu against the button.
 * @returns {DropdownPosition}
 */
function computePosition(buttonRect, cbRect, align, offsetY) {
    const topOffset = cbRect?.top ?? 0;
    const top = buttonRect.bottom - topOffset + offsetY;
    if (align === 'right') {
        const rightEdge = cbRect?.right ?? window.innerWidth;
        return { right: rightEdge - buttonRect.right, top };
    }
    const leftOffset = cbRect?.left ?? 0;
    return { left: buttonRect.left - leftOffset, top };
}

/**
 * Shared hook for dropdown menus that need fixed positioning relative to a
 * trigger button, with click-outside and resize-to-close behaviour.
 *
 * @param {object} [options]
 * @param {'left' | 'right'} [options.align] - Horizontal alignment of the dropdown relative to the button. Defaults to 'left'.
 * @param {number} [options.offsetY] - Vertical gap below the anchor in CSS pixels. Defaults to 4.
 * @param {import('preact').RefObject<HTMLElement|null>} [options.anchorRef] - Element to measure for position; defaults to the trigger button.
 */
export function useDropdown({ align = 'left', offsetY = 4, anchorRef } = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(/** @type {DropdownPosition|null} */ (null));
    const buttonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));
    const dropdownRef = useRef(/** @type {HTMLUListElement|null} */ (null));
    const cleanupRef = useRef(/** @type {(() => void) | null} */ (null));

    useEffect(() => {
        return () => cleanupRef.current?.();
    }, []);

    const close = () => {
        cleanupRef.current?.();
        cleanupRef.current = null;
        setIsOpen(false);
    };

    const open = () => {
        const anchor = anchorRef?.current ?? buttonRef.current;
        if (!anchor) return;
        const rect = anchor.getBoundingClientRect();
        const cb = findContainingBlock(anchor);
        const cbRect = cb?.getBoundingClientRect() ?? null;
        setDropdownPos(computePosition(rect, cbRect, align, offsetY));
        setIsOpen(true);

        /** @param {MouseEvent} e */
        const handleClickOutside = (e) => {
            const target = /** @type {Node} */ (e.target);
            if (buttonRef.current?.parentElement?.contains(target)) return;
            if (dropdownRef.current?.contains(target)) return;
            close();
        };
        const handleResize = () => close();
        document.addEventListener('click', handleClickOutside, true);
        window.addEventListener('resize', handleResize);
        cleanupRef.current = () => {
            document.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('resize', handleResize);
        };
    };

    const toggle = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };

    return {
        isOpen,
        dropdownPos,
        buttonRef,
        dropdownRef,
        toggle,
        close,
    };
}
