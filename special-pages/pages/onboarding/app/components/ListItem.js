import { h } from 'preact'
import cn from 'classnames'
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
    'import.png',
    'search.png',
    'session-restore.png',
    'shield.png',
    'switch.png',
    'v3/default-browser.svg',
    'v3/dock.svg',
    'v3/favorite.svg',
    'v3/home.svg',
    'v3/import.svg',
    'v3/session-restore.svg'
])

const prefix = 'assets/img/steps/'

/**
 * ListItem component is used to display an item in a list.
 * @param {Object} props - The properties for the ListItem component.
 * @param {availableIcons[number]} props.icon - The icon for the ListItem.
 * @param {import("preact").ComponentChild} [props.inline] - optional inline children
 * @param {number} [props.index=0] - optional inline children
 * @param {import("preact").ComponentChild} [props.children] - optional children to displayed below
 * @param {import("preact").ComponentChild} props.title - The text for the title
 * @param {import("preact").ComponentChild} [props.secondaryText] - The text for the secondary line
 * @param {boolean} [props.animate=true] - The text for the secondary line
 */
export function ListItem ({ animate = false, ...props }) {
    const path = prefix + props.icon
    return (
        <li className={cn(styles.step, animate ? styles.slideIn : undefined)} data-testid="ListItem" data-index={String(props.index)}>
            <div className={cn(styles.inner)}>
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
