import { useLayoutEffect, useRef } from 'preact/hooks';

/**
 * @param {string} base
 * @param {string} completion
 */
export function useCompletionInput(base, completion) {
    const ref = useRef(/** @type {HTMLInputElement|null} */ (null));

    useLayoutEffect(() => {
        if (!ref.current) return;
        const value = base + completion;
        ref.current.value = value;
        if (completion) {
            ref.current.setSelectionRange(base.length, value.length);
        }
    }, [base, completion]);

    return ref;
}
