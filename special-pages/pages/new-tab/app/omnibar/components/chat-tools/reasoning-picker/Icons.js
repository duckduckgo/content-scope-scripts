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
 * Clock-face icon used for the "extended reasoning" option.
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function ExtendedReasoningIcon(props) {
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
                    d="M8 3.875a.625.625 0 0 1 .625.625V7.74l2.067 2.067a.625.625 0 1 1-.884.884L7.558 8.442A.625.625 0 0 1 7.375 8V4.5A.625.625 0 0 1 8 3.875"
                />
            </g>
        </svg>
    );
}
