import { h } from 'preact'
import styles from './Header.module.css'
import { Typed } from './Typed'

/**
 * Renders a header component.
 *
 * @param {Object} props
 * @param {string} props.title - The title to display in the header.
 * @param {import("preact").ComponentChild} [props.after] - The content to display after the title.
 * @param {import("preact").ComponentChild} [props.aside=null] - The content to display on the side of the header.
 * @param {(() => void) | null} [props.onComplete=null] - The function to call when the typing animation completes.
 */
export function Header ({ title, after, aside = null, onComplete = null }) {
    return (
        <header className={styles.header}>
            <img className={styles.logo} src="assets/img/dax.svg" />

            <div className={styles.titleContainer}>
                <h1 className={styles.title}>
                    <Typed text={title} onComplete={onComplete}>
                        {after}
                    </Typed>
                </h1>
            </div>

            {aside}
        </header>
    )
}
