import { h } from 'preact';

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {import("preact").ComponentProps<"div">} [props.rest]
 */
export function Centered({ children, ...rest }) {
    return (
        <div {...rest} class="layout-centered">
            {children}
        </div>
    );
}
