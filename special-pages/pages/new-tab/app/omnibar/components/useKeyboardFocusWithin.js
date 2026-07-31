import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

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
 * @return {{
 *   isKeyboardFocusWithin: boolean,
 *   keyboardFocusWithinProps: {
 *     'data-keyboard-focus-within': true|undefined,
 *     onFocusCapture: (event: FocusEvent) => void,
 *     onBlurCapture: (event: FocusEvent) => void,
 *   }
 * }}
 */
export function useKeyboardFocusWithin() {
    const [isKeyboardFocusWithin, setIsKeyboardFocusWithin] = useState(false);
    const hadKeyboardNavigation = useRef(false);

    useEffect(() => {
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
    }, []);

    const handleFocusCapture = useCallback(() => {
        setIsKeyboardFocusWithin(hadKeyboardNavigation.current);
    }, []);

    /** @param {FocusEvent} event */
    const handleBlurCapture = useCallback((event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !(event.currentTarget instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
            hadKeyboardNavigation.current = false;
            setIsKeyboardFocusWithin(false);
        }
    }, []);

    return {
        isKeyboardFocusWithin,
        keyboardFocusWithinProps: {
            'data-keyboard-focus-within': isKeyboardFocusWithin || undefined,
            onFocusCapture: handleFocusCapture,
            onBlurCapture: handleBlurCapture,
        },
    };
}
