import { h } from 'preact'
import cn from 'classnames'
import { ListItem, availableIcons } from './ListItem'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'

import styles from './ComparisonTable.module.css'

/** @enum {string} */
const supportStatus = {
    NOT_SUPPORTED: 'notSupported',
    PARTIAL_SUPPORT: 'partialSupport',
    FULL_SUPPORT: 'fullSupport'
}

/** @typedef {{ icon: availableIcons[number], title: string, values: supportStatus[] }} TableData */
/** @type {TableData[]} */
const tableData = [
    {
        icon: 'search.png',
        title: 'Search privately by default',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'shield-green.svg',
        title: 'Block 3rd party trackers',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.PARTIAL_SUPPORT, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'cookie.png',
        title: 'Block cookie requests & popups',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'fewer-ads.svg',
        title: 'Block targeted ads',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'fire.svg',
        title: 'Erase browsing data swiftly',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'video-player.svg',
        title: 'Watch YouTube more privately',
        values: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    }
]

/**
 * @param {object} props
 * @param {availableIcons[number]} props.icon
 * @param {string} props.title
 * @param {supportStatus[]} props.values
 */
export function ComparisonTableRow({ icon, title, values }) {
    const { injectName: platform } = useEnv()
    const [chromeStatus, safariStatus, ddgStatus] = values

    return (
        <tr>
            <th scope="row">
                <ListItem as="div" icon={icon} title={title} />
            </th>
            { platform === 'windows' && <td>
                <span className={cn(styles.status, styles[chromeStatus])} aria-label="TODO"></span>
            </td> }
            { platform === 'apple' || platform === 'integration' && <td>
                <span className={cn(styles.status, styles[safariStatus])} aria-label="TODO"></span>
            </td> }
            <td>
                <span className={cn(styles.status, styles[ddgStatus])} aria-label="TODO"></span>
            </td>
        </tr>
    )
}

/**
 * @param {object} props
 */
export function ComparisonTable({}) {
    const { injectName: platform } = useEnv()

    return (
        <table className={styles.table}>
            <caption></caption>
            <thead>
                <tr>
                    <th></th>
                    { platform === 'windows' && <th>
                        <span className={cn(styles.browserIcon, styles.browserIconChrome)} aria-label="Chrome"></span>
                    </th> }
                    { platform === 'apple' || platform === 'integration' && <th>
                        <span className={cn(styles.browserIcon, styles.browserIconSafari)} aria-label="Safari"></span>
                    </th> }
                    <th>
                        <span className={cn(styles.browserIcon, styles.browserIconDDG)} aria-label="DuckDuckGo"></span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {tableData.map(data => <ComparisonTableRow {...data} />)}
            </tbody>
        </table>
    )

}