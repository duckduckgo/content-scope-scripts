import { h } from 'preact';
import { useState, useId, useRef, useLayoutEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import styles from './Tooltip.module.css';
import cn from 'classnames';

/**
 * @typedef {'right' | 'above'} TooltipPosition
 */

const PLACEMENT_MAP = /** @type {const} */ ({
    right: 'right',
    above: 'top',
});

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
    const [isVisible, setIsVisible] = useState(false);
    const tooltipId = useId();
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const tooltipRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsVisible((prev) => !prev);
        }
        if (e.key === 'Escape') {
            hide();
        }
    };

    useLayoutEffect(() => {
        if (!isVisible || !containerRef.current || !tooltipRef.current) return;

        const reference = containerRef.current;
        const floating = tooltipRef.current;

        const update = async () => {
            const { x, y } = await computePosition(reference, floating, {
                placement: PLACEMENT_MAP[position],
                middleware: [offset(6), flip(), shift({ padding: 8 })],
            });
            Object.assign(floating.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
        };
        update();
    }, [isVisible, position]);

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
                        ref={tooltipRef}
                        id={tooltipId}
                        class={tooltipClass}
                        role="tooltip"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />,
                    document.body,
                )}
        </div>
    );
}
