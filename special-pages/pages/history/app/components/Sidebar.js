import { h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useComputed } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { Trash } from '../icons/Trash.js';
import { useTypedTranslationWith } from '../../../new-tab/app/types.js';
import { useQueryContext, useQueryDispatch } from '../global/Providers/QueryProvider.js';
import { useHistoryServiceDispatch, useResultsData } from '../global/Providers/HistoryServiceProvider.js';

/**
 * @import json from "../strings.json"
 * @typedef {import('../../types/history.js').Range} Range
 */

/** @type {Record<Range, string>} */
const iconMap = {
    all: 'icons/all.svg',
    today: 'icons/today.svg',
    yesterday: 'icons/yesterday.svg',
    monday: 'icons/day.svg',
    tuesday: 'icons/day.svg',
    wednesday: 'icons/day.svg',
    thursday: 'icons/day.svg',
    friday: 'icons/day.svg',
    saturday: 'icons/day.svg',
    sunday: 'icons/day.svg',
    older: 'icons/older.svg',
};

/** @type {Record<Range, (t: (s: keyof json) => string) => string>} */
const titleMap = {
    all: (t) => t('range_all'),
    today: (t) => t('range_today'),
    yesterday: (t) => t('range_yesterday'),
    monday: (t) => t('range_monday'),
    tuesday: (t) => t('range_tuesday'),
    wednesday: (t) => t('range_wednesday'),
    thursday: (t) => t('range_thursday'),
    friday: (t) => t('range_friday'),
    saturday: (t) => t('range_saturday'),
    sunday: (t) => t('range_sunday'),
    older: (t) => t('range_older'),
};

/**
 * Renders a sidebar navigation component with links based on the provided ranges.
 *
 * @param {Object} props - The properties object.
 * @param {import("@preact/signals").Signal<Range[]>} props.ranges - An array of range values used to generate navigation links.
 */
export function Sidebar({ ranges }) {
    const { t } = useTypedTranslation();
    const search = useQueryContext();
    const current = useComputed(() => search.value.range);
    const results = useResultsData();
    const count = useComputed(() => results.value.items.length);
    const dispatch = useQueryDispatch();
    const historyServiceDispatch = useHistoryServiceDispatch();

    /**
     * @param {Range} range
     */
    function onClick(range) {
        if (range === 'all') {
            dispatch({ kind: 'reset' });
        } else if (range) {
            dispatch({ kind: 'search-by-range', value: range });
        }
    }
    /**
     * @param {Range} range
     */
    function onDelete(range) {
        historyServiceDispatch({ kind: 'delete-range', value: range });
    }

    return (
        <div class={styles.stack}>
            <h1 class={styles.pageTitle}>{t('page_title')}</h1>
            <nav class={styles.nav}>
                {ranges.value.map((range) => {
                    return <Item onClick={onClick} onDelete={onDelete} current={current} range={range} ranges={ranges} count={count} />;
                })}
            </nav>
        </div>
    );
}

/**
 * A component that renders a list item with optional delete actions and a link.
 *
 * @param {Object} props
 * @param {import('@preact/signals').ReadonlySignal<Range|null>} props.current The current selection with a value property.
 * @param {Range} props.range The range represented by this item.
 * @param {(range: Range) => void} props.onClick Callback function triggered when the range is clicked.
 * @param {(range: Range) => void} props.onDelete Callback function triggered when the delete action is clicked.
 * @param {import("@preact/signals").Signal<Range[]>} props.ranges
 * @param {import('@preact/signals').ReadonlySignal<number>} props.count The count value associated with the ranges.
 */
function Item({ current, range, onClick, onDelete, ranges, count }) {
    const { t } = useTypedTranslation();
    const { buttonLabel, linkLabel } = labels(range, t);
    const classNames = useComputed(() => {
        if (range === 'all' && current.value === null) {
            return cn(styles.item, styles.active);
        }
        return cn(styles.item, current.value === range && styles.active);
    });

    return (
        <div class={classNames} key={range}>
            <button
                aria-label={linkLabel}
                className={styles.link}
                tabIndex={0}
                onClick={(e) => {
                    e.preventDefault();
                    onClick(range);
                }}
            >
                <span className={styles.icon}>
                    <img src={iconMap[range]} />
                </span>
                {titleMap[range](t)}
            </button>
            {range === 'all' && <DeleteAllButton onClick={onDelete} ariaLabel={buttonLabel} range={range} ranges={ranges} count={count} />}
            {range !== 'all' && <DeleteButton onClick={() => onDelete(range)} label={buttonLabel} range={range} />}
        </div>
    );
}

/**
 * @param {Object} props
 * @param {Range} props.range The range value used for filtering and identification.
 * @param {string} props.label The title or label of the item.
 * @param {(range: MouseEvent)=>void} props.onClick
 */
function DeleteButton({ range, onClick, label }) {
    return (
        <button class={styles.delete} onClick={onClick} aria-label={label} tabindex={0} value={range}>
            <Trash />
        </button>
    );
}

/**
 * The 'Delete' button for the 'all' range. This is a separate component because it contains
 * logic that's only relevant to this row item.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Range} props.range - The range value used for filtering and identification.
 * @param {import('@preact/signals').Signal<Range[]>} props.ranges - A signal containing an array of range values used for navigation.
 * @param {string} props.ariaLabel - The accessible label for the delete button.
 * @param {(evt: Range) => void} props.onClick - The callback function triggered on button click.
 * @param {import('@preact/signals').Signal<number>} props.count - A signal representing the count of items in the range.
 */
function DeleteAllButton({ range, ranges, onClick, ariaLabel, count }) {
    const { t } = useTypedTranslationWith(/** @type {json} */ ({}));

    const ariaDisabled = useComputed(() => {
        return count.value === 0 && ranges.value.length === 1 ? 'true' : 'false';
    });
    const buttonTitle = useComputed(() => {
        return count.value === 0 && ranges.value.length === 1 ? t('delete_none') : '';
    });

    return (
        <button
            class={styles.delete}
            onClick={(e) => {
                if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                    return;
                }
                onClick(range);
            }}
            aria-label={ariaLabel}
            tabindex={0}
            value={range}
            title={buttonTitle}
            aria-disabled={ariaDisabled}
        >
            <Trash />
        </button>
    );
}

/**
 * @param {Range} range
 * @return {{linkLabel: string, buttonLabel: string}}
 */
function labels(range, t) {
    switch (range) {
        case 'all':
            return { linkLabel: t('show_history_all'), buttonLabel: t('delete_history_all') };
        case 'today':
        case 'yesterday':
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
        case 'saturday':
        case 'sunday':
            return { linkLabel: t('show_history_for', { range }), buttonLabel: t('delete_history_for', { range }) };
        case 'older':
            return { linkLabel: t('show_history_older'), buttonLabel: t('delete_history_older') };
    }
}
