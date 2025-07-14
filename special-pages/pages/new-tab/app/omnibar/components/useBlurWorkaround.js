import { useEffect, useRef } from 'preact/hooks';

/**
 * Safari/WebKit doesn't trigger the blur event on an element when focus is
 * moved to the browser's address bar. This hook works around this issue by
 * monitoring for when the --focus-state CSS variable, set via the :focus pseudo
 * selector, changes from 1 to 0, indicating that the element has lost focus.
 */
export function useBlurWorkaround() {
    const ref = useRef(/** @type {HTMLElement|null} */ (null));

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        let lastFocusState = '0';
        let rafId = 0;

        const checkFocusState = () => {
            const currentFocusState = getComputedStyle(element).getPropertyValue('--focus-state').trim();
            if (lastFocusState === '1' && currentFocusState === '0') {
                element.blur();
            }
            lastFocusState = currentFocusState;
            rafId = requestAnimationFrame(checkFocusState);
        };

        rafId = requestAnimationFrame(checkFocusState);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return ref;
}
