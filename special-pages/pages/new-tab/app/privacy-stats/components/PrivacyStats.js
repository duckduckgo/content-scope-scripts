import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './PrivacyStats.module.css';
import { useMessaging, useTypedTranslationWith } from '../../types.js';
import { useCallback, useContext, useId, useMemo, useState } from 'preact/hooks';
import { PrivacyStatsContext, PrivacyStatsProvider } from '../PrivacyStatsProvider.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { viewTransition } from '../../utils.js';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { DDG_STATS_OTHER_COMPANY_IDENTIFIER } from '../constants.js';
import { displayNameForCompany, sortStatsForDisplay } from '../privacy-stats.utils.js';
import { useCustomizerDrawerSettings } from '../../settings.provider.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';

/**
 * @import enStrings from "../strings.json"
 * @import activityStrings from "../../activity/strings.json"
 * @typedef {enStrings & activityStrings} Strings
 * @typedef {import('../../../types/new-tab').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../types/new-tab').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../types/new-tab').StatsConfig} StatsConfig
 * @typedef {import("../PrivacyStatsProvider.js").Events} Events
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function PrivacyStats({ expansion, data, toggle, animation = 'auto-animate' }) {
    if (animation === 'view-transitions') {
        return <WithViewTransitions data={data} expansion={expansion} toggle={toggle} />;
    }

    // no animations
    return <PrivacyStatsConfigured expansion={expansion} data={data} toggle={toggle} />;
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 */
function WithViewTransitions({ expansion, data, toggle }) {
    const willToggle = useCallback(() => {
        viewTransition(toggle);
    }, [toggle]);
    return <PrivacyStatsConfigured expansion={expansion} data={data} toggle={willToggle} />;
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.parentRef]
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 */
function PrivacyStatsConfigured({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === 'expanded';

    const { hasNamedCompanies, recent } = useMemo(() => {
        let recent = 0;
        let hasNamedCompanies = false;
        for (let i = 0; i < data.trackerCompanies.length; i++) {
            recent += data.trackerCompanies[i].count;
            if (!hasNamedCompanies && data.trackerCompanies[i].displayName !== DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
                hasNamedCompanies = true;
            }
        }
        return { hasNamedCompanies, recent };
    }, [data.trackerCompanies]);

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    return (
        <div class={styles.root} ref={parentRef}>
            <Heading
                recent={recent}
                onToggle={toggle}
                expansion={expansion}
                canExpand={hasNamedCompanies}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID,
                }}
            />
            {hasNamedCompanies && expanded && <PrivacyStatsBody trackerCompanies={data.trackerCompanies} listAttrs={{ id: WIDGET_ID }} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {number} props.recent
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function Heading({ expansion, canExpand, recent, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [formatter] = useState(() => new Intl.NumberFormat());

    const none = recent === 0;
    const some = recent > 0;
    const alltime = formatter.format(recent);
    const alltimeTitle = recent === 1 ? t('stats_countBlockedSingular') : t('stats_countBlockedPlural', { count: alltime });

    return (
        <div className={styles.heading}>
            <span className={styles.headingIcon}>
                <img src="./icons/shield.svg" alt="Privacy Shield" />
            </span>
            {none && <h2 className={styles.title}>{t('stats_noRecent')}</h2>}
            {some && <h2 className={styles.title}>{alltimeTitle}</h2>}
            {canExpand && (
                <span className={styles.widgetExpander}>
                    <ShowHideButton
                        buttonAttrs={{
                            ...buttonAttrs,
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                        }}
                        onClick={onToggle}
                        text={expansion === 'expanded' ? t('stats_hideLabel') : t('stats_toggleLabel')}
                        shape="round"
                    />
                </span>
            )}
            {recent === 0 && <p className={styles.subtitle}>{t('stats_noActivity')}</p>}
            {recent > 0 && <p className={cn(styles.subtitle, styles.uppercase)}>{t('stats_feedCountBlockedPeriod')}</p>}
        </div>
    );
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {number} props.trackerCount
 * @param {number} props.itemCount
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function ActivityHeading({ expansion, canExpand, itemCount, trackerCount, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [formatter] = useState(() => new Intl.NumberFormat());

    const none = itemCount === 0;
    const someItems = itemCount > 0;
    const trackerCountFormatted = formatter.format(trackerCount);
    const allTimeString =
        trackerCount === 1 ? t('stats_countBlockedSingular') : t('stats_countBlockedPlural', { count: trackerCountFormatted });

    return (
        <div className={styles.heading} data-testid={'ActivityHeading'}>
            <span className={styles.headingIcon}>
                <img src="./icons/shield.svg" alt="Privacy Shield" />
            </span>
            {none && <h2 className={styles.title}>{t('activity_noRecent_title')}</h2>}
            {someItems && <h2 className={styles.title}>{allTimeString}</h2>}
            {canExpand && (
                <span className={styles.widgetExpander}>
                    <ShowHideButton
                        buttonAttrs={{
                            ...buttonAttrs,
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                        }}
                        onClick={onToggle}
                        text={expansion === 'expanded' ? t('stats_hideLabel') : t('stats_toggleLabel')}
                        shape="round"
                    />
                </span>
            )}
            {itemCount === 0 && <p className={styles.subtitle}>{t('activity_noRecent_subtitle')}</p>}
            {itemCount > 0 && <p className={cn(styles.subtitle, styles.uppercase)}>{t('stats_feedCountBlockedPeriod')}</p>}
        </div>
    );
}

/**
 * @param {object} props
 * @param {import("preact").ComponentProps<'ul'>} [props.listAttrs]
 * @param {TrackerCompany[]} props.trackerCompanies
 */

export function PrivacyStatsBody({ trackerCompanies, listAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const messaging = useMessaging();
    const [formatter] = useState(() => new Intl.NumberFormat());
    const defaultRowMax = 5;
    const sorted = sortStatsForDisplay(trackerCompanies);
    const max = sorted[0]?.count ?? 0;
    const [expansion, setExpansion] = useState(/** @type {Expansion} */ ('collapsed'));

    const toggleListExpansion = () => {
        if (expansion === 'collapsed') {
            messaging.statsShowMore();
        } else {
            messaging.statsShowLess();
        }
        setExpansion(expansion === 'collapsed' ? 'expanded' : 'collapsed');
    };

    const rows = expansion === 'expanded' ? sorted : sorted.slice(0, defaultRowMax);

    return (
        <Fragment>
            <ul {...listAttrs} class={styles.list} data-testid="CompanyList">
                {rows.map((company) => {
                    const percentage = Math.min((company.count * 100) / max, 100);
                    const valueOrMin = Math.max(percentage, 10);
                    const inlineStyles = {
                        width: `${valueOrMin}%`,
                    };
                    const countText = formatter.format(company.count);
                    const displayName = displayNameForCompany(company.displayName);
                    if (company.displayName === DDG_STATS_OTHER_COMPANY_IDENTIFIER) {
                        const otherText = t('stats_otherCount', { count: String(company.count) });
                        return (
                            <li key={company.displayName} class={styles.otherTrackersRow}>
                                {otherText}
                            </li>
                        );
                    }
                    return (
                        <li key={company.displayName} class={styles.row}>
                            <div class={styles.company}>
                                <CompanyIcon displayName={displayName} />
                                <span class={styles.name}>{displayName}</span>
                            </div>
                            <span class={styles.count}>{countText}</span>
                            <span class={styles.bar}></span>
                            <span class={styles.fill} style={inlineStyles}></span>
                        </li>
                    );
                })}
            </ul>
            {sorted.length > defaultRowMax && (
                <div class={styles.listExpander}>
                    <ShowHideButton
                        onClick={toggleListExpansion}
                        text={expansion === 'collapsed' ? t('ntp_show_more') : t('ntp_show_less')}
                        showText={true}
                        buttonAttrs={{
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                        }}
                    />
                </div>
            )}
        </Fragment>
    );
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function PrivacyStatsCustomized() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const drawer = useCustomizerDrawerSettings();

    /**
     * The menu title for the stats widget is changes when the menu is in the sidebar.
     */
    // prettier-ignore
    const sectionTitle = drawer.state === 'enabled'
        ? t('stats_menuTitle_v2')
        : t('stats_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'shield', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <PrivacyStatsProvider>
            <PrivacyStatsConsumer />
        </PrivacyStatsProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <PrivacyStatsProvider>
 *     <PrivacyStatsConsumer />
 * </PrivacyStatsProvider>
 * ```
 */
export function PrivacyStatsConsumer() {
    const { state, toggle } = useContext(PrivacyStatsContext);
    if (state.status === 'ready') {
        return (
            <PrivacyStats expansion={state.config.expansion} animation={state.config.animation?.kind} data={state.data} toggle={toggle} />
        );
    }
    return null;
}
