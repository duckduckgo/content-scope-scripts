import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** @typedef {Omit<import('preact').JSX.InputHTMLAttributes, 'value'> & {
  *   base: string,
  *   suggestion: string,
  * }} SuggestionInputProps

/**
 * @param {SuggestionInputProps} props
 */
export function SuggestionInput({ base, suggestion, ...props }) {
    const ref = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        if (!ref.current) return;
        const value = base + suggestion;
        if (ref.current.value !== value) {
            ref.current.value = value;
            ref.current.setSelectionRange(base.length, value.length);
        }
    }, [base, suggestion]);

    return <input {...props} ref={ref} />;
}
