import { h } from 'preact'
import cn from 'classnames'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'

import styles from './ComparisonTable.module.css'

/** @enum {string} */
const supportStatus = {
    NOT_SUPPORTED: 'notSupported',
    PARTIAL_SUPPORT: 'partialSupport',
    FULL_SUPPORT: 'fullSupport'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const availableIcons = [
    'ads.svg',
    'cookie.svg',
    'fire.svg',
    'search.svg',
    'shield.svg',
    'video-player.svg'
]

const prefix = 'assets/img/steps/v3/'

/** @typedef {{ icon: availableIcons[number], title: string, statuses: supportStatus[] }} TableData */
/** @type {TableData[]} */
const tableData = [
    {
        icon: 'search.svg',
        title: 'Search privately by default',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'shield.svg',
        title: 'Block 3rd party trackers',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.PARTIAL_SUPPORT, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'cookie.svg',
        title: 'Block cookie requests & popups',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'ads.svg',
        title: 'Block targeted ads',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'fire.svg',
        title: 'Erase browsing data swiftly',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'video-player.svg',
        title: 'Watch YouTube more privately',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    }
]

/**
 * @param {object} props
 * @param {string} props.title
 */
export function ComparisonTableColumnHeading ({ title }) {
    const className = `browserIcon${title}`

    return (
        <th>
            <span className={cn(styles.browserIcon, styles[className])} aria-label={title}></span>
        </th>
    )
}

/**
 * @param {object} props
 * @param {availableIcons[number]} props.icon
 * @param {string} props.title
 */
export function ComparisonTableRowHeading ({ icon, title }) {
    const path = prefix + icon

    return (
        <th scope="row" className={styles.rowHeading}>
            <div className={styles.rowHeadingContents}>
                <img className={styles.rowIcon} src={path} aria-hidden="true" />
                {title}
            </div>
        </th>
    )
}

/**
 * @param {object} props
 * @param {supportStatus} props.status
 */
export function ComparisonTableCell ({ status }) {
    return (
        <td className={styles.rowCell}>
            <span className={cn(styles.status, styles[status])} aria-label="TODO"></span>
        </td>
    )
}

/**
 * @param {object} props
 * @param {availableIcons[number]} props.icon
 * @param {string} props.title
 * @param {supportStatus[]} props.statuses
 * @param {ReturnType<useEnv>['injectName']} props.platform
 */
export function ComparisonTableRow ({ icon, title, statuses, platform }) {
    const [chromeStatus, safariStatus, ddgStatus] = statuses

    return (
        <tr className={styles.row}>
            <ComparisonTableRowHeading icon={icon} title={title} />
            { platform === 'windows' && <ComparisonTableCell status={chromeStatus} /> }
            { (platform === 'apple' || platform === 'integration') && <ComparisonTableCell status={safariStatus} /> }
            <ComparisonTableCell status={ddgStatus} />
        </tr>
    )
}

export function ComparisonTable () {
    const { injectName: platform } = useEnv()

    return (
        <table className={styles.table}>
            <caption></caption>
            <thead>
                <tr>
                    <th></th>
                    { platform === 'windows' && <ComparisonTableColumnHeading title="Chrome" /> }
                    { (platform === 'apple' || platform === 'integration') && <ComparisonTableColumnHeading title="Safari" /> }
                    <ComparisonTableColumnHeading title="DuckDuckGo" />
                </tr>
            </thead>
            <tbody>
                {tableData.map(data => <ComparisonTableRow {...data} platform={platform} />)}
            </tbody>
        </table>
    )
}
