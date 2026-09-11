import { h } from 'preact';

/**
 * Compose glyph for the rail's "New Chat" row: a panel with a pencil over its corner,
 * matching the control in Duck.ai's own chat sidebar.
 *
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function NewChat(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
                d="M14 8.5v3.25A2.25 2.25 0 0 1 11.75 14h-7.5A2.25 2.25 0 0 1 2 11.75v-7.5A2.25 2.25 0 0 1 4.25 2H7.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
            />
            <path
                d="M11.13 1.85a1.25 1.25 0 0 1 1.77 1.77l-4.4 4.4a1 1 0 0 1-.44.25l-1.7.48.48-1.7a1 1 0 0 1 .25-.44l4.04-4.04Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
            />
        </svg>
    );
}
