import { memo } from 'preact/compat';
import cn from 'classnames';
import { BOTH_KIND, END_KIND, TITLE_KIND } from '../utils.js';
import { Fragment, h } from 'preact';
import styles from './Item.module.css';
import { Dots } from '../icons/dots.js';
import { useTypedTranslation } from '../types.js';
import { BTN_ACTION_ENTRIES_MENU, BTN_ACTION_TITLE_MENU, DDG_DEFAULT_ICON_SIZE } from '../constants.js';
import { FaviconWithState } from '../../../../shared/components/FaviconWithState.js';

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
     * @param {string} props.dateTimeOfDay - the time of day, like 11.00am.
     * @param {string} props.dateRelativeDay - the time of day, like 11.00am.
     * @param {string|null} props.etldPlusOne
     * @param {number} props.index - original index
     * @param {boolean} props.selected - whether this item is selected
     * @param {string|null|undefined} props.faviconSrc
     * @param {number} props.faviconMax
     */
    function Item(props) {
        const { title, kind, etldPlusOne, faviconSrc, faviconMax, dateTimeOfDay, dateRelativeDay, index, selected } = props;
        const hasFooterGap = kind === END_KIND || kind === BOTH_KIND;
        const hasTitle = kind === TITLE_KIND || kind === BOTH_KIND;
        return (
            <Fragment>
                {hasTitle && <Heading dateRelativeDay={dateRelativeDay} />}
                <div
                    class={cn(styles.row, styles.hover, hasFooterGap && styles.last)}
                    data-history-entry={props.id}
                    data-index={index}
                    aria-selected={selected}
                >
                    <div class={styles.favicon}>
                        <FaviconWithState
                            fallback={'./company-icons/other.svg'}
                            fallbackDark={'./company-icons/other-dark.svg'}
                            faviconMax={faviconMax}
                            faviconSrc={faviconSrc}
                            etldPlusOne={etldPlusOne}
                            displayKind={'history-favicon'}
                            theme={'light'}
                            defaultSize={DDG_DEFAULT_ICON_SIZE}
                        />
                    </div>
                    <a href={props.url} data-url={props.url} class={styles.entryLink} tabindex={0}>
                        {title}
                    </a>
                    <span class={styles.domain} data-testid="Item.domain">
                        {props.domain}
                    </span>
                    <span class={styles.time}>{dateTimeOfDay}</span>
                    <button class={styles.dots} data-action={BTN_ACTION_ENTRIES_MENU} data-index={index} value={props.id} tabindex={0}>
                        <Dots />
                    </button>
                </div>
            </Fragment>
        );
    },
);

/**
 * @param {object} props
 * @param {string} props.dateRelativeDay
 */
function Heading({ dateRelativeDay }) {
    const { t } = useTypedTranslation();
    return (
        <div className={cn(styles.title, styles.hover)} data-section-title>
            {dateRelativeDay}
            <button
                className={cn(styles.dots, styles.titleDots)}
                data-action={BTN_ACTION_TITLE_MENU}
                value={dateRelativeDay}
                aria-label={t('menu_sectionTitle', { relativeTime: dateRelativeDay })}
                tabIndex={0}
            >
                <Dots />
            </button>
        </div>
    );
}
