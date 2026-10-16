import { createContext, Fragment, h } from 'preact';
import { useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './ProtectionsReport.module.css';
import protectionsStyles from './Protections.module.css';
import { useTypedTranslationWith } from '../../types.js';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import { InfoIcon, ShieldCheckIcon, ChevronSmall, FingerprintIcon, ShareIcon } from '../../components/Icons.js';
import { CAPTURE_EXCLUDE, prepareShareImage, shareAsImage, whenSettled } from '../utils/share-image.js';
import { FaviconWithState } from '../../../../../shared/components/FaviconWithState.js';
import { DDG_FALLBACK_ICON, DDG_FALLBACK_ICON_DARK } from '../../favorites/constants.js';
import { loadVoices, readDeviceDetails } from '../utils/device-details.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { Dropdown } from '../../omnibar/components/chat-tools/dropdown/Dropdown.js';
import { DropdownItem } from '../../omnibar/components/chat-tools/dropdown/DropdownItem.js';
import { useDropdown } from '../../omnibar/components/chat-tools/useDropdown.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useEnv, useLocale } from '../../../../../shared/components/EnvironmentProvider.js';
import { getLocalizedNumberFormatter } from '../../../../../shared/utils.js';
import { useAnimatedCount } from '../utils/useAnimatedCount.js';
import { PryingEye } from './PryingEye.js';
import {
    frequencyOf,
    groupByPurpose,
    groupBySurface,
    hasPurposeData,
    MORE_COMPANIES_AVATAR_LIMIT,
    MORE_COMPANIES_NAME_LIMIT,
    namedCompanies,
    purposesFor,
    PURPOSE_AVATAR_LIMIT,
    rankTopSites,
    SITE_AVATAR_LIMIT,
    TOP_SITE_ORBIT_LIMIT,
    TOP_COMPANIES_LIMIT,
    totalCompanies,
} from '../utils/report.js';
import { displayNameForCompany } from '../../privacy-stats/privacy-stats.utils.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {enStrings} Strings
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').ProtectionsConfig} ProtectionsConfig
 * @typedef {import('../../../types/new-tab.js').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../types/new-tab.js').TrackerCompany} TrackerCompany
 * @typedef {import('../utils/report.js').PurposeId} PurposeId
 * @typedef {import('../utils/report.js').SurfaceId} SurfaceId
 * @typedef {'purposes' | 'recognition' | 'companies' | 'activity' | 'top-sites'} ReportView
 */

/**
 * Who the report speaks to. On the page it addresses the reader ("trackers
 * tried to watch you"); in the picture they share, it speaks as them
 * ("trackers tried to watch me", "DuckDuckGo blocked…").
 *
 * @typedef {'you' | 'me'} Voice
 */
const VoiceContext = createContext(/** @type {Voice} */ ('you'));

/**
 * Strings with a first-person version (the same key plus `FirstPerson`), used
 * in the shared picture. Everything else reads the same either way.
 *
 * @type {Set<keyof Strings>}
 */
const FIRST_PERSON = new Set(
    /** @type {(keyof Strings)[]} */ ([
        'protections_report_headlineSingular',
        'protections_report_headlinePlural',
        'protections_report_blockedSingular',
        'protections_report_blockedPlural',
        'protections_report_cookiePopUpsSingular',
        'protections_report_cookiePopUpsPlural',
        'protections_report_viewPurposes',
        'protections_report_viewCompanies',
        'protections_report_viewRecognition',
        'protections_report_viewTopSites',
        'protections_report_purposeAdvertising',
        'protections_report_purposeSocial',
        'protections_report_purposeFingerprinting',
        'protections_report_purposeSessionReplay',
        'protections_report_purposeAnalytics',
        'protections_report_purposeAdvertisingInline',
        'protections_report_purposeSocialInline',
        'protections_report_purposeFingerprintingInline',
        'protections_report_purposeSessionReplayInline',
        'protections_report_purposeAnalyticsInline',
        'protections_report_freqNearlyAll',
        'protections_report_freqFourInFive',
        'protections_report_freqTwoInThree',
        'protections_report_freqMoreThanHalf',
        'protections_report_freqHalf',
        'protections_report_freqAlmostHalf',
        'protections_report_freqOneInThree',
        'protections_report_freqMoreThanOneInFour',
        'protections_report_freqOneInFive',
        'protections_report_freqSitesSingular',
        'protections_report_freqSitesPlural',
        'protections_report_recognitionIntroSingular',
        'protections_report_recognitionIntroPlural',
        'protections_report_recognitionFooter',
    ]),
);

/**
 * Translations in the report's current voice (see `VoiceContext`).
 */
function useReportTranslation() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const voice = useContext(VoiceContext);
    return {
        /**
         * @param {keyof Strings} key
         * @param {Record<string, string>} [values]
         */
        t: (key, values) => t(voice === 'me' && FIRST_PERSON.has(key) ? /** @type {keyof Strings} */ (`${key}FirstPerson`) : key, values),
    };
}

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

/** @type {Record<ReportView, keyof Strings>} */
const VIEW_LABELS = {
    purposes: 'protections_report_viewPurposes',
    recognition: 'protections_report_viewRecognition',
    companies: 'protections_report_viewCompanies',
    activity: 'protections_report_viewSites',
    'top-sites': 'protections_report_viewTopSites',
};

/**
 * The view menu, in order: why, who, where, when, how.
 *
 * @type {ReportView[]}
 */
const VIEW_ORDER = ['purposes', 'companies', 'top-sites', 'activity', 'recognition'];

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

/**
 * Maps the persisted feed onto a view this report can show: the saved view if
 * there's data for it, otherwise the first one that has data. `privacy-stats`
 * is the retired Summary tab, so it always lands on the first view.
 *
 * @param {ProtectionsConfig['feed']} feed
 * @param {ReportView[]} available - in menu order
 * @return {ReportView}
 */
export function resolveView(feed, available) {
    const saved = available.find((v) => v === feed);
    return saved ?? available[0] ?? 'activity';
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 * @param {ProtectionsConfig['feed']} props.feed
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 * @param {number} props.blockedCount - tracking attempts blocked this week
 * @param {number | null | undefined} props.cookiePopUpsBlocked
 * @param {PrivacyStatsData} props.stats
 * @param {import('preact').ComponentChild} [props.sites] - the by-site view, rendered when that view is active
 * @param {import('preact').RefObject<HTMLElement>} [props.rootRef] - lets the caller scroll the report into view
 * @param {boolean} [props.shareCopy] - this is the hidden copy drawn into the shared picture (see `useShareCopy`):
 *   in the reader's own voice, with a still eye, and with the final numbers rather than counting up to them
 */
export function ProtectionsReport({
    expansion,
    toggle,
    feed,
    setFeed,
    blockedCount,
    cookiePopUpsBlocked,
    stats,
    sites,
    rootRef: externalRef,
    shareCopy = false,
}) {
    const { isReducedMotion } = useEnv();
    const ownRef = useRef(/** @type {HTMLElement|null} */ (null));
    const rootRef = externalRef ?? ownRef;
    const bodyId = useId();
    const expanded = expansion === 'expanded';
    // the blocked count and the weekly stats arrive separately, so they can briefly disagree
    const isEmpty = blockedCount === 0 || totalCompanies(stats) === 0;
    const recognition = useMemo(() => groupBySurface(stats.trackerCompanies), [stats.trackerCompanies]);
    const topSites = useMemo(() => rankTopSites(stats), [stats]);
    /** @type {Record<ReportView, boolean>} */
    const hasData = {
        purposes: hasPurposeData(stats.trackerCompanies),
        recognition: recognition.total > 0,
        companies: true,
        activity: true,
        'top-sites': topSites.length > 0,
    };
    const views = VIEW_ORDER.filter((v) => hasData[v]);
    const view = resolveView(feed, views);
    const panel = useHeldHeight(view);
    const body = useCollapse(expanded, isReducedMotion);
    // the by-site list fetches when shown, so leave it out once fully collapsed
    // (but keep it while collapsing, so it animates closed with the rest)
    const bodyOpen = expanded || !body.shut;
    const copy = useShareCopy(rootRef);

    return (
        <VoiceContext.Provider value={shareCopy ? 'me' : 'you'}>
            <section
                class={cn(protectionsStyles.root, styles.report)}
                ref={rootRef}
                data-expanded={expanded}
                data-empty={isEmpty}
                data-testid={shareCopy ? 'ProtectionsReportShareCopy' : 'ProtectionsReport'}
            >
                <TitleRow expanded={expanded} toggle={toggle} bodyId={bodyId} />
                {isEmpty ? (
                    <EmptyHeadline />
                ) : (
                    <Headline
                        expanded={expanded}
                        companyCount={totalCompanies(stats)}
                        blockedCount={blockedCount}
                        countUp={!shareCopy}
                        eye={<PryingEye zoneRef={rootRef} tracking={!shareCopy && expanded && !isReducedMotion} />}
                    />
                )}
                <div
                    class={styles.collapsible}
                    ref={body.outerRef}
                    data-expanded={expanded}
                    data-settled={body.height === 'auto'}
                    style={{ height: body.height }}
                    data-testid="ProtectionsReportBody"
                    id={bodyId}
                    aria-hidden={!expanded}
                    inert={!expanded}
                >
                    <div class={styles.collapsibleInner} ref={body.innerRef}>
                        <hr class={styles.divider} />
                        {isEmpty ? (
                            <EmptyBody label="purposes" />
                        ) : (
                            <Fragment>
                                <ViewMenu
                                    views={views}
                                    current={view}
                                    onSelect={(next) => {
                                        // re-picking the current view renders nothing new, so there'd be nothing to release the hold
                                        if (next !== view) panel.hold();
                                        setFeed(next);
                                    }}
                                />
                                <div class={styles.panel} data-view={view} ref={panel.panelRef}>
                                    <div ref={panel.contentRef}>
                                        {view === 'purposes' && <PurposesView companies={stats.trackerCompanies} />}
                                        {view === 'recognition' && <RecognitionView recognition={recognition} />}
                                        {view === 'companies' && <CompaniesView stats={stats} />}
                                        {view === 'activity' && bodyOpen && sites}
                                        {view === 'top-sites' && <TopSitesView sites={topSites} />}
                                    </div>
                                </div>
                                <ReportFooter
                                    cookiePopUpsBlocked={cookiePopUpsBlocked}
                                    // the by-site list is personal browsing history, so it isn't offered for sharing
                                    canShare={view !== 'activity'}
                                    // the copy keeps the button (it's left out of the picture) so it lays out the same
                                    share={shareCopy ? null : copy}
                                />
                            </Fragment>
                        )}
                    </div>
                </div>
            </section>
            {copy.width !== null && (
                <div class={styles.shareCopy} style={{ width: `${copy.width}px` }} aria-hidden="true" inert>
                    <ProtectionsReport
                        expansion="expanded"
                        toggle={noop}
                        feed={view}
                        setFeed={noop}
                        blockedCount={blockedCount}
                        cookiePopUpsBlocked={cookiePopUpsBlocked}
                        stats={stats}
                        rootRef={copy.copyRef}
                        shareCopy
                    />
                </div>
            )}
        </VoiceContext.Provider>
    );
}

function noop() {}

/**
 * The shared picture shows a copy of the report rather than the report
 * itself: the copy speaks in the reader's voice ("me"), so it reads right
 * when they post it, and capturing it leaves the report on the page alone.
 * It's laid out off-screen at the report's width, only while it's needed:
 * from when a share looks likely (the pointer reaches the button) until it's
 * done.
 *
 * @param {import('preact').RefObject<HTMLElement>} liveRef - the report on the page
 */
function useShareCopy(liveRef) {
    const [width, setWidth] = useState(/** @type {number | null} */ (null));
    const copyRef = useRef(/** @type {HTMLElement | null} */ (null));

    return {
        width,
        copyRef,
        /** Lays out the copy, if it isn't already */
        mount: () => {
            const live = liveRef.current;
            if (live) setWidth(live.offsetWidth);
        },
        /** Removes the copy; the next share lays it out again */
        release: () => setWidth(null),
        /**
         * The copy, once it's laid out and its images have loaded.
         *
         * @return {Promise<HTMLElement | null>}
         */
        ready: async () => {
            const live = liveRef.current;
            if (!live) return null;
            setWidth(live.offsetWidth);
            return await whenSettled(() => copyRef.current);
        },
    };
}

/**
 * @typedef {ReturnType<typeof useShareCopy>} ShareCopy
 */

/** Longest we'll wait for a view to render before letting the panel shrink */
const HOLD_HEIGHT_TIMEOUT = 2000;

/**
 * Keeps the panel at its current height while the next view loads (the
 * by-site view fetches its data on demand). Without this the page briefly
 * gets shorter and the scroll position jumps.
 *
 * @param {ReportView} view
 */
function useHeldHeight(view) {
    const panelRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const contentRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        const panel = panelRef.current;
        const content = contentRef.current;
        if (!panel || !content || !panel.style.minHeight) return;
        const release = () => {
            panel.style.minHeight = '';
        };
        // fires once on observe, then whenever the new view grows
        const ro = new ResizeObserver(() => {
            if (content.offsetHeight > 0) release();
        });
        ro.observe(content);
        const timer = setTimeout(release, HOLD_HEIGHT_TIMEOUT);
        return () => {
            ro.disconnect();
            clearTimeout(timer);
        };
    }, [view]);

    return {
        panelRef,
        contentRef,
        hold: () => {
            const panel = panelRef.current;
            if (panel) panel.style.minHeight = `${panel.offsetHeight}px`;
        },
    };
}

/**
 * @param {object} props
 * @param {boolean} props.expanded
 * @param {() => void} props.toggle
 * @param {string} props.bodyId
 */
function TitleRow({ expanded, toggle, bodyId }) {
    const { t } = useReportTranslation();
    return (
        <div class={styles.titleRow}>
            <img class={styles.titleIcon} src="./icons/Shield-Color-16.svg" alt="" />
            <h2 class={styles.title}>{t('protections_menuTitle')}</h2>
            <InfoButton />
            <span class={styles.toggle} {...{ [CAPTURE_EXCLUDE]: '' }}>
                <ShowHideButtonCircle
                    buttonAttrs={{
                        'aria-controls': bodyId,
                        'aria-expanded': expanded,
                        'aria-pressed': expanded,
                    }}
                    onClick={toggle}
                    label={expanded ? t('protections_report_collapseLabel') : t('protections_report_expandLabel')}
                />
            </span>
        </div>
    );
}

/** How long the pointer can be away from the info button + pop-over before it closes */
const INFO_CLOSE_DELAY = 160;

/**
 * Opens on hover or click; closes on pointer leave, Escape or outside click.
 */
function InfoButton() {
    const { t } = useReportTranslation();
    const [open, setOpen] = useState(false);
    const popoverId = useId();
    const wrapperRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const closeTimer = useRef(/** @type {ReturnType<typeof setTimeout>|undefined} */ (undefined));
    // opened by the pointer arriving, so the click that usually follows keeps it open
    const openedByHover = useRef(false);

    useEffect(() => {
        if (!open) return;
        /** @param {KeyboardEvent} e */
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        /** @param {MouseEvent} e */
        const onDown = (e) => {
            if (!wrapperRef.current?.contains(/** @type {Node} */ (e.target))) setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [open]);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const show = () => {
        clearTimeout(closeTimer.current);
        if (!open) openedByHover.current = true;
        setOpen(true);
    };
    const hideSoon = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            openedByHover.current = false;
            setOpen(false);
        }, INFO_CLOSE_DELAY);
    };

    return (
        <div class={styles.info} ref={wrapperRef} onMouseEnter={show} onMouseLeave={hideSoon} {...{ [CAPTURE_EXCLUDE]: '' }}>
            <button
                type="button"
                class={styles.infoButton}
                aria-label={t('protections_report_infoLabel')}
                aria-expanded={open}
                aria-controls={popoverId}
                onClick={() => {
                    clearTimeout(closeTimer.current);
                    setOpen((x) => openedByHover.current || !x);
                    openedByHover.current = false;
                }}
            >
                <InfoIcon />
            </button>
            {open && (
                <div class={styles.infoPopover} id={popoverId} role="dialog" aria-label={t('protections_report_infoTitle')}>
                    <h3 class={styles.infoTitle}>{t('protections_report_infoTitle')}</h3>
                    <p>{t('protections_report_infoBody1')}</p>
                    <p>{t('protections_report_infoBody2')}</p>
                </div>
            )}
        </div>
    );
}

/**
 * Two versions of the headline sit on top of each other: the full one with
 * the eye, and a compact one for the collapsed widget (the text reflows into
 * the space the eye leaves). Toggling crossfades between them while the
 * container animates between their measured heights.
 *
 * @param {object} props
 * @param {boolean} props.expanded
 * @param {number} props.companyCount
 * @param {number} props.blockedCount
 * @param {boolean} props.countUp - whether to count up to `blockedCount` when it first comes into view
 * @param {import('preact').ComponentChild} props.eye
 */
function Headline({ expanded, companyCount, blockedCount, countUp, eye }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const countRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const animatedBlocked = useAnimatedCount(blockedCount, countRef);
    const shownBlocked = countUp ? animatedBlocked : blockedCount;

    const headline =
        companyCount === 1
            ? t('protections_report_headlineSingular')
            : t('protections_report_headlinePlural', { count: formatter.format(companyCount) });
    const blocked =
        blockedCount === 1
            ? t('protections_report_blockedSingular')
            : t('protections_report_blockedPlural', { count: formatter.format(shownBlocked) });

    /** @param {boolean} active */
    const text = (active) => (
        <div class={styles.headlineText} data-testid={active ? 'ProtectionsReportSummary' : undefined}>
            <h3 class={styles.headline} data-testid={active ? 'ProtectionsReportHeadline' : undefined}>
                <Trans str={headline} values={{}} />
            </h3>
            <p class={styles.subheadline}>
                <Trans str={blocked} values={{}} />
            </p>
        </div>
    );

    return (
        <div ref={countRef}>
            <CrossfadeHeader
                expanded={expanded}
                full={
                    <div class={styles.headlineRow}>
                        {text(expanded)}
                        <div class={styles.eyeSlot}>{eye}</div>
                    </div>
                }
                compact={<div class={styles.headlineCompact}>{text(!expanded)}</div>}
            />
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.expanded
 * @param {import('preact').ComponentChild} props.full
 * @param {import('preact').ComponentChild} props.compact
 */
function CrossfadeHeader({ expanded, full, compact }) {
    const fullRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const compactRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const [heights, setHeights] = useState(/** @type {{full: number, compact: number} | null} */ (null));

    useLayoutEffect(() => {
        const a = fullRef.current;
        const b = compactRef.current;
        if (!a || !b) return;
        const measure = () => {
            const next = { full: a.offsetHeight, compact: b.offsetHeight };
            if (!next.full || !next.compact) return;
            setHeights((prev) => (prev && prev.full === next.full && prev.compact === next.compact ? prev : next));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(a);
        ro.observe(b);
        return () => ro.disconnect();
    }, []);

    const height = heights ? (expanded ? heights.full : heights.compact) : undefined;

    return (
        <div class={styles.headSwitch} style={{ height: height === undefined ? undefined : `${height}px` }}>
            <div ref={fullRef} class={styles.headLayer} data-active={expanded} aria-hidden={!expanded}>
                {full}
            </div>
            <div ref={compactRef} class={styles.headLayer} data-active={!expanded} aria-hidden={expanded}>
                {compact}
            </div>
        </div>
    );
}

/** Keep in sync with the height transition on `.collapsible` */
const COLLAPSE_MS = 340;

/**
 * Animates the body between its measured height and 0. While fully expanded
 * the height is `auto`, so the content can grow (eg: the activity list
 * loading) without being clipped.
 *
 * @param {boolean} expanded
 * @param {boolean} reducedMotion
 */
function useCollapse(expanded, reducedMotion) {
    const outerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const innerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const [height, setHeight] = useState(expanded ? 'auto' : '0px');
    // true once the body has finished collapsing
    const [shut, setShut] = useState(!expanded);
    const isFirstRender = useRef(true);

    useLayoutEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner || reducedMotion) {
            setHeight(expanded ? 'auto' : '0px');
            setShut(!expanded);
            return;
        }
        let frame = 0;
        let timer;
        if (expanded) {
            setShut(false);
            // animate to the content's height, then let it grow freely
            setHeight(`${inner.offsetHeight}px`);
            timer = setTimeout(() => setHeight('auto'), COLLAPSE_MS + 20);
        } else {
            // start from where it is now (it may still be opening), since `auto` can't be transitioned
            setHeight(`${outer.getBoundingClientRect().height}px`);
            frame = requestAnimationFrame(() => {
                frame = requestAnimationFrame(() => setHeight('0px'));
            });
            timer = setTimeout(() => setShut(true), COLLAPSE_MS + 20);
        }
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timer);
        };
    }, [expanded, reducedMotion]);

    return { outerRef, innerRef, height, shut };
}

function EmptyHeadline() {
    const { t } = useReportTranslation();
    return (
        <div class={styles.headlineText} data-testid="ProtectionsReportSummary">
            <h3 class={styles.headline} data-testid="ProtectionsReportHeadline">
                {t('protections_report_emptyTitle')}
            </h3>
            <p class={styles.subheadline}>{t('protections_report_emptyBody')}</p>
        </div>
    );
}

/**
 * Placeholder rows that preview what fills in once trackers are blocked.
 * @param {object} props
 * @param {ReportView} props.label - the view whose name is shown, greyed out
 */
function EmptyBody({ label }) {
    const { t } = useReportTranslation();
    return (
        <div data-testid="ProtectionsReportEmpty">
            <div class={cn(styles.viewTrigger, styles.viewTriggerDisabled)} aria-hidden="true">
                <span class={styles.viewLabel}>
                    <ViewLabel view={label} />
                </span>
                <ChevronSmall />
            </div>
            <ul class={styles.list} aria-hidden="true">
                {[1, 0.6, 0.3].map((opacity) => (
                    <li key={opacity} class={styles.row} style={{ opacity }}>
                        <span class={styles.avatars}>
                            <span class={cn(styles.avatar, styles.skeleton)} />
                            <span class={cn(styles.avatar, styles.skeleton)} />
                            <span class={cn(styles.avatar, styles.skeleton)} />
                        </span>
                        <span class={styles.rowText}>
                            <span class={cn(styles.skeletonLine, styles.skeleton)} />
                            <span class={cn(styles.skeletonLineShort, styles.skeleton)} />
                        </span>
                    </li>
                ))}
            </ul>
            <p class={styles.emptyFooter}>{t('protections_report_emptyFooter')}</p>
        </div>
    );
}

/**
 * A view's name, with its question word (why, who, where…) in bold.
 *
 * @param {object} props
 * @param {ReportView} props.view
 */
function ViewLabel({ view }) {
    const { t } = useReportTranslation();
    return <Trans str={t(VIEW_LABELS[view])} values={{}} />;
}

/**
 * @param {object} props
 * @param {ReportView[]} props.views
 * @param {ReportView} props.current
 * @param {(feed: ProtectionsConfig['feed']) => void} props.onSelect
 */
function ViewMenu({ views, current, onSelect }) {
    const { t } = useReportTranslation();
    const menu = useDropdown({ align: 'left', offsetY: 4 });
    return (
        <div class={styles.viewMenu}>
            <button
                ref={menu.buttonRef}
                type="button"
                class={styles.viewTrigger}
                aria-haspopup="menu"
                aria-expanded={menu.isOpen}
                onClick={menu.toggle}
                data-testid="ProtectionsReportViewMenu"
            >
                <span class={styles.viewLabel}>
                    <ViewLabel view={current} />
                </span>
                {/* left out of the shared image: there's no menu to open there */}
                <span class={styles.viewChevron} {...{ [CAPTURE_EXCLUDE]: '' }}>
                    <ChevronSmall />
                </span>
            </button>
            {menu.isOpen && menu.dropdownPos && (
                <Dropdown
                    role="menu"
                    ariaLabel={t('protections_report_viewMenuLabel')}
                    className={styles.viewDropdown}
                    position={menu.dropdownPos}
                    dropdownRef={menu.dropdownRef}
                    onClose={({ restoreFocus }) => {
                        menu.close();
                        if (restoreFocus) menu.buttonRef.current?.focus();
                    }}
                    idPrefix="protections-report-view"
                >
                    {views.map((v) => (
                        <DropdownItem
                            key={v}
                            role="menuitemradio"
                            name={<ViewLabel view={v} />}
                            isSelected={v === current}
                            ariaChecked={v === current}
                            onSelect={() => {
                                onSelect(v);
                                menu.close();
                                menu.buttonRef.current?.focus();
                            }}
                        />
                    ))}
                </Dropdown>
            )}
        </div>
    );
}

/**
 * Joins names using the locale's list rules, collapsing everything past the
 * first two into "N others".
 */
function useCompanyList() {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const list = useMemo(() => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }), [locale]);
    /** @param {string[]} names */
    return (names) => {
        if (names.length <= 2) return list.format(names);
        const rest = names.length - 2;
        const others =
            rest === 1 ? t('protections_report_othersSingular') : t('protections_report_othersPlural', { count: formatter.format(rest) });
        return list.format([names[0], names[1], others]);
    };
}

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
 * "Why we blocked them"
 *
 * @param {object} props
 * @param {TrackerCompany[]} props.companies
 */
function PurposesView({ companies }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const groups = groupByPurpose(companies);
    const formatList = useCompanyList();

    return (
        <ul class={styles.list} data-testid="ProtectionsReportPurposes">
            {groups.map((group) => {
                const shown = group.companies.slice(0, PURPOSE_AVATAR_LIMIT);
                const more = group.companies.length - shown.length;
                return (
                    <li key={group.id} class={styles.row} data-purpose={group.id}>
                        <span class={styles.avatars} aria-hidden="true">
                            {shown.map((name) => (
                                <span key={name} class={styles.avatar}>
                                    <CompanyIcon displayName={name} />
                                </span>
                            ))}
                            {more > 0 && (
                                <span class={styles.avatarMore}>
                                    {t('protections_report_moreCompanies', { count: formatter.format(more) })}
                                </span>
                            )}
                        </span>
                        <span class={styles.rowText}>
                            <span class={styles.rowTitle}>{t(PURPOSE_TITLES[group.id])}</span>
                            <span class={styles.rowLine}>{formatList(group.companies)}</span>
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
function CompaniesView({ stats }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const list = useMemo(() => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }), [locale]);
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
                              purposes: list.format(purposes.map((id, i) => t(i === 0 ? PURPOSE_TITLES[id] : PURPOSE_INLINE[id]))),
                          })
                        : company.count === 1
                          ? t('protections_report_attemptsSingular')
                          : t('protections_report_attemptsPlural', { count: formatter.format(company.count) });

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
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const list = useMemo(() => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }), [locale]);
    const logos = names.slice(0, MORE_COMPANIES_AVATAR_LIMIT);
    const listed = names.slice(0, MORE_COMPANIES_NAME_LIMIT);

    return (
        <li class={styles.row} data-testid="ProtectionsReportMoreCompanies">
            {logos.length > 0 && (
                <span class={cn(styles.avatars, styles.avatarsAuto)} aria-hidden="true">
                    {logos.map((name) => (
                        <span key={name} class={styles.avatar}>
                            <CompanyIcon displayName={name} />
                        </span>
                    ))}
                </span>
            )}
            <span class={styles.rowText}>
                <span class={styles.rowTitle}>
                    {count === 1
                        ? t('protections_report_moreCompaniesSingular')
                        : t('protections_report_moreCompaniesPlural', { count: formatter.format(count) })}
                </span>
                {listed.length > 0 && (
                    <span class={styles.rowLine}>{t('protections_report_including', { companies: list.format(listed) })}</span>
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
    if (sitesCount === undefined) return <strong>{name}</strong>;

    const freq = frequencyOf(sitesCount, totalSitesVisited);
    const frequency = t(freq.key, freq.count === undefined ? undefined : { count: String(freq.count) });
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

/** Name of the downloaded picture */
const SHARE_FILENAME = 'duckduckgo-protections-report.png';

/**
 * The cookie pop-up count (when there is one) and the share button.
 *
 * @param {object} props
 * @param {number | null | undefined} props.cookiePopUpsBlocked - undefined = unsupported, null = feature disabled
 * @param {boolean} props.canShare - whether to show the share button
 * @param {ShareCopy | null} props.share - what the share button captures; `null` for a button that does nothing
 */
function ReportFooter({ cookiePopUpsBlocked: count, canShare, share }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const showCookies = typeof count === 'number' && Number.isFinite(count) && count >= 1;
    const text = !showCookies
        ? null
        : count === 1
          ? t('protections_report_cookiePopUpsSingular')
          : t('protections_report_cookiePopUpsPlural', { count: formatter.format(Math.floor(count)) });
    if (!text && !canShare) return null;
    return (
        <Fragment>
            <hr class={styles.divider} />
            <div class={styles.footer}>
                {text && (
                    <p class={styles.cookieFooter} data-testid="ProtectionsReportCookies">
                        <img class={styles.cookieIcon} src="./icons/Cookie-Color-24.svg" alt="" />
                        {text}
                    </p>
                )}
                {canShare && <ShareButton copy={share} />}
            </div>
        </Fragment>
    );
}

/**
 * Shares a picture of the report through the system share sheet, or
 * downloads it where sharing files isn't available.
 *
 * @param {object} props
 * @param {ShareCopy | null} props.copy - the copy of the report to capture; `null` in the copy itself
 */
function ShareButton({ copy }) {
    const { t } = useReportTranslation();
    const [busy, setBusy] = useState(false);
    // read by handlers that can run before a re-render: disabling the button
    // while busy blurs it, for one
    const busyRef = useRef(false);
    const engaged = useRef(false);
    const strings = () => ({
        title: t('protections_report_shareTitle'),
        body: t('protections_report_shareBody'),
        cta: t('protections_report_shareCta'),
    });
    // a click usually follows, so get the copy and the slow part of the picture ready now
    const prepare = async () => {
        engaged.current = true;
        if (!copy || busyRef.current) return;
        const node = await copy.ready();
        if (node) await prepareShareImage(node, strings());
    };
    const disengage = () => {
        engaged.current = false;
        if (!busyRef.current) copy?.release();
    };
    const share = async () => {
        if (!copy || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const node = await copy.ready();
            if (!node) throw new Error('the report has gone');
            await shareAsImage(node, SHARE_FILENAME, strings());
        } catch (e) {
            // eg: a resource the capture couldn't read; nothing useful to show the user
            console.warn('Could not save the Protections Report as an image', e);
        } finally {
            busyRef.current = false;
            setBusy(false);
            if (!engaged.current) copy.release();
        }
    };
    return (
        <button
            type="button"
            class={styles.shareButton}
            aria-label={t('protections_report_shareLabel')}
            title={t('protections_report_shareLabel')}
            aria-busy={busy}
            disabled={busy}
            onClick={copy ? share : undefined}
            onPointerEnter={copy ? prepare : undefined}
            onPointerLeave={copy ? disengage : undefined}
            onFocus={copy ? prepare : undefined}
            onBlur={copy ? disengage : undefined}
            data-testid={copy ? 'ProtectionsReportShare' : undefined}
            {...{ [CAPTURE_EXCLUDE]: '' }}
        >
            <ShareIcon aria-hidden="true" />
        </button>
    );
}

/**
 * "How they try to recognize you": this device's own details, next to how many
 * of the companies blocked this week are known to read each one.
 *
 * @param {object} props
 * @param {ReturnType<typeof groupBySurface>} props.recognition
 */
function RecognitionView({ recognition }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
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
                        found: formatter.format(device.fonts.found),
                        checked: formatter.format(device.fonts.checked),
                    })
                );
            case 'hardware':
                if (!device.hardware) return null;
                return device.hardware.memory
                    ? t('protections_report_hardwareValue', {
                          cores: formatter.format(device.hardware.cores),
                          memory: kilo.format(device.hardware.memory),
                      })
                    : t('protections_report_hardwareCoresValue', { cores: formatter.format(device.hardware.cores) });
            case 'voices':
                if (!device.voices) return null;
                return device.voices === 1
                    ? t('protections_report_voicesValueSingular')
                    : t('protections_report_voicesValuePlural', { count: formatter.format(device.voices) });
            case 'audio':
                return (
                    device.audio &&
                    t('protections_report_audioValue', {
                        rate: kilo.format(device.audio.sampleRate / 1000),
                        channels: formatter.format(device.audio.channels),
                    })
                );
        }
    };

    const intro =
        recognition.total === 1
            ? t('protections_report_recognitionIntroSingular')
            : t('protections_report_recognitionIntroPlural', { count: formatter.format(recognition.total) });

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
                            {surface.count === 1
                                ? t('protections_report_knownBySingular')
                                : t('protections_report_knownByPlural', { count: formatter.format(surface.count) })}
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
function TopSitesView({ sites }) {
    const { t } = useReportTranslation();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const list = useMemo(() => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }), [locale]);
    const [top, ...rest] = sites;
    if (!top) return null;

    const orbit = top.companies.slice(0, TOP_SITE_ORBIT_LIMIT);
    const count = top.companies.length;
    /** @param {number} n */
    const companies = (n) =>
        n === 1
            ? t('protections_report_siteCompaniesSingular')
            : t('protections_report_siteCompaniesPlural', { count: formatter.format(n) });

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
                        {count === 1
                            ? t('protections_report_topSiteCountSingular')
                            : t('protections_report_topSiteCountPlural', { count: formatter.format(count) })}
                    </span>
                    <span class={styles.topSiteWatching}>
                        {count === 1
                            ? t('protections_report_topSiteWatchingSingular', { companies: top.companies[0] })
                            : t('protections_report_topSiteWatchingPlural', { companies: list.format(top.companies.slice(0, 2)) })}
                    </span>
                </div>
            </div>
            {rest.length > 0 && (
                <ul class={styles.siteList}>
                    {rest.map(({ site, companies: names }) => (
                        <li key={site.etldPlusOne} class={styles.siteRow}>
                            <span class={styles.siteIcon}>
                                <SiteFavicon site={site} />
                            </span>
                            <span class={styles.siteDomain}>{site.etldPlusOne}</span>
                            <span class={cn(styles.avatars, styles.avatarsAuto, styles.avatarsSmall)} aria-hidden="true">
                                {names.slice(0, SITE_AVATAR_LIMIT).map((name) => (
                                    <span key={name} class={styles.avatar}>
                                        <CompanyIcon displayName={name} />
                                    </span>
                                ))}
                            </span>
                            <span class={styles.siteCount}>{companies(names.length)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
