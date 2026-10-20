import { Fragment, h } from 'preact';
import cn from 'classnames';
import { useContext, useEffect, useRef } from 'preact/hooks';
import styles from './CompareView.module.css';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { useReportFormat, useReportTranslation, VoiceContext } from './report-text.js';
import { RING_EYE_LOOK, RingEye } from './ReportViews.js';

/** How many little eyes join the companies circling the cursor */
const SWARM_EYES = 3;

/**
 * What circles the cursor: the companies, in order, with the eyes in among
 * them. The eyes take odd places (which all circle at the same speed, see
 * `orbitPoint`), spread around the circle, so they keep their distance
 * instead of drifting together. With only a company or two some can't help being
 * neighbours. There's always at least one company: the site's.
 *
 * Each company circles closer the more widespread it was this week; the eyes
 * circle in among them.
 *
 * @param {string[]} companies - most widespread first
 * @return {SwarmItem[]}
 */
function swarmItems(companies) {
    const count = companies.length + SWARM_EYES;
    // spread evenly over the odd places; with too few of those, any free place will do
    const odd = Array.from({ length: Math.floor(count / 2) }, (_, i) => 2 * i + 1);
    const eyes = [...new Set(Array.from({ length: SWARM_EYES }, (_, j) => odd[Math.round((j * odd.length) / SWARM_EYES)]))].filter(
        (place) => place !== undefined,
    );
    for (let place = count - 1; eyes.length < SWARM_EYES && place >= 0; place--) {
        if (!eyes.includes(place)) eyes.push(place);
    }
    let next = 0;
    return Array.from({ length: count }, (_, place) => {
        const id = eyes.indexOf(place);
        if (id !== -1) return { kind: 'eye', id, radius: EYE_RADII[id % EYE_RADII.length] ?? ORBIT_RADIUS.max };
        const rank = next++;
        const spread = companies.length > 1 ? rank / (companies.length - 1) : 0;
        return { kind: 'company', name: companies[rank] ?? '', radius: ORBIT_RADIUS.min + (ORBIT_RADIUS.max - ORBIT_RADIUS.min) * spread };
    });
}

/** The cursor glides to a random spot, rests, and repeats. Ranges in ms. */
const MOVE_MS = { min: 810, max: 1440 };
const REST_MS = { min: 750, max: 1875 };

/** How far (as a fraction of the page) the cursor's stops keep from the edges */
const MARGIN = 0.2;

/** How far the companies circle from the cursor, in px: the most widespread closest */
const ORBIT_RADIUS = { min: 22, max: 54 };

/** How far each eye circles from the cursor, in px: in among the companies */
const EYE_RADII = [32, 42, 50];

/** Radians per second */
const ORBIT_SPEED = 1.125;

/** 0–1: how quickly the companies catch up when the cursor moves (lower is floatier) */
const FOLLOW_EASE = 0.1;

/** Where the cursor stands in a still picture (reduced motion, the shared picture), as fractions of the page */
const STILL_AT = { x: 0.55, y: 0.45, seconds: 2.4 };

/**
 * @param {{min: number, max: number}} range
 */
const randomIn = ({ min, max }) => min + Math.random() * (max - min);

/** @param {number} t - 0 to 1 */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** @param {number} t - 0 to 1 */
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Now and then the cursor clicks, a moment into a rest: it presses down
 * (shrinks) and lets go. The press pulls the companies in close; letting go
 * flings them out, and they drift back to their circles. Times in ms;
 * `pull` and `fling` scale how far they circle from the cursor.
 */
const CLICK = { chance: 0.5, intoRest: 250, press: 150, release: 120, settle: 750, cursorScale: 0.82, pull: 0.4, fling: 1.8 };

/**
 * How big the cursor is, and how far out the companies circle (both as
 * fractions of normal), `t` ms into a click.
 *
 * @param {number} t
 * @return {{cursor: number, swarm: number}}
 */
function clickShape(t) {
    if (t < 0) return { cursor: 1, swarm: 1 };
    if (t < CLICK.press) {
        const k = easeInOut(t / CLICK.press);
        return { cursor: 1 + (CLICK.cursorScale - 1) * k, swarm: 1 + (CLICK.pull - 1) * k };
    }
    t -= CLICK.press;
    if (t < CLICK.release) {
        const k = easeOut(t / CLICK.release);
        return { cursor: CLICK.cursorScale + (1 - CLICK.cursorScale) * k, swarm: CLICK.pull + (CLICK.fling - CLICK.pull) * k };
    }
    t -= CLICK.release;
    if (t < CLICK.settle) {
        return { cursor: 1, swarm: CLICK.fling + (1 - CLICK.fling) * easeInOut(t / CLICK.settle) };
    }
    return { cursor: 1, swarm: 1 };
}

/**
 * A point off to one side of the line from `a` to `b`, so the glide between
 * them curves gently.
 *
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @return {[number, number]}
 */
function bendBetween(a, b) {
    const bend = randomIn({ min: 0.18, max: 0.35 }) * (Math.random() < 0.5 ? -1 : 1);
    return [(a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend];
}

/**
 * @typedef {({kind: 'company', name: string} | {kind: 'eye', id: number}) & {radius: number}} SwarmItem - `radius`: how far it circles from the cursor, in px
 */

/**
 * Where item `i` of `n` sits on its circle around the cursor at `seconds`.
 *
 * @param {number} i
 * @param {number} n
 * @param {number} radius - in px
 * @param {number} seconds
 * @param {number} x - the cursor
 * @param {number} y
 * @return {[number, number]}
 */
function orbitPoint(i, n, radius, seconds, x, y) {
    const angle = seconds * ORBIT_SPEED * (1 + (i % 2) * 0.18) + (i / n) * Math.PI * 2;
    return [x + 6 + Math.cos(angle) * radius, y + 8 + Math.sin(angle) * radius * 0.82];
}

/**
 * Moves both cursors around the page, gliding to a random spot and resting,
 * with the companies circling the Chrome one and swinging out as it moves.
 * Moved straight on the elements, so nothing re-renders each frame, and only
 * while the pages are on screen (the ads' own animations pause with it).
 *
 * @param {object} params
 * @param {import('preact').RefObject<HTMLElement>} params.pageRef - the Chrome page, for its size
 * @param {import('preact').RefObject<HTMLElement[]>} params.cursorsRef
 * @param {import('preact').RefObject<HTMLElement[]>} params.trailRef
 * @param {import('preact').RefObject<(SVGGElement | undefined)[]>} params.irisesRef - the eyes' irises, by place in the circle
 * @param {boolean} params.still - draw one moment and stop
 */
function useCursorTrail({ pageRef, cursorsRef, trailRef, irisesRef, still }) {
    useEffect(() => {
        const page = pageRef.current;
        if (!page) return;

        /**
         * @param {number} x
         * @param {number} y
         * @param {number} [scale] - smaller while clicking
         */
        const placeCursors = (x, y, scale = 1) => {
            const transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` + (scale === 1 ? '' : ` scale(${scale.toFixed(3)})`);
            for (const cursor of cursorsRef.current ?? []) {
                cursor.style.transform = transform;
            }
        };
        /**
         * @param {HTMLElement} el
         * @param {number} x
         * @param {number} y
         */
        const place = (el, x, y) => {
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        };
        /**
         * Points an eye's iris from where it is (x, y) toward the cursor (cx, cy).
         *
         * @param {number} i
         * @param {number} x
         * @param {number} y
         * @param {number} cx
         * @param {number} cy
         */
        const look = (i, x, y, cx, cy) => {
            const iris = irisesRef.current?.[i];
            if (!iris) return;
            const angle = Math.atan2(cy - y, cx - x);
            iris.setAttribute(
                'transform',
                `translate(${(Math.cos(angle) * RING_EYE_LOOK).toFixed(2)} ${(Math.sin(angle) * RING_EYE_LOOK).toFixed(2)})`,
            );
        };

        if (still) {
            const x = page.offsetWidth * STILL_AT.x;
            const y = page.offsetHeight * STILL_AT.y;
            placeCursors(x, y);
            const trail = trailRef.current ?? [];
            trail.forEach((el, i) => {
                const [tx, ty] = orbitPoint(i, trail.length, Number(el.dataset.radius), STILL_AT.seconds, x, y);
                place(el, tx, ty);
                look(i, tx, ty, x, y);
            });
            return;
        }

        /**
         * The current move: from one stop to the next, along a gentle curve, then
         * a rest there, perhaps with a click (`clickAt`, in ms, or null).
         *
         * @type {{from: [number, number], to: [number, number], bend: [number, number], start: number, move: number, rest: number, clickAt: number | null} | null}
         */
        let glide = null;
        /** When the latest click started (ms) */
        let clickStart = -Infinity;
        /** @type {{x: number, y: number}[]} */
        const followers = [];
        let last = 0;
        let frame = 0;

        // the page's size, kept up to date here rather than read each frame:
        // reading it after the last frame's moves would make the browser
        // work out the styles twice per frame
        let w = page.offsetWidth;
        let h = page.offsetHeight;
        const resizes = new ResizeObserver(() => {
            w = page.offsetWidth;
            h = page.offsetHeight;
        });
        resizes.observe(page);

        /**
         * @param {[number, number]} from
         * @param {number} now
         */
        const glideFrom = (from, now) => {
            const to = randomStop();
            const move = randomIn(MOVE_MS);
            const clickAt = Math.random() < CLICK.chance ? now + move + CLICK.intoRest : null;
            return { from, to, bend: bendBetween(from, to), start: now, move, rest: randomIn(REST_MS), clickAt };
        };

        /** @return {[number, number]} */
        const randomStop = () => [w * randomIn({ min: MARGIN, max: 1 - MARGIN }), h * randomIn({ min: MARGIN, max: 1 - MARGIN })];

        const tick = (/** @type {number} */ now) => {
            frame = requestAnimationFrame(tick);
            if (!w) return;
            glide ??= glideFrom([w * 0.3, h * 0.4], now);
            // pick up where it left off after being off screen or in a background tab
            if (last && now - last > 200) {
                const away = now - last;
                glide.start += away;
                if (glide.clickAt !== null) glide.clickAt += away;
                clickStart += away;
            }
            last = now;
            if (glide.clickAt !== null && now >= glide.clickAt) {
                clickStart = glide.clickAt;
                glide.clickAt = null;
            }
            const click = clickShape(now - clickStart);

            const e = easeInOut(Math.min(1, (now - glide.start) / glide.move));
            const u = 1 - e;
            const x = u * u * glide.from[0] + 2 * u * e * glide.bend[0] + e * e * glide.to[0];
            const y = u * u * glide.from[1] + 2 * u * e * glide.bend[1] + e * e * glide.to[1];
            if (now - glide.start > glide.move + glide.rest) glide = glideFrom(glide.to, now);
            placeCursors(x, y, click.cursor);

            // the companies ease after their place on the circle, so they swing out when the cursor moves
            const trail = trailRef.current ?? [];
            trail.forEach((el, i) => {
                const [tx, ty] = orbitPoint(i, trail.length, Number(el.dataset.radius) * click.swarm, now / 1000, x, y);
                const follower = (followers[i] ??= { x: tx, y: ty });
                const ease = FOLLOW_EASE - i * 0.008;
                follower.x += (tx - follower.x) * ease;
                follower.y += (ty - follower.y) * ease;
                place(el, follower.x, follower.y);
                look(i, follower.x, follower.y, x, y);
            });
        };

        const observer = new IntersectionObserver(([entry]) => {
            cancelAnimationFrame(frame);
            const visible = entry?.isIntersecting ?? false;
            if (visible) frame = requestAnimationFrame(tick);
            page.dataset.playing = String(visible);
        });
        observer.observe(page);
        return () => {
            observer.disconnect();
            resizes.disconnect();
            cancelAnimationFrame(frame);
            delete page.dataset.playing;
        };
    }, [pageRef, cursorsRef, trailRef, irisesRef, still]);
}

/**
 * A mouse pointer, moved by `useCursorTrail`.
 *
 * @param {object} props
 * @param {(el: HTMLElement | null) => void} props.cursorRef
 */
function Cursor({ cursorRef }) {
    return (
        <div class={styles.cursor} ref={cursorRef}>
            <svg width="16" height="22" viewBox="0 0 16 22">
                <path
                    d="M1.5 1.5 L1.5 17 L5.4 13.4 L8.1 19.8 L10.8 18.7 L8.2 12.4 L13.8 12.4 Z"
                    fill="#111"
                    stroke="#fff"
                    stroke-width="1.4"
                    stroke-linejoin="round"
                />
            </svg>
        </div>
    );
}

/** A red SUV, in flat shapes, for the banner ad */
function Suv() {
    return (
        <svg class={styles.adBannerArt} viewBox="0 0 44 24" width="44" height="24">
            <ellipse cx="22.5" cy="22.7" rx="19" ry="1" fill="rgba(0, 0, 0, 0.25)" />
            {/* roof rails */}
            <rect x="6" y="1.6" width="22" height="1.1" rx="0.5" fill="#2b2b2b" />
            <rect x="9" y="2.4" width="1" height="1.4" fill="#2b2b2b" />
            <rect x="25" y="2.4" width="1" height="1.4" fill="#2b2b2b" />
            {/* the body: a tall, boxy cabin with a squared-off back */}
            <path
                d="M3.5 17.9V6q0-2.3 2.3-2.3h22.6q1.1 0 1.8.8l4.6 5.6 4.9 1.1q1.8.4 1.8 2.2v4.5q0 .9-.9.9H4.4q-.9 0-.9-.9z"
                fill="#d7262b"
            />
            <path d="M5.8 5.3h7.6v4.9H5.8z" fill="#bfe3ff" />
            <path d="M14.6 5.3h8v4.9h-8z" fill="#bfe3ff" />
            <path d="M23.8 5.3h4.3l4.1 4.9h-8.4z" fill="#bfe3ff" />
            <path d="M23.2 10.8v6.4M14 10.8v6.4" stroke="#a81b20" stroke-width="0.6" />
            <rect x="3.5" y="13.4" width="37.8" height="1" fill="#a81b20" />
            <rect x="39.6" y="11.6" width="1.6" height="1.5" rx="0.5" fill="#fff4b0" />
            <rect x="3.5" y="6.8" width="1" height="2.8" rx="0.4" fill="#ffb3b3" />
            {/* big wheels */}
            <circle cx="11" cy="18.4" r="4" fill="#1c1c1c" />
            <circle cx="11" cy="18.4" r="1.7" fill="#c7cdd4" />
            <circle cx="34" cy="18.4" r="4" fill="#1c1c1c" />
            <circle cx="34" cy="18.4" r="1.7" fill="#c7cdd4" />
        </svg>
    );
}

/** A spray bottle, in flat shapes */
function Bottle() {
    return (
        <span class={styles.bottle}>
            <span class={styles.bottleHead} />
            <span class={styles.bottleNeck} />
            <span class={styles.bottleBody}>
                <span class={styles.bottleLabel} />
            </span>
        </span>
    );
}

/**
 * The video ad: a few seconds of a cleaning-product commercial in flat
 * shapes, looping in step with its progress bar. The bottle sprays, a sponge
 * wipes a smudge away, and the product shines.
 */
function AdScenes() {
    return (
        <span class={styles.adScenes}>
            <span class={cn(styles.adScene, styles.sceneSpray)}>
                <Bottle />
                <span class={styles.mist}>
                    <span />
                    <span />
                    <span />
                </span>
            </span>
            <span class={cn(styles.adScene, styles.sceneWipe)}>
                <span class={styles.smudge} />
                <span class={styles.sponge} />
                <span class={cn(styles.sparkle, styles.sparkleWipe)} />
            </span>
            <span class={cn(styles.adScene, styles.sceneShine)}>
                <span class={styles.burst} />
                <Bottle />
                <span class={cn(styles.sparkle, styles.sparkleA)} />
                <span class={cn(styles.sparkle, styles.sparkleB)} />
            </span>
        </span>
    );
}

/*
 * The same article in both windows: a two-line title and a few lines of text.
 * On DuckDuckGo's page a picture and more text follow; on Chrome's, the text
 * wraps beside a video ad and carries on under it.
 */

function ArticleTitle() {
    return (
        <Fragment>
            <span class={styles.line} style={{ width: '88%', background: 'var(--compare-heading)' }} />
            <span class={styles.line} style={{ width: '62%', background: 'var(--compare-heading)', marginBottom: '3px' }} />
        </Fragment>
    );
}

function ArticleOpening() {
    return (
        <Fragment>
            {['100%', '95%', '70%'].map((width, i) => (
                <span key={i} class={styles.text} style={{ width }} />
            ))}
        </Fragment>
    );
}

/** The article's picture: a friendly landscape, with a tree on a grassy hill under a blue sky */
function Landscape() {
    return (
        <span class={cn(styles.picture, styles.landscape)}>
            <svg viewBox="0 0 200 56" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                <circle class={styles.landscapeSun} cx="158" cy="15" r="7" />
                <path class={styles.landscapeFar} d="M0 56V36l28-20 22 16 34-24 34 26 20-14 26 18 36-22v40z" />
                <path class={styles.landscapeNear} d="M0 56V44q50-16 100-2t100-4v18z" />
                <rect class={styles.landscapeTrunk} x="47" y="35" width="3" height="9" rx="1" />
                <circle class={styles.landscapeTree} cx="48.5" cy="31" r="6.5" />
            </svg>
        </span>
    );
}

/**
 * A site's domain, in bold, for markup like the intro. Domains come from the
 * browser, so they're escaped rather than trusted as markup.
 *
 * @param {string} domain
 */
function boldDomain(domain) {
    const text = domain.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    return `<b>${text}</b>`;
}

/**
 * A small browser window around a page.
 *
 * @param {object} props
 * @param {string} props.name - the browser's, in the address bar
 * @param {import('preact').ComponentChildren} props.children
 */
function BrowserWindow({ name, children }) {
    return (
        <div class={styles.window}>
            <div class={styles.toolbar}>
                <span class={styles.light} />
                <span class={styles.light} />
                <span class={styles.light} />
                <span class={styles.address}>{name}</span>
            </div>
            {children}
        </div>
    );
}

/**
 * "How Chrome compares": a site like the ones where you were tracked most
 * this week, in two browsers side by side. On DuckDuckGo the page is just the page; on Chrome it's busy with
 * moving ads, and the companies that would have been on it circle the cursor
 * wherever it goes.
 *
 * @param {object} props
 * @param {NonNullable<ReturnType<typeof import('../utils/report.js').typicalTopSite>>} props.site
 * @param {ReturnType<typeof import('../utils/report.js').googleReach>} props.google - how widely Google, who make Chrome, tried to track
 */
export function CompareView({ site, google }) {
    const { t } = useReportTranslation();
    const format = useReportFormat();
    const { isReducedMotion } = useEnv();
    const voice = useContext(VoiceContext);
    // the shared picture is one still moment
    const still = isReducedMotion || voice === 'me';
    const pageRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const cursorsRef = useRef(/** @type {HTMLElement[]} */ ([]));
    const trailRef = useRef(/** @type {HTMLElement[]} */ ([]));
    const irisesRef = useRef(/** @type {(SVGGElement | undefined)[]} */ ([]));
    useCursorTrail({ pageRef, cursorsRef, trailRef, irisesRef, still });

    const count = site.count;
    const trail = swarmItems(site.companies);

    return (
        <div data-testid="ProtectionsReportCompare" data-still={still}>
            <p class={styles.intro}>
                <Trans str={t('protections_report_compareIntro', { sites: format.list(site.examples.map(boldDomain)) })} values={{}} />
            </p>
            <div class={styles.columns} aria-hidden="true">
                <div class={styles.column}>
                    <BrowserWindow name="DuckDuckGo">
                        <div class={styles.page}>
                            <Cursor
                                cursorRef={(el) => {
                                    if (el) cursorsRef.current[0] = el;
                                }}
                            />
                            <div class={styles.cleanPage}>
                                <ArticleTitle />
                                <ArticleOpening />
                                <Landscape />
                                {['100%', '95%', '100%', '88%', '97%', '92%', '64%'].map((width, i) => (
                                    <span key={i} class={styles.text} style={{ width }} />
                                ))}
                            </div>
                        </div>
                    </BrowserWindow>
                </div>
                <div class={styles.column}>
                    <BrowserWindow name="Google Chrome">
                        <div class={styles.page} ref={pageRef}>
                            <Cursor
                                cursorRef={(el) => {
                                    if (el) cursorsRef.current[1] = el;
                                }}
                            />
                            <div class={styles.adPage}>
                                <div class={styles.adBanner}>
                                    <span>{t('protections_report_compareAdBanner')}</span>
                                    <Suv />
                                </div>
                                <div class={styles.adCopy}>
                                    <ArticleTitle />
                                </div>
                                <div class={styles.adRow}>
                                    <div class={styles.adRowCopy}>
                                        <ArticleOpening />
                                        <span class={styles.text} style={{ width: '84%' }} />
                                    </div>
                                    <div class={styles.adVideo}>
                                        <AdScenes />
                                        <span class={styles.adBadge}>{t('protections_report_compareAd')}</span>
                                        <span class={styles.adBars}>
                                            <span />
                                            <span />
                                            <span />
                                        </span>
                                        <span class={styles.adProgress}>
                                            <span />
                                        </span>
                                    </div>
                                </div>
                                <div class={styles.adMoreCopy}>
                                    {['100%', '94%', '98%', '90%', '96%', '58%'].map((width, i) => (
                                        <span key={i} class={styles.text} style={{ width }} />
                                    ))}
                                </div>
                                <div class={styles.cookieBar}>
                                    <span class={styles.cookieText}>
                                        <Trans str={t('protections_report_compareCookies')} values={{}} />
                                    </span>
                                    <span class={styles.cookieButtonOutline}>{t('protections_report_compareCookieDecline')}</span>
                                    <span class={styles.cookieButton}>{t('protections_report_compareCookieAccept')}</span>
                                </div>
                                <div class={styles.trail}>
                                    {trail.map((item, i) => (
                                        <span
                                            key={item.kind === 'company' ? item.name : `eye-${item.id}`}
                                            class={styles.tracker}
                                            data-radius={item.radius}
                                            ref={(el) => {
                                                if (el) trailRef.current[i] = el;
                                            }}
                                        >
                                            {item.kind === 'company' ? (
                                                <CompanyIcon displayName={item.name} />
                                            ) : (
                                                <RingEye
                                                    irisRef={(el) => {
                                                        irisesRef.current[i] = el ?? undefined;
                                                    }}
                                                />
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </BrowserWindow>
                </div>
            </div>
            <div class={styles.columns}>
                <div class={styles.caption}>
                    <span class={styles.browser}>
                        <img src="./protections/compare-duckduckgo.svg" alt="" width="16" height="16" />
                        DuckDuckGo
                    </span>
                    <span class={styles.verdict}>
                        {format.plural(count, 'protections_report_compareBlockedSingular', 'protections_report_compareBlockedPlural')}
                    </span>
                </div>
                <div class={styles.caption}>
                    <span class={styles.browser}>
                        <img src="./protections/compare-chrome.svg" alt="" width="16" height="16" />
                        Chrome
                    </span>
                    <span class={styles.verdict}>
                        {format.plural(count, 'protections_report_compareLoadSingular', 'protections_report_compareLoadPlural')}
                    </span>
                </div>
            </div>
            {google && (
                <p class={styles.google}>
                    {google.sites === 1
                        ? t('protections_report_compareGoogleSingular', { total: format.number(google.visited) })
                        : t('protections_report_compareGooglePlural', {
                              count: format.number(google.sites),
                              total: format.number(google.visited),
                          })}
                </p>
            )}
            <p class={styles.footnote}>{t('protections_report_compareFootnote')}</p>
        </div>
    );
}
