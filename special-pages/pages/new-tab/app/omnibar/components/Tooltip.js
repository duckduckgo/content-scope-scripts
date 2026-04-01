import { h } from 'preact';
import { useState, useId, useRef, useCallback } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import styles from './Tooltip.module.css';
import cn from 'classnames';

const VIEWPORT_PADDING = 8;

/**
 * @typedef {'right' | 'above'} TooltipPosition
 */

/**
 * A tooltip that renders via portal to document.body to avoid
 * clipping by overflow:hidden ancestors.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 * @param {string} props.content
 * @param {string} [props.className]
 * @param {TooltipPosition} [props.position]
 */
export function Tooltip({ children, content, className, position = 'above' }) {
    const [rect, setRect] = useState(/** @type {DOMRect | null} */ (null));
    const tooltipId = useId();
    const containerRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    /** @type {(el: HTMLDivElement | null) => void} */
    const tooltipRef = useCallback(
        (el) => {
            if (!el || !rect) return;
            const tooltipRect = el.getBoundingClientRect();
            const viewportWidth = document.documentElement.clientWidth;

            if (tooltipRect.left < VIEWPORT_PADDING) {
                el.style.left = `${VIEWPORT_PADDING}px`;
                if (position === 'above') {
                    el.style.transform = `translateY(calc(-100% - 6px))`;
                }
            } else if (tooltipRect.right > viewportWidth - VIEWPORT_PADDING) {
                el.style.left = `${viewportWidth - VIEWPORT_PADDING - tooltipRect.width}px`;
                if (position === 'above') {
                    el.style.transform = `translateY(calc(-100% - 6px))`;
                }
            }
        },
        [rect, position],
    );

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
            class={cn(styles.container, className)}
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
                    <div ref={tooltipRef} id={tooltipId} class={tooltipClass} role="tooltip" style={tooltipStyle}>
                        {content}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
