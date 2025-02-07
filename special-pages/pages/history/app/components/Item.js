import { memo } from 'preact/compat';
import cn from 'classnames';
import { END_KIND, TITLE_KIND } from '../utils.js';
import { Fragment, h } from 'preact';
import styles from './Item.module.css';
import { Dots } from '../icons/dots.js';

export const Item = memo(
    /**
     * Renders an individual item with specific styles and layout determined by props.
     *
     * @param {Object} props - An object containing the properties for the item.
     * @param {string} props.id - A unique identifier for the item.
     * @param {string} props.title - The text to be displayed for the item.
     * @param {string} props.url - The text to be displayed for the item.
     * @param {string} props.domain - The text to be displayed for the domain
     * @param {number} props.kind - The kind or type of the item that determines its visual style.
     * @param {string} props.dateRelativeDay - The relative day information to display (shown when kind is equal to TITLE_KIND).
     * @param {string} props.dateTimeOfDay - the time of day, like 11.00am.
     */
    function Item({ id, url, domain, title, kind, dateRelativeDay, dateTimeOfDay }) {
        return (
            <Fragment>
                {kind === TITLE_KIND && (
                    <div class={styles.title} tabindex={0}>
                        {dateRelativeDay}
                        <button class={cn(styles.dots, styles.titleDots)} data-title-menu={id}>
                            <Dots />
                        </button>
                    </div>
                )}
                <div class={cn(styles.row, kind === END_KIND && styles.last)} tabindex={0}>
                    <a href={url} data-url={url} class={styles.entryLink}>
                        {title}
                    </a>
                    <span class={styles.domain}>{domain}</span>
                    <span class={styles.time}>{dateTimeOfDay}</span>
                    <button class={styles.dots} data-row-menu={id}>
                        <Dots />
                    </button>
                </div>
            </Fragment>
        );
    },
);
