import { h } from "preact";
import styles from "./PlayerContainer.module.css";


/**
 * Creates a container for player elements.
 *
 * @param {Object} props - The properties for the PlayerContainer component.
 * @param {import("preact").ComponentChild} props.children - The child elements to render inside the container.
 * @param {boolean} [props.inset] - whether the UI is all inset
 */
export function PlayerContainer({ children, inset }) {
    return (
        <div class={styles.container} data-inset={String(inset)}>
            {children}
        </div>
    )
}

/**
 * Creates a container for player elements.
 *
 * @param {Object} props - The properties for the PlayerContainer component.
 * @param {import("preact").ComponentChild} props.children - The child elements to render inside the container.
 * @param {boolean} [props.inset] - whether the UI is all inset
 */
export function PlayerInternal({children, inset}) {
    return <div class={styles.internals} data-inset={String(inset)}>
        {children}
    </div>
}
