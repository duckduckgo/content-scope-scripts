import { h } from 'preact'
import cn from 'classnames'
import { useEffect, useState } from 'preact/hooks'
import styles from './Buttons.module.css'

/**
 * Renders a button bar component.
 *
 * @param {import("preact").ComponentProps<"div">} props
 */
export function ButtonBar (props) {
    const { children, ...rest } = props
    return (
        <div className={styles.buttons} {...rest}>
            {children}
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
export function Button ({ variant = 'primary', size = 'normal', children, ...rest }) {
    const classes = cn({
        [styles.button]: true,
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.large]: size === 'large',
        [styles.xl]: size === 'xl'
    })
    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    )
}

/**
 * @typedef {Object} ElasticButtonProps
 * @property {import("preact").ComponentChild} props.children - The content to be displayed inside the button.
 * @property {'primary' | 'secondary'} [props.variant="primary"]
 * @property {boolean} [props.grow=true] - Whether the button should grow on hover
 * @property {boolean} [props.unique=true] - Generate a new key every time button content changes. Helps in avoiding lingering hover states, for example
 */

/**
 * Renders a button component with that grows on hover.
 *
 * @param {ElasticButtonProps & import("preact").ComponentProps<"button">} props
 */
export function ElasticButton ({ variant = 'primary', grow = true, unique = true, children, ...rest }) {
    const [key, setKey] = useState('')

    useEffect(() => {
        unique && setKey(self.crypto.randomUUID())
    }, [unique, children])

    const classes = cn({
        [styles.button]: true,
        [styles.elastic]: true,
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.growable]: grow === true
    })
    return (
        <div className={styles.elasticContainer}>
            <button className={classes} key={key} {...rest}>
                {children}
            </button>
        </div>
    )
}
