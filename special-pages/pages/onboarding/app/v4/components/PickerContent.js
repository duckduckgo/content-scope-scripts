import { h } from 'preact';
import cn from 'classnames';
import { useRef, useState } from 'preact/hooks';
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
                        <div class={styles.sites} data-section={section}>
                            {sectionSites.map((site) => {
                                const existing = existingIds.includes(site.id);
                                const on = existing || pickedIds.includes(site.id);
                                const description = siteDescriptions[site.id];
                                return (
                                    <button
                                        key={site.id}
                                        type="button"
                                        role="switch"
                                        aria-checked={on}
                                        class={styles.site}
                                        data-on={on}
                                        disabled={done || existing}
                                        onClick={() => toggle(site)}
                                    >
                                        {/* Placeholder until the favicon decision lands */}
                                        <span class={styles.icon} aria-hidden="true">
                                            {site.title.charAt(0)}
                                            <span class={cn(styles.badge, styles.plus)}>
                                                <img
                                                    class={styles.light}
                                                    src="assets/img/v4/icons/picker-plus.svg"
                                                    width="20.6667"
                                                    height="20.6667"
                                                    alt=""
                                                />
                                                <img
                                                    class={styles.dark}
                                                    src="assets/img/v4/icons/picker-plus-dark.svg"
                                                    width="20.6667"
                                                    height="20.6667"
                                                    alt=""
                                                />
                                            </span>
                                            <span class={cn(styles.badge, styles.check)}>
                                                <img
                                                    class={styles.light}
                                                    src="assets/img/v4/icons/picker-check.svg"
                                                    width="24"
                                                    height="24"
                                                    alt=""
                                                />
                                                <img
                                                    class={styles.dark}
                                                    src="assets/img/v4/icons/picker-check-dark.svg"
                                                    width="24"
                                                    height="24"
                                                    alt=""
                                                />
                                            </span>
                                        </span>
                                        <span class={styles.text}>
                                            <span class={styles.title}>{site.title}</span>
                                            {description && <span class={styles.siteDescription}>{description}</span>}
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
