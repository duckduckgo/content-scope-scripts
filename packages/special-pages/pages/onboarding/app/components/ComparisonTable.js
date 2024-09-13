import { h } from 'preact'
import { ListItem, availableIcons } from './ListItem'

import styles from './ComparisonTable.module.css'

/** @typedef {{ icon: availableIcons[number], title: string, values: number[] }} TableData */
/** @type {TableData[]} */
const tableData = [
    {
        icon: 'search.png',
        title: 'Search privately by default',
        values: [0, 2]
    },
    {
        icon: 'shield-green.svg',
        title: 'Block 3rd party trackers',
        values: [1, 2]
    },
    {
        icon: 'cookie.png',
        title: 'Block cookie requests & popups',
        values: [0, 2]
    },
    {
        icon: 'fewer-ads.svg',
        title: 'Block targeted ads',
        values: [0, 2]
    },
    {
        icon: 'fire.svg',
        title: 'Erase browsing data swiftly',
        values: [0, 2]
    },
    {
        icon: 'video-player.svg',
        title: 'Watch YouTube more privately',
        values: [0, 2]
    }
]

/**
 * @param {object} props
 * @param {availableIcons[number]} props.icon
 * @param {string} props.title
 * @param {number[]} props.values
 */
export function ComparisonTableRow({ icon, title, values }) {
    return (
        <tr>
            <th scope="row">
                <ListItem as="div" icon={icon} title={title} />
            </th>
            {values.map(value => <td>{value}</td>)}
        </tr>
    )
}

/**
 * @param {object} props
 */
export function ComparisonTable({}) {
    return (
        <table className={styles.table}>
            <caption></caption>
            <thead>
                <tr>
                    <th></th>
                    <th>Safari</th>
                    <th>DDG</th>
                </tr>
            </thead>
            <tbody>
                {tableData.map(data => <ComparisonTableRow {...data} />)}
            </tbody>
        </table>
    )

}