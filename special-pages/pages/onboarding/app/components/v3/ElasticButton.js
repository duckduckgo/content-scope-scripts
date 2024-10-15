import { h } from 'preact'
import cn from 'classnames'
import styles from './ElasticButton.module.css'

/**
 * @typedef {Object} ElasticButtonProps
 * @property {string} text - Button text
 * @property {'primary' | 'secondary'} [props.variant="primary"]
 * @property {import('preact').JSX.Element} [startIcon] - Optional leading icon
 * @property {import('preact').JSX.Element} [endIcon] - Optional trailing icon
 * @property {string[]} [textVariants] - Optional array of strings that fix the maximum text length for the button
 * @property {boolean} [props.elastic=true] - Whether the button should grow on hover
 */

/**
 * Renders a button component with that grows on hover.
 *
 * @param {ElasticButtonProps & import("preact").ComponentProps<"button">} props
 */
export function ElasticButton ({ text, variant = 'primary', startIcon, endIcon, textVariants, elastic = true, children, ...rest }) {
    const classes = cn({
        [styles.button]: true,
        [styles.primary]: variant === 'primary',
        [styles.secondary]: variant === 'secondary',
        [styles.elastic]: elastic === true
    })
    return (
        <button className={classes} {...rest}>
            <div className={styles.background}></div>
            <div class={styles.content}>
                {startIcon}
                {textVariants ? <FixedWidthContent text={text} textVariants={textVariants}/> : text}
                {endIcon}
            </div>
        </button>
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
