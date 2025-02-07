import { h } from 'preact';
import { OVERSCAN_AMOUNT } from '../constants.js';
import { Item } from './Item.js';
import styles from './VirtualizedHistoryList.module.css';
import { VisibleItems } from './VirtualizedList.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import("./App.jsx").Results>} props.results
 */
export function Results({ results }) {
    const totalHeight = results.value.heights.reduce((acc, item) => acc + item, 0);
    return (
        <ul class={styles.container} style={{ height: totalHeight + 'px' }}>
            <VisibleItems
                scrollingElement={'main'}
                items={results.value.items}
                heights={results.value.heights}
                overscan={OVERSCAN_AMOUNT}
                renderItem={({ item, cssClassName, style, index }) => {
                    return (
                        <li key={item.id} data-id={item.id} class={cssClassName} style={style}>
                            <Item
                                id={item.id}
                                kind={results.value.heights[index]}
                                url={item.url}
                                title={item.title}
                                dateRelativeDay={item.dateRelativeDay}
                                dateTimeOfDay={item.dateTimeOfDay}
                            />
                        </li>
                    );
                }}
            />
        </ul>
    );
}
