import { h } from 'preact';
import { OVERSCAN_AMOUNT } from '../constants.js';
import styles from './VirtualizedList.module.css';
import { VisibleItems } from './VirtualizedList.js';

const DEMO_ITEMS_COUNT = 4000;
const DEMO_ITEM_HEIGHT = 32;

/**
 *
 */
export function Results() {
    const results = {
        value: {
            items: Array.from({ length: DEMO_ITEMS_COUNT }, (_, index) => ({
                id: `item-${index + 1}`,
                title: `Title ${index + 1}`,
            })),
            heights: Array.from({ length: DEMO_ITEMS_COUNT }, () => DEMO_ITEM_HEIGHT), // Assuming a fixed height of 50 for each item
        },
    };
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
                            <div style={{ height: results.value.heights[index] + 'px', border: '1px dotted black' }}>{item.title}</div>
                        </li>
                    );
                }}
            />
        </ul>
    );
}
