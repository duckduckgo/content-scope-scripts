import { h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useSearchContext } from './SearchForm.js';
import { useComputed } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { Trash } from '../icons/Trash.js';
import { useTypedTranslationWith } from '../../../new-tab/app/types.js';

/**
 * @import json from "../strings.json"
 */

/** @type {Record<import('../../types/history.js').Range, string>} */
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
    recentlyOpened: 'icons/closed.svg',
    older: 'icons/older.svg',
};

/** @type {Record<import('../../types/history.js').Range, (t: (s: keyof json) => string) => string>} */
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
    recentlyOpened: (t) => t('range_recentlyOpened'),
    older: (t) => t('range_older'),
};

/**
 * Renders a sidebar navigation component with links based on the provided ranges.
 *
 * @param {Object} props - The properties object.
 * @param {import('../../types/history.js').Range[]} props.ranges - An array of range values used to generate navigation links.
 */
export function Sidebar({ ranges }) {
    const { t } = useTypedTranslation();
    const search = useSearchContext();
    const current = useComputed(() => search.value.range);
    const others = ranges.filter((x) => x === 'recentlyOpened');
    const main = ranges.filter((x) => x !== 'recentlyOpened');
    return (
        <div class={styles.stack}>
            <h1 class={styles.pageTitle}>{t('page_title')}</h1>
            <nav class={styles.nav}>
                {main.map((range) => {
                    return <Item range={range} key={range} current={current} title={titleMap[range](t)} />;
                })}
            </nav>
            {others.map((range) => {
                return <Item range={range} key={range} current={current} title={titleMap[range](t)} />;
            })}
        </div>
    );
}

/**
 * Renders an item component with additional properties and functionality.
 *
 * @param {Object} props
 * @param {import('../../types/history.js').Range} props.range The range value used for filtering and identification.
 * @param {string} props.title The title or label of the item.
 * @param {import("@preact/signals").Signal<import('../../types/history.js').Range|null>} props.current The current state object used to determine active item styling.
 */
function Item({ range, title, current }) {
    const { t } = useTypedTranslationWith(/** @type {json} */ ({}));
    const label = (() => {
        switch (range) {
            case 'all':
                return t('show_history_all');
            case 'today':
            case 'yesterday':
            case 'monday':
            case 'tuesday':
            case 'wednesday':
            case 'thursday':
            case 'friday':
            case 'saturday':
            case 'sunday':
                return t('show_history_for', { range });
            case 'older':
                return t('show_history_older');
            case 'recentlyOpened':
                return t('show_history_closed');
        }
    })();
    return (
        <a href="#" aria-label={label} data-filter={range} class={cn(styles.item, current.value === range && styles.active)}>
            <span class={styles.icon}>
                <img src={iconMap[range]} />
            </span>
            {title}
            <button class={styles.delete} data-delete-range={range}>
                <Trash />
            </button>
        </a>
    );
}
