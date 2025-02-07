import { h } from 'preact';
import cn from 'classnames';
import styles from './Sidebar.module.css';
import { useSearchContext } from './SearchForm.js';
import { useComputed } from '@preact/signals';
import { useTypedTranslation } from '../types.js';
import { Trash } from '../icons/Trash.js';

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

function Item({ range, title, current }) {
    return (
        <a href="#" data-filter={range} class={cn(styles.item, current.value === range && styles.active)}>
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
