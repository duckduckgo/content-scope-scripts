import { h } from 'preact';

/**
 * Lightning-bolt icon used for the "fast" reasoning-effort option.
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function FastReasoningIcon(props) {
    return (
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                fill="currentColor"
                d="M9.47 1.016a.625.625 0 0 1 .423.705L9.04 6.5h3.585a.625.625 0 0 1 .49 1.013l-6 7.5a.625.625 0 0 1-1.1-.515L6.776 9.5H3.375a.625.625 0 0 1-.49-1.013l6-7.5a.625.625 0 0 1 .585-.221z"
            />
        </svg>
    );
}

/**
 * Atom-style icon used for the "reasoning" reasoning-effort option.
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function ReasoningEffortIcon(props) {
    return (
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g fill="currentColor">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8 2.25a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5M1 8a7 7 0 1 1 14 0 7 7 0 0 1-14 0"
                />
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6M3.75 8a4.25 4.25 0 1 1 8.5 0 4.25 4.25 0 0 1-8.5 0"
                    opacity=".55"
                />
                <path d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
            </g>
        </svg>
    );
}

/**
 * Circular arrow icon used for the "auto" reasoning-effort option.
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function AutoReasoningIcon(props) {
    return (
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8 2.75a5.25 5.25 0 0 0-5.123 4.098.625.625 0 1 1-1.22-.276A6.5 6.5 0 0 1 13.3 4.5V3.125a.625.625 0 1 1 1.25 0V6.25a.625.625 0 0 1-.625.625h-3.125a.625.625 0 1 1 0-1.25h1.517A5.24 5.24 0 0 0 8 2.75m-6.175 6.34a.625.625 0 0 1 .748.469A5.25 5.25 0 0 0 12 11.5v1.375a.625.625 0 1 1-1.25 0V12c-1.148.952-2.61 1.5-4.1 1.5a6.5 6.5 0 0 1-5.294-2.722.625.625 0 0 1 .469-.688"
            />
            <path fill="currentColor" d="m6.9 10 2.85-3.35L7 5.4l-.1-.05a.35.35 0 0 0-.49.08l-.03.04-1.82 3.15-.01.03a.35.35 0 0 0 .3.5z" />
        </svg>
    );
}
