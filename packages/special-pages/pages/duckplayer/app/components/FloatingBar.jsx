import styles from "./FloatingBar.module.css"
import { h } from "preact";


/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function BottomNavBar({children}) {
    return (
        <div class={styles.bottomNavBar}>
            {children}
        </div>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function FloatingBar({children}) {
    return (
        <div class={styles.floatingBar}>
            {children}
        </div>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function TopBar({children}) {
    return (
        <div class={styles.topBar}>
            {children}
        </div>
    )
}
