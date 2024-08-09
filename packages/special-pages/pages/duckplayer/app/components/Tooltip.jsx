import { h } from "preact";
import cn from "classnames";
import styles from "./Tooltip.module.css";

/**
 * @param {object} props
 * @param {string} props.id
 * @param {boolean} props.isVisible
 * @param {'top' | 'bottom'} props.position
 */
export function Tooltip({ id, isVisible, position }) {
    return (
        <div class={cn(styles.tooltip, {
            [styles.top]: position === 'top',
            [styles.bottom]: position === 'bottom',
        })}
             role="tooltip"
             aria-hidden={!isVisible}
             id={id}>
            Duck Player provides a clean viewing experience without personalized ads and prevents viewing activity from
            influencing your YouTube recommendations.
        </div>
    )
}
