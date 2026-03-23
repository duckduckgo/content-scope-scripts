import { h } from 'preact';
import { useState, useId, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import styles from './Tooltip.module.css';
import cn from 'classnames';

/**
 * @typedef {'right' | 'above'} TooltipPosition
 */

/**
 * A tooltip component that appears on hover and keyboard focus.
 * Renders via portal to document.body to avoid clipping by overflow:hidden ancestors.
 * @param {Object} props
 * @param {import('preact').ComponentChildren} props.children - The element that triggers the tooltip
 * @param {string} props.content - The tooltip content text
 * @param {string} [props.className] - Additional CSS classes for the trigger element
 * @param {TooltipPosition} [props.position] - Where the tooltip appears relative to trigger. Defaults to 'right'.
 */
export function Tooltip({ children, content, className, position = 'right' }) {
    const [rect, setRect] = useState(/** @type {DOMRect | null} */ (null));
    const tooltipId = useId();
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    const show = () => {
        if (!containerRef.current) return;
        setRect(containerRef.current.getBoundingClientRect());
    };

    const hide = () => setRect(null);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (rect) {
                hide();
            } else {
                show();
            }
        }
        if (e.key === 'Escape') {
            hide();
        }
    };

    const isVisible = rect !== null;

    /** @type {import('preact').JSX.CSSProperties | undefined} */
    let tooltipStyle;
    if (rect) {
        if (position === 'above') {
            tooltipStyle = {
                top: `${rect.top}px`,
                left: `${rect.left + rect.width / 2}px`,
                transform: 'translate(-50%, calc(-100% - 6px))',
            };
        } else {
            tooltipStyle = {
                top: `${rect.top - 20}px`,
                left: `${rect.right + 8}px`,
            };
        }
    }

    const tooltipClass = position === 'above' ? cn(styles.tooltip, styles.tooltipAbove) : cn(styles.tooltip, styles.tooltipRight);

    return (
        <div
            ref={containerRef}
            class={cn(styles.tooltipContainer, className)}
            role="button"
            tabIndex={0}
            aria-describedby={isVisible ? tooltipId : undefined}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            onKeyDown={handleKeyDown}
        >
            {children}
            {isVisible &&
                createPortal(
                    <div
                        id={tooltipId}
                        class={tooltipClass}
                        role="tooltip"
                        style={tooltipStyle}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />,
                    document.body,
                )}
        </div>
    );
}
