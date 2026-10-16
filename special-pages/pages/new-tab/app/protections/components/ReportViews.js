import { Fragment, h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './ProtectionsReport.module.css';
import { ShieldCheckIcon, FingerprintIcon } from '../../components/Icons.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { FaviconWithState } from '../../../../../shared/components/FaviconWithState.js';
import { DDG_FALLBACK_ICON, DDG_FALLBACK_ICON_DARK } from '../../favorites/constants.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useLocale } from '../../../../../shared/components/EnvironmentProvider.js';
import { displayNameForCompany } from '../../privacy-stats/privacy-stats.utils.js';
import { loadVoices, readDeviceDetails } from '../utils/device-details.js';
import {
    frequencyOf,
    groupByPurpose,
    MORE_COMPANIES_AVATAR_LIMIT,
    MORE_COMPANIES_NAME_LIMIT,
    namedCompanies,
    purposesFor,
    PURPOSE_AVATAR_LIMIT,
    SITE_AVATAR_LIMIT,
    TOP_SITE_ORBIT_LIMIT,
    TOP_COMPANIES_LIMIT,
    totalCompanies,
} from '../utils/report.js';
import { useReportFormat, useReportTranslation } from './report-text.js';

/**
 * The report's views, apart from the by-site one (the activity feed, passed
 * in by the caller).
 *
 * @import {Strings} from './report-text.js'
 * @typedef {import('../../../types/new-tab.js').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../types/new-tab.js').TrackerCompany} TrackerCompany
 * @typedef {import('../utils/report.js').PurposeId} PurposeId
 * @typedef {import('../utils/report.js').SurfaceId} SurfaceId
 */

/** @type {Record<PurposeId, keyof Strings>} */
const PURPOSE_TITLES = {
    advertising: 'protections_report_purposeAdvertising',
    social: 'protections_report_purposeSocial',
    fingerprinting: 'protections_report_purposeFingerprinting',
    sessionReplay: 'protections_report_purposeSessionReplay',
    analytics: 'protections_report_purposeAnalytics',
};

/** Mid-sentence forms, for the 2nd+ items in a list */
/** @type {Record<PurposeId, keyof Strings>} */
const PURPOSE_INLINE = {
    advertising: 'protections_report_purposeAdvertisingInline',
    social: 'protections_report_purposeSocialInline',
    fingerprinting: 'protections_report_purposeFingerprintingInline',
    sessionReplay: 'protections_report_purposeSessionReplayInline',
    analytics: 'protections_report_purposeAnalyticsInline',
};

/** @type {Record<SurfaceId, keyof Strings>} */
const SURFACE_LABELS = {
    graphics: 'protections_report_surfaceGraphics',
    screen: 'protections_report_surfaceScreen',
    locale: 'protections_report_surfaceLocale',
    fonts: 'protections_report_surfaceFonts',
    audio: 'protections_report_surfaceAudio',
    hardware: 'protections_report_surfaceHardware',
    voices: 'protections_report_surfaceVoices',
};

function BlockedBadge() {
    const { t } = useReportTranslation();
    return (
        <span class={styles.blocked}>
            <ShieldCheckIcon class={styles.blockedIcon} aria-hidden="true" />
            {t('protections_report_blocked')}
        </span>
    );
}

/**
 * A row of overlapping company logos.
 *
 * @param {object} props
 * @param {string[]} props.names
 * @param {string} [props.className]
 * @param {import('preact').ComponentChild} [props.children] - after the logos, eg: "+27"
 */
function Avatars({ names, className, children }) {
    return (
        <span class={cn(styles.avatars, className)} aria-hidden="true">
            {names.map((name) => (
                <span key={name} class={styles.avatar}>
                    <CompanyIcon displayName={name} />
                </span>
            ))}
            {children}
        </span>
    );
}

/**
 * "Why we blocked them"
 *
 * @param {object} props
 * @param {TrackerCompany[]} props.companies
 */
export function PurposesView({ companies }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const groups = groupByPurpose(companies);
    /**
     * The first two names, then "N others"
     *
     * @param {string[]} names
     */
    const companyList = (names) => {
        if (names.length <= 2) return format.list(names);
        const others = format.plural(names.length - 2, 'protections_report_othersSingular', 'protections_report_othersPlural');
        return format.list([names[0], names[1], others]);
    };

    return (
        <ul class={styles.list} data-testid="ProtectionsReportPurposes">
            {groups.map((group) => {
                const more = group.companies.length - PURPOSE_AVATAR_LIMIT;
                return (
                    <li key={group.id} class={styles.row}>
                        <Avatars names={group.companies.slice(0, PURPOSE_AVATAR_LIMIT)}>
                            {more > 0 && (
                                <span class={styles.avatarMore}>
                                    {t('protections_report_moreCompanies', { count: format.number(more) })}
                                </span>
                            )}
                        </Avatars>
                        <span class={styles.rowText}>
                            <span class={styles.rowTitle}>{t(PURPOSE_TITLES[group.id])}</span>
                            <span class={styles.rowLine}>{companyList(group.companies)}</span>
                        </span>
                        <BlockedBadge />
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * "Who we blocked the most"
 *
 * @param {object} props
 * @param {PrivacyStatsData} props.stats
 */
export function CompaniesView({ stats }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const named = namedCompanies(stats.trackerCompanies);
    const top = named.slice(0, TOP_COMPANIES_LIMIT);
    const rest = named.slice(TOP_COMPANIES_LIMIT).map((c) => displayNameForCompany(c.displayName));
    // includes companies native grouped under `__other__`, which have no names
    const moreCount = totalCompanies(stats) - top.length;

    return (
        <ul class={styles.list} data-testid="ProtectionsReportCompanies">
            {top.map((company) => {
                const name = displayNameForCompany(company.displayName);
                const purposes = purposesFor(company);
                const description =
                    purposes.length > 0
                        ? t('protections_report_companyPurposes', {
                              purposes: format.list(purposes.map((id, i) => t(i === 0 ? PURPOSE_TITLES[id] : PURPOSE_INLINE[id]))),
                          })
                        : format.plural(company.count, 'protections_report_attemptsSingular', 'protections_report_attemptsPlural');

                return (
                    <li key={company.displayName} class={styles.row}>
                        <span class={styles.companyIcon} aria-hidden="true">
                            <CompanyIcon displayName={name} />
                        </span>
                        <span class={styles.rowText}>
                            <span class={styles.rowLineEmphasis}>
                                <CompanyTitle name={name} sitesCount={company.sitesCount} totalSitesVisited={stats.totalSitesVisited} />
                            </span>
                            <span class={styles.rowLine}>{description}</span>
                        </span>
                        <BlockedBadge />
                    </li>
                );
            })}
            {moreCount > 0 && <MoreCompaniesRow count={moreCount} names={rest} />}
        </ul>
    );
}

/**
 * Closes the "Who we blocked the most" list with everyone else, eg:
 * "43 more companies tried too / Including Criteo, Oracle, and The Trade Desk"
 *
 * @param {object} props
 * @param {number} props.count - companies not listed above
 * @param {string[]} props.names - their names, most widespread first (may be fewer than `count`)
 */
function MoreCompaniesRow({ count, names }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const listed = names.slice(0, MORE_COMPANIES_NAME_LIMIT);

    return (
        <li class={styles.row} data-testid="ProtectionsReportMoreCompanies">
            {names.length > 0 && <Avatars names={names.slice(0, MORE_COMPANIES_AVATAR_LIMIT)} className={styles.avatarsAuto} />}
            <span class={styles.rowText}>
                <span class={styles.rowTitle}>
                    {format.plural(count, 'protections_report_moreCompaniesSingular', 'protections_report_moreCompaniesPlural')}
                </span>
                {listed.length > 0 && (
                    <span class={styles.rowLine}>{t('protections_report_including', { companies: format.list(listed) })}</span>
                )}
            </span>
            <BlockedBadge />
        </li>
    );
}

/**
 * "<b>Google</b> was on 4 out of 5 sites you visited". The company name is
 * rendered as a node rather than injected as markup.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {number | undefined} props.sitesCount
 * @param {number | undefined} props.totalSitesVisited
 */
function CompanyTitle({ name, sitesCount, totalSitesVisited }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    if (sitesCount === undefined) return <strong>{name}</strong>;

    const freq = frequencyOf(sitesCount, totalSitesVisited);
    const frequency = t(freq.key, freq.count === undefined ? undefined : { count: format.number(freq.count) });
    // leave {company} in place so it can be swapped for a node
    const [before, after = ''] = t('protections_report_companyWasOn', { frequency }).split('{company}');
    return (
        <Fragment>
            {before}
            <strong>{name}</strong>
            {after}
        </Fragment>
    );
}

/**
 * "How they try to recognize you": this device's own details, next to how many
 * of the companies blocked this week are known to read each one.
 *
 * @param {object} props
 * @param {ReturnType<typeof import('../utils/report.js').groupBySurface>} props.recognition
 */
export function RecognitionView({ recognition }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const locale = useLocale();
    const kilo = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);
    // read once, when the view is opened
    const [device, setDevice] = useState(readDeviceDetails);

    // the voice list can arrive a moment later
    useEffect(() => {
        let cancelled = false;
        const fillVoices = async () => {
            const voices = await loadVoices();
            if (!cancelled) setDevice((prev) => ({ ...prev, voices }));
        };
        fillVoices();
        return () => {
            cancelled = true;
        };
    }, []);

    /** @param {SurfaceId} id */
    const value = (id) => {
        switch (id) {
            case 'graphics':
                return device.graphics;
            case 'screen':
                return (
                    device.screen &&
                    t('protections_report_screenValue', {
                        // no thousands separators: screen sizes read as 2560 × 1440
                        width: String(device.screen.width),
                        height: String(device.screen.height),
                        depth: String(device.screen.colorDepth),
                    })
                );
            case 'locale':
                return device.locale && t('protections_report_localeValue', device.locale);
            case 'fonts':
                return (
                    device.fonts &&
                    t('protections_report_fontsValue', {
                        found: format.number(device.fonts.found),
                        checked: format.number(device.fonts.checked),
                    })
                );
            case 'hardware':
                if (!device.hardware) return null;
                return device.hardware.memory
                    ? t('protections_report_hardwareValue', {
                          cores: format.number(device.hardware.cores),
                          memory: kilo.format(device.hardware.memory),
                      })
                    : t('protections_report_hardwareCoresValue', { cores: format.number(device.hardware.cores) });
            case 'voices':
                if (!device.voices) return null;
                return format.plural(device.voices, 'protections_report_voicesValueSingular', 'protections_report_voicesValuePlural');
            case 'audio':
                return (
                    device.audio &&
                    t('protections_report_audioValue', {
                        rate: kilo.format(device.audio.sampleRate / 1000),
                        channels: format.number(device.audio.channels),
                    })
                );
        }
    };

    const intro = format.plural(
        recognition.total,
        'protections_report_recognitionIntroSingular',
        'protections_report_recognitionIntroPlural',
    );

    return (
        <div data-testid="ProtectionsReportRecognition">
            <p class={styles.viewIntro}>
                <Trans str={intro} values={{}} />
            </p>
            <dl class={styles.deviceCard}>
                {recognition.surfaces.map((surface) => (
                    <div key={surface.id} class={styles.deviceRow} data-surface={surface.id}>
                        <dt class={styles.deviceKey}>{t(SURFACE_LABELS[surface.id])}</dt>
                        <dd class={styles.deviceValue}>{value(surface.id) ?? t('protections_report_valueUnavailable')}</dd>
                        <dd class={styles.deviceCount}>
                            {format.plural(surface.count, 'protections_report_knownBySingular', 'protections_report_knownByPlural')}
                        </dd>
                    </div>
                ))}
            </dl>
            <p class={styles.viewFootnote}>
                <span class={styles.footnoteIcon}>
                    <FingerprintIcon aria-hidden="true" />
                </span>
                {t('protections_report_recognitionFooter')}
            </p>
        </div>
    );
}

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').SiteTrackers} props.site
 * @param {boolean} [props.large] - favorites-sized, so the letter fallback scales up too
 */
function SiteFavicon({ site, large = false }) {
    return (
        <FaviconWithState
            faviconSrc={site.favicon?.src}
            faviconMax={site.favicon?.maxAvailableSize ?? 32}
            etldPlusOne={site.etldPlusOne}
            theme={'light'}
            displayKind={large ? 'favorite-tile' : 'history-favicon'}
            key={`${site.favicon?.src}:${site.etldPlusOne}`}
            fallback={DDG_FALLBACK_ICON}
            fallbackDark={DDG_FALLBACK_ICON_DARK}
        />
    );
}

/** Orbit geometry for the top site, in px: the ring's centre and radius, and logo sizes */
const ORBIT = { center: 92, radius: 70, lead: 30, rest: 22, leadCount: 3 };

/**
 * "Which sites had the most trackers": the nosiest site with its companies
 * circling it, then the next few.
 *
 * @param {object} props
 * @param {import('../utils/report.js').RankedSite[]} props.sites
 */
export function TopSitesView({ sites }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const [top, ...rest] = sites;
    if (!top) return null;

    const orbit = top.companies.slice(0, TOP_SITE_ORBIT_LIMIT);
    const count = top.companies.length;

    return (
        <div data-testid="ProtectionsReportTopSites">
            <div class={styles.topSite}>
                <div class={styles.orbit} aria-hidden="true">
                    <span class={styles.orbitRing} />
                    <span class={styles.orbitCenter}>
                        <SiteFavicon site={top.site} large />
                    </span>
                    {orbit.map((name, k) => {
                        const size = k < ORBIT.leadCount ? ORBIT.lead : ORBIT.rest;
                        const angle = -Math.PI / 2 + (k * 2 * Math.PI) / orbit.length;
                        return (
                            <span
                                key={name}
                                class={styles.orbitLogo}
                                title={name}
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    left: `${Math.round(ORBIT.center + ORBIT.radius * Math.cos(angle) - size / 2)}px`,
                                    top: `${Math.round(ORBIT.center + ORBIT.radius * Math.sin(angle) - size / 2)}px`,
                                }}
                            >
                                <CompanyIcon displayName={name} />
                            </span>
                        );
                    })}
                </div>
                <div class={styles.topSiteText}>
                    <span class={styles.topSiteLabel}>{t('protections_report_topSiteLabel')}</span>
                    <span class={styles.topSiteDomain}>{top.site.etldPlusOne}</span>
                    <span class={styles.topSiteCount}>
                        {format.plural(count, 'protections_report_topSiteCountSingular', 'protections_report_topSiteCountPlural')}
                    </span>
                    <span class={styles.topSiteWatching}>
                        {count === 1
                            ? t('protections_report_topSiteWatchingSingular', { companies: top.companies[0] })
                            : t('protections_report_topSiteWatchingPlural', { companies: format.list(top.companies.slice(0, 2)) })}
                    </span>
                </div>
            </div>
            {rest.length > 0 && (
                <ul class={styles.siteList}>
                    {rest.map(({ site, companies }) => (
                        <li key={site.etldPlusOne} class={styles.siteRow}>
                            <span class={styles.siteIcon}>
                                <SiteFavicon site={site} />
                            </span>
                            <span class={styles.siteDomain}>{site.etldPlusOne}</span>
                            <Avatars
                                names={companies.slice(0, SITE_AVATAR_LIMIT)}
                                className={cn(styles.avatarsAuto, styles.avatarsSmall)}
                            />
                            <span class={styles.siteCount}>
                                {format.plural(
                                    companies.length,
                                    'protections_report_siteCompaniesSingular',
                                    'protections_report_siteCompaniesPlural',
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
