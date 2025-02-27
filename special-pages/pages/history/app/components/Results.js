import { h } from 'preact';
import { DDG_DEFAULT_ICON_SIZE, OVERSCAN_AMOUNT } from '../constants.js';
import { Item } from './Item.js';
import styles from './VirtualizedList.module.css';
import { VisibleItems } from './VirtualizedList.js';
import { Empty } from './Empty.js';
import { useSelected } from '../global/Providers/SelectionProvider.js';
import { useHistoryServiceDispatch, useResultsData } from '../global/Providers/HistoryServiceProvider.js';
import { useCallback } from 'preact/hooks';

/**
 * Access global state and render the results
 */
export function ResultsContainer() {
    const results = useResultsData();
    const selected = useSelected();
    const dispatch = useHistoryServiceDispatch();
    /**
     * Let the history service know when it might want to load more
     */
    const onChange = useCallback((end) => dispatch({ kind: 'request-more', end }), [dispatch]);

    return <Results results={results} selected={selected} onChange={onChange} />;
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import("../global/Providers/HistoryServiceProvider.js").Results>} props.results
 * @param {import("@preact/signals").Signal<Set<number>>} props.selected
 * @param {(end: number) => void} props.onChange
 */
export function Results({ results, selected, onChange }) {
    if (results.value.items.length === 0) {
        return <Empty />;
    }

    /**
     * Sum all heights to determin the container height (so that the scroll bar is accurate)
     */
    const totalHeight = results.value.heights.reduce((acc, item) => acc + item, 0);

    return (
        <ul class={styles.container} style={{ height: totalHeight + 'px' }}>
            <VisibleItems
                scrollingElement={'main'}
                items={results.value.items}
                heights={results.value.heights}
                overscan={OVERSCAN_AMOUNT}
                onChange={onChange}
                renderItem={({ item, cssClassName, style, index }) => {
                    const isSelected = selected.value.has(index);
                    const faviconMax = item.favicon?.maxAvailableSize ?? DDG_DEFAULT_ICON_SIZE;
                    const favoriteSrc = item.favicon?.src;
                    return (
                        <li key={item.id} data-id={item.id} class={cssClassName} style={style} data-is-selected={isSelected}>
                            <Item
                                id={item.id}
                                kind={results.value.heights[index]}
                                url={item.url}
                                domain={item.domain}
                                title={item.title}
                                dateTimeOfDay={item.dateTimeOfDay}
                                dateRelativeDay={item.dateRelativeDay}
                                index={index}
                                selected={isSelected}
                                etldPlusOne={item.etldPlusOne ?? null}
                                faviconSrc={favoriteSrc}
                                faviconMax={faviconMax}
                            />
                        </li>
                    );
                }}
            />
        </ul>
    );
}
