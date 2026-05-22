import { h } from 'preact';
import { useState, useId } from 'preact/hooks';
import styles from './Tooltip.module.css';
import cn from 'classnames';

/**
 * A tooltip component that appears on hover and keyboard focus
 * @param {Object} props
 * @param {import('preact').ComponentChildren} props.children - The element that triggers the tooltip
 * @param {string} props.content - The tooltip content text
 * @param {string} [props.className] - Additional CSS classes for the trigger element
 */
export function Tooltip({ children, content, className }) {
    const [isVisible, setIsVisible] = useState(false);
    const tooltipId = useId();

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);

    const handleKeyDown = (e) => {
        // Show/hide tooltip on Enter or Space key
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsVisible((prev) => !prev);
        }

        // Hide tooltip on Escape key
        if (e.key === 'Escape') {
            hideTooltip();
        }
    };

    return (
        <div
            class={cn(styles.tooltipContainer, className)}
            role="button"
            tabIndex={0}
            aria-describedby={isVisible ? tooltipId : undefined}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            onKeyDown={handleKeyDown}
        >
            {children}
            {isVisible && <div id={tooltipId} class={styles.tooltip} role="tooltip" dangerouslySetInnerHTML={{ __html: content }} />}
        </div>
    );
}
