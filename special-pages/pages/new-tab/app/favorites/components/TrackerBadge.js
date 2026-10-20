import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './TrackerBadge.module.css';
import { useTypedTranslationWith } from '../../types.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { ShieldCheckIcon } from '../../components/Icons.js';
import { displayNameForCompany } from '../../privacy-stats/privacy-stats.utils.js';
import { useLocale } from '../../../../../shared/components/EnvironmentProvider.js';
import { getLocalizedNumberFormatter } from '../../../../../shared/utils.js';

/**
 * @import enStrings from '../strings.json'
 * @import {FavoriteTrackers} from '../../../types/new-tab'
 */

/** Companies named, and shown as logos, in the pop-over */
const NAMED_LIMIT = 3;

/**
 * The site's domain, as people know it (eg: cnn.com)
 *
 * @param {string | null} etldPlusOne
 * @param {string} url
 */
export function siteName(etldPlusOne, url) {
    if (etldPlusOne) return etldPlusOne;
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function useStrings() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const locale = useLocale();
    const numbers = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    return {
        /** @param {number} n */
        number: (n) => numbers.format(n),
        /**
         * @param {number} n
         * @param {keyof enStrings} one - the string for exactly 1
         * @param {keyof enStrings} many - the string for any other count, with a `{count}` placeholder
         * @param {Record<string, string>} [values] - any other placeholders
         */
        plural: (n, one, many, values) => (n === 1 ? t(one, values) : t(many, { ...values, count: numbers.format(n) })),
    };
}

/**
 * Whether the pop-over is showing: while the pointer is on the badge, or the
 * tile has keyboard focus.
 */
export function useTrackerTip() {
    const [open, setOpen] = useState(false);
    return {
        open,
        pillEvents: {
            onPointerEnter: () => setOpen(true),
            onPointerLeave: () => setOpen(false),
        },
        tileEvents: {
            /** @param {FocusEvent} e */
            onFocus: (e) => setOpen(/** @type {HTMLElement} */ (e.currentTarget).matches(':focus-visible')),
            onBlur: () => setOpen(false),
        },
    };
}

/**
 * Sits on the tile's bottom-right corner, counting the companies whose
 * trackers were blocked on the site.
 *
 * @param {object} props
 * @param {FavoriteTrackers} props.trackers
 * @param {ReturnType<typeof useTrackerTip>['pillEvents']} props.events
 */
export function TrackerPill({ trackers, events }) {
    const { number, plural } = useStrings();
    const count = trackers.companies.length;
    return (
        <span
            class={styles.pill}
            aria-label={plural(count, 'favorites_trackers_badgeLabelSingular', 'favorites_trackers_badgeLabel')}
            {...events}
        >
            <ShieldCheckIcon class={styles.pillIcon} aria-hidden="true" />
            <span aria-hidden="true">{number(count)}</span>
        </span>
    );
}

/**
 * Which companies were blocked on the site, and how many trackers in all.
 * Hangs below the tile, lined up with its outer edge so it stays inside the
 * grid: `align` is 'start' for tiles on the left half of a row.
 *
 * @param {object} props
 * @param {FavoriteTrackers} props.trackers
 * @param {string} props.site - the site's domain, eg: cnn.com
 * @param {'start' | 'end'} props.align
 */
export function TrackerTip({ trackers, site, align }) {
    const { number, plural } = useStrings();
    const named = trackers.companies.slice(0, NAMED_LIMIT);
    const rest = trackers.companies.length - named.length;

    return (
        <div class={cn(styles.tip, align === 'end' && styles.alignEnd)} role="tooltip">
            <p class={styles.listTitle}>
                {plural(trackers.companies.length, 'favorites_trackers_companiesSingular', 'favorites_trackers_companies', { site })}
            </p>
            <ul class={styles.list}>
                {named.map((name) => (
                    <li key={name} class={styles.listRow}>
                        <span class={styles.avatar}>
                            <CompanyIcon displayName={name} />
                        </span>
                        {displayNameForCompany(name)}
                    </li>
                ))}
                {rest > 0 && (
                    <li class={cn(styles.listRow, styles.listMore)}>
                        <span class={styles.moreDot} aria-hidden="true">
                            +{number(rest)}
                        </span>
                        {plural(rest, 'favorites_trackers_moreSingular', 'favorites_trackers_more')}
                    </li>
                )}
            </ul>
            <hr class={styles.divider} />
            <p class={styles.blocked}>
                <img class={styles.shieldIcon} src="./icons/Shield-Color-16.svg" alt="" />
                {plural(trackers.blocked, 'favorites_trackers_blockedSingular', 'favorites_trackers_blocked')}
            </p>
        </div>
    );
}
