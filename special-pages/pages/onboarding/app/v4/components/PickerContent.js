import { h } from 'preact';
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

    const headings = {
        email: t('picker_section_email'),
        popular: t('picker_section_popular'),
    };

    return (
        <Container>
            {SECTIONS.map((section) => {
                const sectionSites = sites.filter((site) => site.section === section);
                if (sectionSites.length === 0) return null;
                return (
                    <div key={section} class={styles.section}>
                        <h3 class={styles.heading}>{headings[section]}</h3>
                        <div class={styles.sites}>
                            {sectionSites.map((site) => {
                                const existing = existingIds.includes(site.id);
                                const on = existing || pickedIds.includes(site.id);
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
                                        {site.title}
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
