import { h } from 'preact';
import { useState } from 'preact/hooks';
import styles from './Tooltip.module.css';
import cn from 'classnames';

/**
 * A tooltip component that appears on hover
 * @param {Object} props
 * @param {import('preact').ComponentChildren} props.children - The element that triggers the tooltip
 * @param {string} props.content - The tooltip content text
 * @param {string} [props.className] - Additional CSS classes for the trigger element
 */
export function Tooltip({ children, content, className }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            class={cn(styles.tooltipContainer, className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div class={styles.tooltip} role="tooltip" dangerouslySetInnerHTML={{__html: content}} />
            )}
        </div>
    );
}
