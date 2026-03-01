import { useCallback } from 'preact/hooks';

/**
 * Combines multiple refs (RefObject or callback) into a single callback ref.
 *
 * @param {...(import('preact').RefObject<any> | ((element: any) => void) | null | undefined)} refs
 * @returns {(element: Element | null) => void}
 */
export function useMergedRef(...refs) {
    return useCallback((element) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(element);
            else if (ref) ref.current = element;
        }
    }, refs);
}
