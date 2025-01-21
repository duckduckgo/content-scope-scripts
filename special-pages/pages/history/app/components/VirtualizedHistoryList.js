import { h } from 'preact';
import { useVisibleRows } from '../utils.js';
import { Item } from './Item.js';
import { memo } from 'preact/compat';
import styles from './VirtualizedHistoryList.module.css';

export const VirtualizedHistoryList = memo(
    /**
     * @param {object} props
     * @param {import('../../types/history').HistoryItem[]} props.items
     * @param {number[]} props.heights
     * @param {number} props.overscan
     * @param {any} props.containerRef
     */
    function VirtualizedPreact({ items, heights, overscan, containerRef }) {
        const totalHeight = heights.reduce((acc, item) => acc + item, 0);
        return (
            <div class={styles.container} style={{ height: totalHeight + 'px' }}>
                <Inner items={items} heights={heights} containerRef={containerRef} overscan={overscan} />
            </div>
        );
    },
);

const Inner = memo(
    /**
     * @param {object} props
     * @param {import("../../types/history").HistoryItem[]} props.items
     * @param {number[]} props.heights
     * @param {number} props.overscan
     * @param {any} props.containerRef
     */
    function Inner({ items, heights, overscan, containerRef }) {
        const { start, end } = useVisibleRows(items, heights, containerRef, overscan);
        const subset = items.slice(start, end + 1);
        return (
            <ul>
                {subset.map((item, rowIndex, items) => {
                    const originalIndex = start + rowIndex;
                    const itemTopOffset = heights.slice(0, originalIndex).reduce((acc, item) => acc + item, 0);
                    const kind = heights[originalIndex];
                    return (
                        <li
                            key={item.id}
                            data-id={item.id}
                            class={styles.listItem}
                            style={{
                                transform: `translateY(${itemTopOffset}px)`,
                            }}
                        >
                            <Item
                                id={item.id}
                                kind={kind}
                                url={item.url}
                                title={item.title}
                                dateRelativeDay={item.dateRelativeDay}
                                dateTimeOfDay={item.dateTimeOfDay}
                            />
                        </li>
                    );
                })}
            </ul>
        );
    },
);
