import styles from "./feature-nav.module.css";

/**
 * @typedef LinkItem
 * @property {string} name
 * @property {string} url
 * @property {boolean} active
 */

/**
 * @typedef SubNavItem
 * @property {string} name
 * @property {string} id
 * @property {boolean} active
 */

/**
 * @param {object} props
 * @param {LinkItem[]} props.links
 */
export function FeatureNav(props) {
    return (
        <ul className={styles.root}>
            {props.links.map(link => {
                return (
                    <li key={link.name}>
                        <a href={link.url}
                           data-nav
                           className={styles.link}
                           data-active={link.active}>
                            {link.name}
                        </a>
                    </li>
                )
            })}
        </ul>
    )
}

/**
 * @param {object} props
 * @param {SubNavItem[]} props.items
 * @param {string} props.prefix
 */
export function SubNav(props) {
    return (
        <ul className={styles.subnav}>
            {props.items.map(res => {
                return (
                    <li key={res.name}>
                        <a href={props.prefix + res.id}
                           data-nav
                           className={styles.subnavLink}
                           data-active={res.active}>{res.name}</a>
                    </li>
                )
            })}
        </ul>
    )
}
