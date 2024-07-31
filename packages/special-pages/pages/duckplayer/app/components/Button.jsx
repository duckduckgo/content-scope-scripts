import {h} from "preact"
import styles from "./Button.module.css";

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
export function Button({
       children,
       formfactor = "mobile",
       icon = false,
       fill = false,
       highlight = false,
       buttonProps = {}
   }) {
    return (
        <button
            class={styles.button}
            type="button"
            data-icon={icon ? 'only' : 'none'}
            data-fill={String(fill)}
            data-highlight={String(highlight)}
            data-formfactor={formfactor}
            {...buttonProps}
        >
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
export function ButtonLink({
       children,
       formfactor = "mobile",
       icon = false,
       fill = false,
       highlight = false,
       anchorProps = {}
   }) {
    return (
        <a
            class={styles.button}
            type="button"
            data-icon={icon ? 'only' : 'none'}
            data-fill={String(fill)}
            data-highlight={String(highlight)}
            data-formfactor={formfactor}
            {...anchorProps}
        >
            {children}
        </a>
    )
}

export function Icon({ src }) {
    return (
        <span class={styles.icon}>
            <img src={src} alt=""/>
        </span>
    )
}
