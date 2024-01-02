import { h } from 'preact'
import styles from './ListItem.module.css'
import { Check } from './Icons'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const availableIcons = /** @type {const} */ ([
    'bookmarks.png',
    'browsing.png',
    'cookie.png',
    'dock.png',
    'duckplayer.png',
    'home.png',
    'search.png',
    'session-restore.png',
    'shield.png',
    'import.png',
    'switch.png'
])

const prefix = 'assets/img/steps/'

/**
 * ListItem component is used to display an item in a list.
 * @param {Object} props - The properties for the ListItem component.
 * @param {availableIcons[number]} props.icon - The icon for the ListItem.
 * @param {import("preact").ComponentChild} [props.inline] - optional inline children
 * @param {import("preact").ComponentChild} [props.children] - optional children to displayed below
 * @param {import("preact").ComponentChild} props.title - The text for the title
 * @param {import("preact").ComponentChild} [props.secondaryText] - The text for the secondary line
 */
export function ListItem (props) {
    const path = prefix + props.icon
    return (
        <li className={styles.step} data-testid="ListItem">
            <div className={styles.inner}>
                <div className={styles.icon} style={`background-image: url(${path});`}></div>
                <div className={styles.contentWrapper}>
                    <div className={styles.content}>
                        <p className={styles.title}>{props.title}</p>
                        {props.secondaryText && (
                            <p className={styles.secondaryText}>{props.secondaryText}</p>
                        )}
                    </div>
                    <div className={styles.inlineAction}>
                        {props.inline}
                    </div>
                </div>
            </div>
            <div className={styles.children}>{props.children}</div>
        </li>
    )
}

ListItem.Indent = function ({ children }) {
    return <div className={styles.indentChild}>{children}</div>
}

/**
 * ListItem component is used to display an item in a list.
 * @param {Object} props - The properties for the ListItem component.
 * @param {availableIcons[number]} props.icon - The icon for the ListItem.
 * @param {import("preact").ComponentChild} props.title - The text for the title
 */
export function ListItemPlain (props) {
    const path = prefix + props.icon
    return (
        <li className={styles.plain} data-testid="ListItem">
            <Check />
            <div className={styles.plainContent}>
                <div className={styles.iconSmall} style={`background-image: url(${path});`}></div>
                <p className={styles.title}>{props.title}</p>
            </div>
        </li>
    )
}
