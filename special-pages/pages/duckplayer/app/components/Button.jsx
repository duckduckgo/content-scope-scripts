import { h } from 'preact'
import cn from 'classnames'
import styles from './Button.module.css'

/**
 *
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {"mobile" | "desktop"} [props.formfactor]
 * @param {boolean} [props.icon]
 * @param {boolean} [props.fill]
 * @param {boolean} [props.highlight]
 * @param {import("preact").ComponentProps<"button">} [props.buttonProps]
 */
export function Button({ children, formfactor = 'mobile', icon = false, fill = false, highlight = false, buttonProps = {} }) {
    const classes = cn({
        [styles.button]: true,
        [styles.desktop]: formfactor === 'desktop',
        [styles.highlight]: highlight === true,
        [styles.fill]: fill === true,
        [styles.iconOnly]: icon === true,
    })
    return (
        <button class={classes} type="button" {...buttonProps}>
            {children}
        </button>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {"mobile" | "desktop"} [props.formfactor]
 * @param {boolean} [props.icon]
 * @param {boolean} [props.fill]
 * @param {boolean} [props.highlight]
 * @param {import("preact").ComponentProps<"a">} [props.anchorProps]
 */
export function ButtonLink({ children, formfactor = 'mobile', icon = false, fill = false, highlight = false, anchorProps = {} }) {
    const classes = cn({
        [styles.button]: true,
        [styles.desktop]: formfactor === 'desktop',
        [styles.highlight]: highlight === true,
        [styles.fill]: fill === true,
        [styles.iconOnly]: icon === true,
    })
    return (
        <a class={classes} type="button" {...anchorProps}>
            {children}
        </a>
    )
}

export function Icon({ src }) {
    return (
        <span class={styles.icon}>
            <img src={src} alt="" />
        </span>
    )
}
