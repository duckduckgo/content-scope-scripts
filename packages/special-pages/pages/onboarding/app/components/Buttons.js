import { h } from 'preact'
import styles from './Buttons.module.css'
import cn from 'classnames'

/**
 * Renders a button bar component.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children - The content to be displayed inside the button.
 */
export function ButtonBar (props) {
    return (
        <div className={styles.buttons}>
            {props.children}
        </div>
    )
}

/**
 * @typedef {Object} ButtonProps
 * @property {import("preact").ComponentChild} props.children - The content to be displayed inside the button.
 * @property {'primary' | 'secondary'} [props.variant="primary"]
 * @property {'normal' | 'large' | 'xl'} [props.size="normal"]
 */

/**
 * Renders a button component with custom styles.
 *
 * @param {ButtonProps & Omit<import("preact").ComponentProps<"button">, "size">} props
 */
export function Button ({ variant = 'primary', size = 'normal', children, ...props }) {
    const classes = cn({
        [styles.button]: true,
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.large]: size === 'large',
        [styles.xl]: size === 'xl'
    })
    return (
        <button className={classes} {...props}>
            {children}
        </button>
    )
}
