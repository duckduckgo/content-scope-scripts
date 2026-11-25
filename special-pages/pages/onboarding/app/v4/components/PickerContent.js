import { h } from 'preact';
import cn from 'classnames';
import { useId, useRef, useState } from 'preact/hooks';
import { useTypedTranslation } from '../../types';
import { existingSiteIds } from '../data/existing-favorites';
import { Button } from './Button';
import { Container } from './Container';
import styles from './PickerContent.module.css';

/**
 * @typedef {import('../../types').PickerStep} PickerStep
 * @typedef {import('../../types').PickerSite} PickerSite
 * @typedef {import('../../types').AddFavoritesParams} AddFavoritesParams
 */

/** @type {PickerSite['section'][]} */
const SECTIONS = ['email', 'popular'];

/**
 * Lets the user pick suggested sites to add as favorites. Sites the user already has as favorites show as picked
 * and locked, and stay out of addFavorites.
 *
 * @param {object} props
 * @param {PickerStep} props.step
 * @param {(params: AddFavoritesParams) => void} props.addFavorites
 * @param {() => void} props.advance
 */
export function PickerContent({ step, addFavorites, advance }) {
    const { t } = useTypedTranslation();
    const idPrefix = useId();
    const [pickedIds, setPickedIds] = useState(/** @type {string[]} */ ([]));
    // Set by Add or Skip. The step stays mounted through its exit fade, so every control is off from then on.
    const [done, setDone] = useState(false);
    // Guards a second click landing before the `done` render
    const finished = useRef(false);

    // A native override could send null for either field; fall back rather than break the page
    const sites = step.sites ?? [];
    // Worked out on every render, not stored, so a late config update locks a site the user already toggled
    const existingIds = existingSiteIds(sites, step.existingFavorites ?? []);
    const picks = sites.filter((site) => pickedIds.includes(site.id) && !existingIds.includes(site.id));

    /** @param {PickerSite} site */
    const toggle = (site) => {
        setPickedIds((ids) => {
            if (ids.includes(site.id)) return ids.filter((id) => id !== site.id);
            return [...ids, site.id];
        });
    };

    const add = () => {
        const [first, ...rest] = picks.map(({ id, url }) => ({ id, url }));
        if (finished.current || !first) return;
        finished.current = true;
        setDone(true);
        addFavorites({ favorites: [first, ...rest] });
        advance();
    };

    const skip = () => {
        if (finished.current) return;
        finished.current = true;
        setDone(true);
        advance();
    };

    const headers = {
        email: { heading: t('picker_section_email'), description: t('picker_section_email_description') },
        popular: { heading: t('picker_section_popular'), description: t('picker_section_popular_description') },
    };

    // Only popular sites carry a line of copy. A site without one, like Wikipedia for now, shows its name alone.
    /** @type {Record<string, string>} */
    const siteDescriptions = {
        youtube: t('picker_site_youtube'),
        reddit: t('picker_site_reddit'),
        amazon: t('picker_site_amazon'),
        facebook: t('picker_site_facebook'),
        bbcNews: t('picker_site_bbcNews'),
        netflix: t('picker_site_netflix'),
    };

    return (
        <Container>
            {SECTIONS.map((section) => {
                const sectionSites = sites.filter((site) => site.section === section);
                if (sectionSites.length === 0) return null;
                return (
                    <div key={section} class={styles.section}>
                        <div class={styles.header}>
                            <h3 class={styles.heading}>{headers[section].heading}</h3>
                            <p class={styles.description}>{headers[section].description}</p>
                        </div>
                        <div class={cn(styles.sites, styles[section])}>
                            {sectionSites.map((site, index) => {
                                const existing = existingIds.includes(site.id);
                                const on = existing || pickedIds.includes(site.id);
                                const description = siteDescriptions[site.id];
                                // The description sits inside the switch, so name it by the title alone
                                // Built from the position, as native can send any string as a site id
                                const titleId = `${idPrefix}-${section}-${index}-title`;
                                const descriptionId = `${idPrefix}-${section}-${index}-description`;
                                return (
                                    <button
                                        key={site.id}
                                        type="button"
                                        role="switch"
                                        aria-checked={on}
                                        aria-labelledby={titleId}
                                        aria-describedby={description ? descriptionId : undefined}
                                        class={styles.site}
                                        data-on={on}
                                        disabled={done || existing}
                                        onClick={() => toggle(site)}
                                    >
                                        {/* Placeholder until the favicon decision lands */}
                                        <span class={styles.icon} aria-hidden="true">
                                            {site.title.charAt(0)}
                                            <span class={cn(styles.badge, styles.plus)}>
                                                <PlusBadge />
                                            </span>
                                            <span class={cn(styles.badge, styles.check)}>
                                                <CheckBadge />
                                            </span>
                                        </span>
                                        <span class={styles.text}>
                                            <span id={titleId} class={styles.title}>
                                                {site.title}
                                            </span>
                                            {description && (
                                                <span id={descriptionId} class={styles.siteDescription}>
                                                    {description}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            <div class={styles.actions}>
                <Button variant="secondary" onClick={skip} disabled={done}>
                    {t('picker_skip')}
                </Button>
                <Button variant="primary" onClick={add} disabled={done || picks.length === 0}>
                    {t('picker_add')}
                </Button>
            </div>
        </Container>
    );
}

// Figma's badges: a disc in the badge colour, a glyph and a 2px white ring. The disc and plus glyph colours come
// from CSS; the ring and check glyph are always white. The plus glyph is white too, except in dark, where it's 78%.

function PlusBadge() {
    return (
        <svg width="20.6667" height="20.6667" viewBox="0 0 20.6667 20.6667" aria-hidden="true">
            <circle cx="10.3333" cy="10.3333" r="10.3333" fill="#fff" />
            <circle cx="10.3333" cy="10.3333" r="8.3333" fill="currentColor" />
            <path
                class={styles.plusGlyph}
                d="M9.58333 14.0833V11.0833H6.33333C5.91912 11.0833 5.58333 10.7475 5.58333 10.3333C5.58334 9.91913 5.91912 9.58333 6.33333 9.58333H9.58333V6.58333C9.58333 6.16912 9.91912 5.83333 10.3333 5.83333C10.7475 5.83333 11.0833 6.16912 11.0833 6.58333V9.58333H14.3333L14.3719 9.58431C14.7682 9.60439 15.0833 9.93206 15.0833 10.3333C15.0833 10.7346 14.7682 11.0623 14.3719 11.0824L14.3333 11.0833H11.0833V14.0833C11.0833 14.4975 10.7475 14.8333 10.3333 14.8333C9.91912 14.8333 9.58333 14.4975 9.58333 14.0833Z"
            />
        </svg>
    );
}

function CheckBadge() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#fff" />
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path
                fill="#fff"
                d="M16.7858 10.2748C17.0756 9.97891 17.0707 9.50406 16.7748 9.2142C16.4789 8.92434 16.0041 8.92924 15.7142 9.22513L11.2201 13.8129C11.0237 14.0134 10.7008 14.0134 10.5043 13.8129L8.28577 11.5481C7.99591 11.2522 7.52106 11.2473 7.22516 11.5372C6.92927 11.827 6.92437 12.3019 7.21423 12.5978L9.43279 14.8625C10.2174 15.6635 11.507 15.6635 12.2916 14.8625L16.7858 10.2748Z"
            />
        </svg>
    );
}
