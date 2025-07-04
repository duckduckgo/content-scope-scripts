import { useEffect, useRef } from 'preact/hooks';

/**
 * @param {string} base
 * @param {string} suggestion
 */
export function useSuggestionInput(base, suggestion) {
    const ref = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        if (!ref.current) return;
        const value = base + suggestion;
        if (ref.current.value !== value) {
            ref.current.value = value;
            ref.current.setSelectionRange(base.length, value.length);
        }
    }, [base, suggestion]);

    return ref;
}
