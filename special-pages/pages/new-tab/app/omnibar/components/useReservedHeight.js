import { useLayoutEffect, useRef } from 'preact/hooks';

/**
 * Reports how far the element hangs below its (negative) top margin, so the page can keep that much room under it.
 * Reports 0 once disabled or unmounted.
 *
 * @param {boolean} enabled
 * @param {(height: number) => void} onChange
 */
export function useReservedHeight(enabled, onChange) {
    const ref = useRef(/** @type {HTMLDivElement|null} */ (null));

    useLayoutEffect(() => {
        const element = ref.current;
        if (!enabled || !element) return;
        const observer = new ResizeObserver(() => {
            onChange(Math.max(0, element.offsetHeight + parseFloat(getComputedStyle(element).marginTop)));
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
            onChange(0);
        };
    }, [enabled, onChange]);

    return ref;
}
