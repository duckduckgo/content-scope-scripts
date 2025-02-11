import { h } from 'preact';
import cn from 'classnames';
import { OVERSCAN_AMOUNT } from '../constants.js';
import { Item } from './Item.js';
import styles from './VirtualizedList.module.css';
import { VisibleItems } from './VirtualizedList.js';
import { useTypedTranslation } from '../types.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import("./App.jsx").Results>} props.results
 */
export function Results({ results }) {
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
                    return (
                        <li key={item.id} data-id={item.id} class={cssClassName} style={style}>
                            <Item
                                id={item.id}
                                kind={results.value.heights[index]}
                                url={item.url}
                                domain={item.domain}
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

/**
 * Empty state component displayed when no results are available
 */
function Empty() {
    const { t } = useTypedTranslation();
    return (
        <div class={cn(styles.emptyState, styles.emptyStateOffset)}>
            <img src="icons/clock.svg" width={128} height={96} alt="" class={styles.emptyStateImage} />
            <h2 class={styles.emptyTitle}>{t('empty_title')}</h2>
        </div>
    );
}
