import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

/**
 * Stable empty props when the hook is disabled (no document listeners / no DOM attrs).
 * @type {Record<string, never>}
 */
const EMPTY_PROPS = {};

/**
 * Tracks whether focus is currently within a container AND arrived via keyboard (Tab),
 * as opposed to mouse/touch. Needed because native `:focus-visible` always matches on
 * text inputs/textareas even on click (a browser-standard heuristic that differs from
 * buttons/links, which are keyboard-only) — confirmed across engines, not fixable with
 * CSS alone.
 *
 * Same pattern used by static-pages' rebrand ai-searchbox
 * (`use-keyboard-focus-within.ts`, per Valerie) — ported here so both surfaces handle
 * this the same way.
 *
 * Pass `enabled: false` to skip document listeners (legacy NTP when rebrand is off;
 * pill-ring CSS is under `body[data-rebrand="true"]`).
 *
 * @param {{ enabled?: boolean }} [options]
 * @return {{
 *   isKeyboardFocusWithin: boolean,
 *   keyboardFocusWithinProps: {
 *     'data-keyboard-focus-within': true|undefined,
 *     onFocusCapture: (event: FocusEvent) => void,
 *     onBlurCapture: (event: FocusEvent) => void,
 *   } | Record<string, never>
 * }}
 */
export function useKeyboardFocusWithin({ enabled = true } = {}) {
    const [isKeyboardFocusWithin, setIsKeyboardFocusWithin] = useState(false);
    const hadKeyboardNavigation = useRef(false);

    useEffect(() => {
        if (!enabled) {
            hadKeyboardNavigation.current = false;
            setIsKeyboardFocusWithin(false);
            return;
        }

        /** @param {KeyboardEvent} event */
        const handleKeyDown = (event) => {
            if (event.key === 'Tab') {
                hadKeyboardNavigation.current = true;
            }
        };
        const handlePointerInput = () => {
            hadKeyboardNavigation.current = false;
            setIsKeyboardFocusWithin(false);
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('pointerdown', handlePointerInput, true);
        document.addEventListener('mousedown', handlePointerInput, true);
        document.addEventListener('touchstart', handlePointerInput, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('pointerdown', handlePointerInput, true);
            document.removeEventListener('mousedown', handlePointerInput, true);
            document.removeEventListener('touchstart', handlePointerInput, true);
        };
    }, [enabled]);

    const handleFocusCapture = useCallback(() => {
        setIsKeyboardFocusWithin(hadKeyboardNavigation.current);
    }, []);

    /** @param {FocusEvent} event */
    const handleBlurCapture = useCallback((event) => {
        const nextFocusedElement = event.relatedTarget;
        if (
            !(nextFocusedElement instanceof Node) ||
            !(event.currentTarget instanceof Node) ||
            !event.currentTarget.contains(nextFocusedElement)
        ) {
            hadKeyboardNavigation.current = false;
            setIsKeyboardFocusWithin(false);
        }
    }, []);

    return {
        isKeyboardFocusWithin: enabled ? isKeyboardFocusWithin : false,
        keyboardFocusWithinProps: enabled
            ? {
                  'data-keyboard-focus-within': isKeyboardFocusWithin || undefined,
                  onFocusCapture: handleFocusCapture,
                  onBlurCapture: handleBlurCapture,
              }
            : EMPTY_PROPS,
    };
}
