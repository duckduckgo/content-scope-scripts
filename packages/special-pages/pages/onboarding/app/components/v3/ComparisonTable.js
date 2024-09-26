import { h } from 'preact'
import cn from 'classnames'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { comparisonTableData, tableIconPrefix } from './data-comparison-table'
import { useTypedTranslation } from '../../types'

import styles from './ComparisonTable.module.css'

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
 * @param {Omit<import('./data-comparison-table').FeatureSupportData, 'statuses'>} props
 */
export function ComparisonTableRowHeading ({ icon, title }) {
    const path = tableIconPrefix + icon

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
 * @param {import('./data-comparison-table').SupportStatus} props.status
 */
export function ComparisonTableCell ({ status }) {
    const { t } = useTypedTranslation()
    // eslint-disable-next-line
    // @ts-ignore TODO: Fix type
    const arialLabel = t(`comparison_${status}`)

    return (
        <td className={styles.rowCell}>
            <span className={cn(styles.status, styles[status])} aria-label={arialLabel}></span>
        </td>
    )
}

/**
 * @param {import('./data-comparison-table').FeatureSupportData} props
 */
export function ComparisonTableRow ({ icon, title, statuses }) {
    const { injectName: platform } = useEnv()
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
    const { t } = useTypedTranslation()
    const tableData = comparisonTableData(t)

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
                {tableData.map(data => <ComparisonTableRow {...data} />)}
            </tbody>
        </table>
    )
}
