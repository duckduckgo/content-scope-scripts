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
 * @property {string} text - Button text
 * @property {'primary' | 'secondary'} [props.variant="primary"]
 * @property {import('preact').JSX.Element} [startIcon] - Optional leading icon
 * @property {import('preact').JSX.Element} [endIcon] - Optional trailing icon
 * @property {string[]} [textVariants] - Optional array of strings that fix the maximum text length for the button
 * @property {boolean} [props.grow=true] - Whether the button should grow on hover
 * @property {boolean} [props.unique=true] - Generate a new key every time button content changes. Helps in avoiding lingering hover states, for example
 */

/**
 * Renders a button component with that grows on hover.
 *
 * @param {ElasticButtonProps & import("preact").ComponentProps<"button">} props
 */
export function ElasticButton ({ text, variant = 'primary', startIcon, endIcon, textVariants, grow = true, unique = true, children, ...rest }) {
    const [key, setKey] = useState('')

    console.log('TEXT', text)

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
                {startIcon}
                {textVariants ? <FixedWidthContent text={text} textVariants={textVariants}/> : text}
                {endIcon}
            </button>
        </div>
    )
}

/**
 * Creates a block of text that has a constant width equal to the longest possible string within textVariants
 *
 * @param {object} props
 * @param {string} props.text - Button text
 * @param {string[]} props.textVariants - All possible strings the button can use as text
 */
export function FixedWidthContent ({ text, textVariants }) {
    // Find the longest possible string
    const hiddenText = textVariants.reduce((acc, cur) => {
        return cur.length > acc.length ? cur : acc
    })

    return (
        <div className={styles.fixedWidthContainer}>
            <span aria-hidden={true} className={styles.hiddenContent}>{hiddenText}</span>
            <span className={styles.visibleContent}>{text}</span>
        </div>
    )
}
