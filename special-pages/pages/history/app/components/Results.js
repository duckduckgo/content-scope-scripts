import { h } from 'preact';
import { OVERSCAN_AMOUNT } from '../constants.js';
import { Item } from './Item.js';
import styles from './VirtualizedList.module.css';
import { VisibleItems } from './VirtualizedList.js';
import { Empty } from './Empty.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import("../global-state/GlobalStateProvider.js").Results>} props.results
 * @param {import("@preact/signals").Signal<Set<number>>} props.selected
 */
export function Results({ results, selected }) {
    if (results.value.items.length === 0) {
        return <Empty />;
    }
    const totalHeight = results.value.heights.reduce((acc, item) => acc + item, 0);
    return (
        <ul class={styles.container} style={{ height: totalHeight + 'px' }}>
            <VisibleItems
                scrollingElement={'main'}
                items={results.value.items}
                heights={results.value.heights}
                overscan={OVERSCAN_AMOUNT}
                renderItem={({ item, cssClassName, style, index }) => {
                    const isSelected = selected.value.has(index);
                    return (
                        <li key={item.id} data-id={item.id} class={cssClassName} style={style} data-is-selected={isSelected}>
                            <Item
                                id={item.id}
                                kind={results.value.heights[index]}
                                url={item.url}
                                domain={item.domain}
                                title={item.title}
                                dateRelativeDay={item.dateRelativeDay}
                                dateTimeOfDay={item.dateTimeOfDay}
                                index={index}
                                selected={isSelected}
                            />
                        </li>
                    );
                }}
            />
        </ul>
    );
}
