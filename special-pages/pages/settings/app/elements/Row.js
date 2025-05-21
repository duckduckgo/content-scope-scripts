import { h } from 'preact';
import styles from './Elements.module.css';
import cn from 'classnames';

/**
 * Props for the Text component
 * @param {Object} props
 * @param {import('preact').ComponentChildren} props.children - The content to display
 * @param {"small" | "medium"} [props.gap = "small"]
 * @param {h.JSX.HTMLAttributes<HTMLDivElement>} [props.divAttrs] - HTML button attributes
 */
export function Row({ children, divAttrs, gap }) {
    return (
        <div class={cn(styles.row, { [styles.gapSmall]: gap === 'small' })} {...divAttrs}>
            {children}
        </div>
    );
}
