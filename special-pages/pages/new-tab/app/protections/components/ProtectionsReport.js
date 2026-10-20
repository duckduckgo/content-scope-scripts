import { Fragment, h } from 'preact';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './ProtectionsReport.module.css';
import protectionsStyles from './Protections.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import { Button } from '../../../../../shared/components/Button/Button.js';
import { InfoIcon, ChevronSmall } from '../../components/Icons.js';
import { CAPTURE_EXCLUDE } from '../utils/share-image.js';
import { Dropdown } from '../../omnibar/components/chat-tools/dropdown/Dropdown.js';
import { DropdownItem } from '../../omnibar/components/chat-tools/dropdown/DropdownItem.js';
import { useDropdown } from '../../omnibar/components/chat-tools/useDropdown.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { useAnimatedCount } from '../utils/useAnimatedCount.js';
import { PryingEye } from './PryingEye.js';
import { groupBySurface, hasPurposeData, rankTopSites, totalCompanies, typicalTopSite, googleReach } from '../utils/report.js';
import { VoiceContext, useReportFormat, useReportTranslation } from './report-text.js';
import { CompaniesView, PurposesView, RecognitionView, TopSitesView } from './ReportViews.js';
import { CompareView } from './CompareView.js';
import { ShareButton, useShareCopy } from './ShareButton.js';

/**
 * @import {Strings} from './report-text.js'
 * @import {ShareCopy} from './ShareButton.js'
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').ProtectionsConfig} ProtectionsConfig
 * @typedef {import('../../../types/new-tab.js').PrivacyStatsData} PrivacyStatsData
 * @typedef {{make: () => void, dismiss: () => void}} DefaultPrompt - DuckDuckGo isn't the default browser: offer to make it so, or let the user dismiss that
 * @typedef {'purposes' | 'recognition' | 'companies' | 'activity' | 'top-sites' | 'compare'} ReportView
 */

/** @type {Record<ReportView, keyof Strings>} */
const VIEW_LABELS = {
    purposes: 'protections_report_viewPurposes',
    recognition: 'protections_report_viewRecognition',
    companies: 'protections_report_viewCompanies',
    activity: 'protections_report_viewSites',
    'top-sites': 'protections_report_viewTopSites',
    compare: 'protections_report_viewCompare',
};

/**
 * The view menu, in order: why, who, where, when, how.
 *
 * @type {ReportView[]}
 */
const VIEW_ORDER = ['purposes', 'companies', 'top-sites', 'activity', 'recognition', 'compare'];

/**
 * Maps the persisted feed onto a view this report can show: the saved view if
 * there's data for it, otherwise the first one that has data. `privacy-stats`
 * is the retired Summary tab, so it always lands on the first view.
 *
 * @param {ProtectionsConfig['feed']} feed
 * @param {ReportView[]} available - in menu order; never empty (some views are always available)
 * @return {ReportView}
 */
function resolveView(feed, available) {
    return available.find((v) => v === feed) ?? available[0];
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {() => void} props.toggle
 * @param {ProtectionsConfig['feed']} props.feed
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 * @param {number} props.blockedCount - tracking attempts blocked this week
 * @param {number | null | undefined} props.cookiePopUpsBlocked
 * @param {boolean} [props.isDefaultBrowser] - when false, the report offers to make DuckDuckGo the default
 * @param {() => void} [props.makeDefaultBrowser]
 * @param {() => void} [props.dismissDefaultBrowserPrompt]
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
    isDefaultBrowser,
    makeDefaultBrowser,
    dismissDefaultBrowserPrompt,
    stats,
    sites,
    rootRef: externalRef,
    shareCopy = false,
}) {
    const { isReducedMotion } = useEnv();
    // dismissed for this page; native remembers it from here (see protections_dismissDefaultBrowserPrompt)
    const [promptDismissed, setPromptDismissed] = useState(false);
    /** @type {DefaultPrompt | null} */
    const defaultPrompt =
        isDefaultBrowser === false && makeDefaultBrowser && !promptDismissed
            ? {
                  make: makeDefaultBrowser,
                  dismiss: () => {
                      setPromptDismissed(true);
                      dismissDefaultBrowserPrompt?.();
                  },
              }
            : null;
    const ownRef = useRef(/** @type {HTMLElement|null} */ (null));
    const rootRef = externalRef ?? ownRef;
    const bodyId = useId();
    const expanded = expansion === 'expanded';
    const companyCount = totalCompanies(stats);
    // the blocked count and the weekly stats arrive separately, so they can briefly disagree
    const isEmpty = blockedCount === 0 || companyCount === 0;
    const recognition = useMemo(() => groupBySurface(stats.trackerCompanies), [stats.trackerCompanies]);
    const topSites = useMemo(() => rankTopSites(stats), [stats]);
    const typical = useMemo(() => typicalTopSite(stats), [stats]);
    /** @type {Record<ReportView, boolean>} */
    const hasData = {
        purposes: hasPurposeData(stats.trackerCompanies),
        recognition: recognition.total > 0,
        companies: true,
        activity: true,
        'top-sites': topSites.length > 0,
        compare: typical !== null,
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
                <TitleRow expanded={expanded} toggle={toggle} bodyId={bodyId} defaultPrompt={defaultPrompt} />
                {isEmpty ? (
                    <EmptyHeadline />
                ) : (
                    <Headline
                        expanded={expanded}
                        companyCount={companyCount}
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
                            <EmptyBody />
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
                                        {view === 'compare' && typical && <CompareView site={typical} google={googleReach(stats)} />}
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
 * @param {DefaultPrompt | null} props.defaultPrompt - set when DuckDuckGo isn't the default browser
 */
function TitleRow({ expanded, toggle, bodyId, defaultPrompt }) {
    const { t } = useReportTranslation();
    return (
        <div class={styles.titleRow}>
            <img class={styles.titleIcon} src="./icons/Shield-Color-16.svg" alt="" />
            <h2 class={styles.title}>{t('protections_menuTitle')}</h2>
            <InfoButton defaultPrompt={defaultPrompt} />
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
 * When DuckDuckGo isn't the default browser it's flagged as an issue: the
 * button becomes an orange "1 issue" pill, and the pop-over offers to fix it.
 *
 * @param {object} props
 * @param {DefaultPrompt | null} props.defaultPrompt - set when DuckDuckGo isn't the default browser
 */
function InfoButton({ defaultPrompt }) {
    const { t } = useReportTranslation();
    const title = defaultPrompt ? t('protections_report_notDefaultTitle') : t('protections_report_infoTitle');
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
                class={defaultPrompt ? styles.issuePill : styles.infoButton}
                aria-label={defaultPrompt ? t('protections_report_issueLabel') : t('protections_report_infoLabel')}
                aria-expanded={open}
                aria-controls={popoverId}
                onClick={() => {
                    clearTimeout(closeTimer.current);
                    setOpen((x) => openedByHover.current || !x);
                    openedByHover.current = false;
                }}
            >
                {defaultPrompt ? t('protections_report_issueCount') : <InfoIcon />}
            </button>
            {open && (
                <div class={styles.infoPopover} id={popoverId} role="dialog" aria-label={title}>
                    <h3 class={styles.infoTitle}>{title}</h3>
                    <p>{t('protections_report_infoBody1')}</p>
                    <p class={styles.infoEmphasis}>{t('protections_report_infoBody2')}</p>
                    {defaultPrompt && (
                        <div class={styles.infoAction}>
                            <Button
                                variant="accentBrand"
                                onClick={() => {
                                    setOpen(false);
                                    defaultPrompt.make();
                                }}
                            >
                                {t('protections_report_makeDefault')}
                            </Button>
                            <Button
                                variant="standard"
                                onClick={() => {
                                    setOpen(false);
                                    defaultPrompt.dismiss();
                                }}
                            >
                                {t('protections_report_dismiss')}
                            </Button>
                        </div>
                    )}
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
    const format = useReportFormat();
    const countRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const animatedBlocked = useAnimatedCount(blockedCount, countRef);
    const shownBlocked = countUp ? animatedBlocked : blockedCount;

    const headline = format.plural(companyCount, 'protections_report_headlineSingular', 'protections_report_headlinePlural');
    // the wording follows the final count, so it doesn't change as the number counts up
    const blocked =
        blockedCount === 1
            ? t('protections_report_blockedSingular')
            : t('protections_report_blockedPlural', { count: format.number(shownBlocked) });

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
 * Placeholder rows, under the first view's name greyed out, that preview
 * what fills in once trackers are blocked.
 */
function EmptyBody() {
    const { t } = useReportTranslation();
    return (
        <div data-testid="ProtectionsReportEmpty">
            <div class={cn(styles.viewTrigger, styles.viewTriggerDisabled)} aria-hidden="true">
                <span class={styles.viewLabel}>
                    <ViewLabel view={VIEW_ORDER[0]} />
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
 * The cookie pop-up count (when there is one) and the share button.
 *
 * @param {object} props
 * @param {number | null | undefined} props.cookiePopUpsBlocked - undefined = unsupported, null = feature disabled
 * @param {boolean} props.canShare - whether to show the share button
 * @param {ShareCopy | null} props.share - what the share button captures; `null` for a button that does nothing
 */
function ReportFooter({ cookiePopUpsBlocked: count, canShare, share }) {
    const format = useReportFormat();
    const cookies = typeof count === 'number' && Number.isFinite(count) ? Math.floor(count) : 0;
    const text =
        cookies >= 1 ? format.plural(cookies, 'protections_report_cookiePopUpsSingular', 'protections_report_cookiePopUpsPlural') : null;
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
