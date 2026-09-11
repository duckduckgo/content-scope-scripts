import { h } from 'preact';

/**
 * Sidebar show/hide glyph: a panel outline with its leading column picked out, matching the
 * control in Duck.ai's own chat sidebar.
 *
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function SidePanel(props) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="1.25" y="2.25" width="13.5" height="11.5" rx="2.75" stroke="currentColor" stroke-width="1.5" />
            <path d="M6 2.75v10.5" stroke="currentColor" stroke-width="1.5" />
        </svg>
    );
}
