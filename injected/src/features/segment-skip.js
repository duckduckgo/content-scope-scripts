import ContentFeature from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';
import {
    isNoCookieOrigin,
    matchesDuration,
    segmentAt,
    segmentPosition,
    shouldActivate,
    validSelectors,
    videoIDFromURL,
} from './segment-skip/helpers.js';
import daxSvg from './segment-skip/assets/DuckDuckGo-Color-16.svg';
import skipSvg from './segment-skip/assets/Skip-Recolorable-16.svg';
import undoSvg from './segment-skip/assets/Undo-16.svg';
// Bundled by scripts/buildLocales.js from src/locales/segment-skip/
import localesJSON from '../../../build/locales/segment-skip-locales.js';

/** @type {Record<string, Record<string, Record<string, string>>>} locale → file → key → string */
const STRINGS = JSON.parse(localesJSON);
// buildLocales.js keys each locale by filename; named for the feature because Smartling needs unique file names per repo.
const STRINGS_FILE = 'segment-skip.json';

/** @typedef {import('../types/segment-skip.js').Segment} Segment */
/** @typedef {import('../types/segment-skip.js').OnConfigChangedParams} Config */
/**
 * @typedef {object} SkipButton
 * @property {HTMLElement} host shadow host, placed in the player
 * @property {HTMLElement} label
 * @property {HTMLElement[]} collapsible the logo and label, folded away when the button is tapped
 */

// Selector defaults, used until the privacy-config `segmentSkip` settings ship the same keys. Ordered lists: the first
// selector with a visible match wins, so put the preferred element first.
// Where the segment overlay is drawn: desktop player bar, then the m.youtube.com bar hosts (the chaptered host wraps
// the line host, so it comes first).
const DEFAULT_PROGRESS_BAR_SELECTORS = [
    '.ytp-progress-bar',
    '.ytChapteredProgressBarHost',
    '.YtChapteredProgressBarHost',
    '.ytProgressBarLineHost',
    '.YtProgressBarLineHost',
    '.YtmProgressBarProgressBarLine',
];
// Where the skip button is mounted. m.youtube.com draws its controls layer over the player, in a sibling inside
// #player-container-id, so mount there to stay above that layer and receive taps. The embed player (Duck Player)
// draws the same layer in a fixed #player-controls outside the player, so mount in the layer itself. Desktop
// youtube.com uses the player itself.
const DEFAULT_SKIP_BUTTON_HOST_SELECTORS = ['#player-container-id', '#player-controls', '#movie_player', '.html5-video-player'];
// Present while YouTube plays an ad in the player; the video element then plays the ad, not the video.
const DEFAULT_AD_SHOWING_SELECTORS = ['.ad-showing'];
// Present while YouTube's mobile controls layer is on screen; the skip button hides then, so it never covers it.
// m.youtube.com and the mobile embed (Duck Player) draw their controls in #player-control-overlay, which gets fadein
// while it shows. Desktop youtube.com and its embed (macOS, iPad) have no such layer, so there the button stays up
// whether the controls show or not. No match means "controls hidden", so a broken selector leaves the button showing.
const DEFAULT_CONTROLS_VISIBLE_SELECTORS = ['#player-control-overlay.fadein'];

// How long the skip button stays up after it appears for a segment, unless playback leaves the segment first. Counted
// only while the video plays and the button is on screen, so a paused or buffering video keeps the button, and time
// spent hidden while YouTube's controls show doesn't count against it.
const SKIP_BUTTON_TIMEOUT_MS = 8000;
// How long the "Undo Skip" button stays up after an automatic skip, in wall-clock time.
const UNDO_TIMEOUT_MS = 5000;
// Exit timings, matching the transitions in SKIP_BUTTON_STYLES.
const SLIDE_OUT_MS = 450;
const COLLAPSE_FADE_AT_MS = 620;
const COLLAPSE_DONE_MS = 840;
const OVERLAY_CLASS = 'ddg-segmentskip-overlay';
const SKIP_BUTTON_CLASS = 'ddg-segmentskip-skip';
// On <html> while playback is inside a segment or the skip or undo button is up. Set on the root, not the player,
// since YouTube rewrites the player's classes.
const BUSY_ATTR = 'data-ddg-segmentskip-busy';
const STYLES = `
/* Duck Player's in-player "Watch in Duck Player" icon sits where the skip button does; keep it out of the way. */
[${BUSY_ATTR}] .ddg-overlay[data-size^="video-player"] { display: none !important; }
.${OVERLAY_CLASS} { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.${OVERLAY_CLASS} > div { position: absolute; top: 0; bottom: 0; min-width: 2px; background: #FAB341; }
/* Mobile: the playhead dot is a sibling of the bar host with no z-index of its own; keep it above the overlay. */
.ytProgressBarPlayheadHost, .YtProgressBarPlayheadHost { z-index: 2; }
/* Desktop: above the played line, below the scrubber knob. The bar is thin until hovered; follow its grow animation. */
.ytp-progress-bar > .${OVERLAY_CLASS} { z-index: 42; transform: scaleY(0.6); transition: transform .1s cubic-bezier(0, 0, 0.2, 1); }
.ytp-progress-bar-container:hover .${OVERLAY_CLASS} { transform: none; }
/* Skip button host: bottom-right over the video, above the progress bar, like YouTube's own "Skip ad" button. The
   button itself lives in the host's closed shadow root, so only its placement is styled from here. */
.${SKIP_BUTTON_CLASS} { position: absolute; right: 12px; bottom: 72px; z-index: 1000; pointer-events: auto; }
#player-container-id > .${SKIP_BUTTON_CLASS} { right: 8px; bottom: 40px; }
/* Embed: the fullscreen button sits in the top-right of the controls layer's bottom row; clear it. The row's
   height changes with orientation, so updateSkip measures it and overrides the bottom offset when the row is found. */
#player-controls > .${SKIP_BUTTON_CLASS} { right: 24px; bottom: 140px; }
`;
const SKIP_BUTTON_STYLES = `
/* Hidden until .on: off the right edge. Removing .on plays the same transition back. The host moves, not the button,
   so the hit area moves with what the user sees. */
:host {
    transform: translateX(calc(100% + 24px)); opacity: 0;
    transition: transform .45s cubic-bezier(.2, 1.1, .3, 1), opacity .2s ease;
}
:host(.on) { transform: none; opacity: 1; }
/* Exit after a tap, phase 2 (.out): fade and shrink. Phase 1 (.collapse) is on the button below. */
:host(.collapse.out) { opacity: 0; transform: scale(.85); transition: opacity .2s ease, transform .2s ease; }
button {
    all: unset; box-sizing: border-box; position: relative; display: flex; align-items: center; gap: 8px; padding: 12px 20px;
    border-radius: 999px; background: #242323; color: #fff; font: 700 16px/16px Roboto, Arial, sans-serif;
    white-space: nowrap; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.08);
    transition: gap .32s cubic-bezier(.4, 0, .2, 1), padding .32s cubic-bezier(.4, 0, .2, 1), transform .1s;
}
button:active { transform: scale(.96); }
button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
:host(:not(.on)) button, :host(.collapse) button { pointer-events: none; }
img { display: block; width: 16px; height: 16px; }
/* After an automatic skip (.undo) the button offers to go back, with the undo icon in place of the skip icon. */
.undo-icon, :host(.undo) .skip-icon { display: none; }
:host(.undo) .undo-icon { display: block; }
.collapsible { overflow: hidden; transition: max-width .32s cubic-bezier(.4, 0, .2, 1), opacity .18s ease; }
/* Exit after a tap, phase 1: the logo and label fold away, so the button shrinks towards its right edge. */
:host(.collapse) button { gap: 0; padding-left: 12px; padding-right: 12px; }
:host(.collapse) .collapsible { opacity: 0; }
/* A light that runs once around the edge after the slide in: a turning conic gradient, masked to a 1px ring. A custom
   property can't animate the gradient's angle here, since @property is ignored in a shadow root. */
.sweep {
    position: absolute; inset: -1px; padding: 1px; border-radius: inherit; overflow: hidden; pointer-events: none; opacity: 0;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
}
.sweep::before {
    content: ''; position: absolute; left: 50%; top: 50%; width: 120%; aspect-ratio: 1; transform: translate(-50%, -50%);
    background: conic-gradient(transparent 0deg, transparent 250deg, rgba(255, 255, 255, .55) 310deg, transparent 350deg);
}
:host(.on) .sweep { animation: sweep-fade 1.8s cubic-bezier(.45, 0, .25, 1) .35s both; }
:host(.on) .sweep::before { animation: sweep-turn 1.8s cubic-bezier(.45, 0, .25, 1) .35s both; }
@keyframes sweep-fade { 0%, 100% { opacity: 0; } 20%, 80% { opacity: 1; } }
@keyframes sweep-turn { to { transform: translate(-50%, -50%) rotate(360deg); } }
/* The collapse snaps and the sweep is off; the slide and the fade still run. */
@media (prefers-reduced-motion: reduce) {
    button, .collapsible { transition: none; }
    .sweep { display: none; }
}
`;
// Loaded as images from data URIs: YouTube enforces Trusted Types, so the SVG markup can't be parsed into the DOM.
const DAX_ICON_URI = `data:image/svg+xml;utf8,${encodeURIComponent(daxSvg)}`;
const SKIP_ICON_URI = `data:image/svg+xml;utf8,${encodeURIComponent(skipSvg)}`;
const UNDO_ICON_URI = `data:image/svg+xml;utf8,${encodeURIComponent(undoSvg)}`;

/**
 * @param {Document} doc
 * @param {string} src
 * @returns {HTMLImageElement}
 */
function createIcon(doc, src) {
    const img = doc.createElement('img');
    img.src = src;
    img.alt = '';
    return img;
}

/**
 * The first visible element matching the earliest selector in `selectors` that has one.
 * @param {Document} doc
 * @param {string[]} selectors
 * @returns {Element | null}
 */
function findFirstVisible(doc, selectors) {
    for (const selector of selectors) {
        const match = [...doc.querySelectorAll(selector)].find((el) => el.getClientRects().length > 0);
        if (match) return match;
    }
    return null;
}

/**
 * @param {Document} doc
 * @returns {HTMLVideoElement | null}
 */
function getMainVideo(doc) {
    const video = doc.querySelector('video.html5-main-video') ?? doc.querySelector('video');
    // instanceof would fail for the embed's video, which belongs to the iframe's realm.
    return video?.tagName === 'VIDEO' ? /** @type {HTMLVideoElement} */ (video) : null;
}

/**
 * Resolves with the Duck Player embed's document once it has loaded. The page and the embed share the nocookie origin,
 * so the page can reach into it.
 * @returns {Promise<Document>}
 */
function duckPlayerEmbedDocument() {
    return new Promise((resolve) => {
        const attach = () => {
            const iframe = document.querySelector('iframe[src*="/embed/"]');
            if (!(iframe instanceof HTMLIFrameElement)) return false;
            const resolveIfLoaded = () => {
                const doc = iframe.contentDocument;
                // Before it loads, the iframe holds an about:blank document that inherits the page's origin.
                // While the embed is still parsing, wait for its load event so its head exists.
                if (doc && doc.location.pathname.startsWith('/embed/') && doc.readyState !== 'loading') resolve(doc);
            };
            iframe.addEventListener('load', resolveIfLoaded);
            resolveIfLoaded();
            return true;
        };
        if (attach()) return;
        const observer = new MutationObserver(() => {
            if (attach()) observer.disconnect();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    });
}

/**
 * Skips sponsored segments in YouTube videos.
 *
 * Tracks the current video ID, asks native for its SponsorBlock segments, marks them on the progress bar and,
 * while playback is inside one, offers a button that jumps to its end.
 */
export class SegmentSkip extends ContentFeature {
    /** @type {string | null} */
    #videoID = null;
    #active = false;
    // Off until native confirms the user opted in; remote config is the outer gate and is applied before init runs.
    #enabled = false;
    /** @type {Config['skipMode']} */
    #skipMode = 'manual';
    /** @type {Segment[]} */
    #segments = [];
    /** @type {string | null} uuid of the segment the user seeked into; skipped manually even in auto mode */
    #seekedInto = null;
    /** @type {{ start: number, end: number } | null} interval the user chose to watch after undo */
    #undoPlayback = null;
    #undoSeekPending = false;
    /** @type {HTMLElement | null} */
    #overlay = null;
    #renderedDuration = 0;
    /** @type {SkipButton | null} */
    #skipButton = null;
    /** @type {ReturnType<typeof setTimeout>[] | null} timers of the skip button's running exit animation */
    #skipButtonExit = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} hides the skip button once it has slid away from YouTube's controls */
    #skipButtonConcealTimer;
    /** @type {Segment | null} */
    #skipSegment = null;
    /** @type {{ start: number, end: number } | null} interval skipped automatically, while the button offers to undo it */
    #undoSegment = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    #undoTimer;
    /** @type {string | null} uuid of the segment the skip button is showing for */
    #skipButtonFor = null;
    /** @type {string | null} uuid of the segment whose skip button timed out; stays hidden until playback leaves it */
    #skipButtonTimedOut = null;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    #skipButtonTimer;
    // Playback time left before the skip button hides, and when the running countdown started (null while stopped).
    #skipButtonMsLeft = 0;
    /** @type {number | null} */
    #skipButtonCountdownStart = null;
    #progressBarSelectors = DEFAULT_PROGRESS_BAR_SELECTORS;
    #skipButtonHostSelectors = DEFAULT_SKIP_BUTTON_HOST_SELECTORS;
    #adShowingSelectors = DEFAULT_AD_SHOWING_SELECTORS;
    #controlsVisibleSelectors = DEFAULT_CONTROLS_VISIBLE_SELECTORS;
    /** @type {MutationObserver | null} re-checks the skip button when YouTube shows or hides its controls */
    #controlsObserver = null;
    /** @type {Element | null} the element #controlsObserver watches */
    #controlsObserved = null;
    // The document holding the player. On Android Duck Player it is the embed's, since the script runs only in the top frame.
    #doc = document;
    #locale = 'en';

    /**
     * Selector list from feature settings, falling back to `defaults` when the key is absent. Remote config is a
     * hot-fix channel, so malformed entries are dropped rather than letting them throw out of querySelectorAll.
     * @param {string} key
     * @param {string[]} defaults
     * @returns {string[]}
     */
    selectorsSetting(key, defaults) {
        return validSelectors(this.getFeatureSetting(key), defaults);
    }

    /**
     * @param {{ locale?: string, language?: string }} [args]
     */
    async init(args) {
        // Locale dirs are bare language codes: strip any region subtag ('de-DE'/'de_DE' → 'de')
        this.#locale =
            String(args?.locale || args?.language || 'en')
                .toLowerCase()
                .split(/[-_]/)[0] || 'en';
        const { hostname, origin, ancestorOrigins } = window.location;
        // ancestorOrigins is missing in Firefox; there the embed case simply stays inactive.
        const frame = {
            hostname,
            origin,
            isTop: window.top === window,
            ancestorOrigins: Array.from(ancestorOrigins ?? []),
        };
        if (!shouldActivate(frame)) return;
        // Android injects only into the top frame; the Duck Player embed is driven from the page instead (see below).
        if (this.platform.name === 'android' && !frame.isTop) return;
        this.#active = true;
        // Runs at document start, when there is no <head> to style yet. The player is built by YouTube's scripts after
        // the parse anyway, so nothing is lost by waiting.
        if (document.readyState === 'loading') {
            await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
        }
        this.#progressBarSelectors = this.selectorsSetting('progressBarSelectors', DEFAULT_PROGRESS_BAR_SELECTORS);
        this.#skipButtonHostSelectors = this.selectorsSetting('skipButtonHostSelectors', DEFAULT_SKIP_BUTTON_HOST_SELECTORS);
        this.#adShowingSelectors = this.selectorsSetting('adShowingSelectors', DEFAULT_AD_SHOWING_SELECTORS);
        this.#controlsVisibleSelectors = this.selectorsSetting('controlsVisibleSelectors', DEFAULT_CONTROLS_VISIBLE_SELECTORS);
        // Android injects only into the top frame, so on Duck Player's page the embed gets no script of its own. An embed
        // opened directly is the player itself and has no embed inside it to wait for.
        if (
            this.platform.name === 'android' &&
            frame.isTop &&
            isNoCookieOrigin(origin) &&
            !window.location.pathname.startsWith('/embed/')
        ) {
            this.#doc = await duckPlayerEmbedDocument();
            const style = this.#doc.createElement('style');
            style.textContent = STYLES;
            this.#doc.head.append(style);
        } else {
            injectGlobalStyles(STYLES);
        }

        // Subscribe before asking, so a setting changed while getConfig is in flight is not lost.
        this.subscribe('onConfigChanged', (config) => this.applyConfig(config));
        try {
            this.applyConfig(await this.request('getConfig', {}));
        } catch {
            // No handler on this build: stay disabled, draw nothing and never ask for segments.
        }

        this.checkVideoID();
        // Media events don't bubble, so listen in the capture phase.
        // loadstart: backstop for YouTube's in-page navigation, a new video always starts loading.
        this.#doc.addEventListener('loadstart', () => this.checkVideoID(), true);
        // durationchange: duration is unknown at first and changes between ads and the video.
        // timeupdate: YouTube re-renders its controls (often on mobile), so re-attach the overlay when that happens;
        // it also drives the skip button, together with seeked for jumps while paused.
        this.#doc.addEventListener('durationchange', () => this.renderOverlay(), true);
        this.#doc.addEventListener(
            'timeupdate',
            () => {
                this.renderOverlay();
                this.updateSkip();
            },
            true,
        );
        this.#doc.addEventListener(
            'seeked',
            () => {
                this.#undoSeekPending = false;
                this.updateSkip();
            },
            true,
        );
        // The skip button's countdown runs only while the video plays.
        for (const type of ['playing', 'pause', 'waiting']) this.#doc.addEventListener(type, () => this.updateSkip(), true);
        // seeking: fires only for jumps, never for natural playback, with the new position already set.
        this.#doc.addEventListener('seeking', () => this.markSeekedInto(), true);
    }

    // A drag or tap into a segment is a choice, so that segment gets the button instead of an auto skip. Our own skip
    // lands past every segment it touches, so it never marks anything.
    markSeekedInto() {
        const video = getMainVideo(this.#doc);
        const undoSeek = this.#undoSeekPending && video?.currentTime === this.#undoPlayback?.start;
        this.#undoSeekPending = false;
        if (undoSeek) return;
        this.#undoPlayback = null;
        this.#seekedInto = video ? (segmentAt(this.validSegments(video.duration), video.currentTime)?.uuid ?? null) : null;
    }

    // Called by the framework on SPA navigations (registered for every site, hence the #active guard).
    urlChanged() {
        if (this.#active) this.checkVideoID();
    }

    /**
     * @param {Config} config
     */
    applyConfig({ enabled, skipMode }) {
        this.#skipMode = skipMode;
        if (enabled === this.#enabled) {
            // Only the mode changed: it applies to the segment in progress, no need to ask native again.
            this.updateSkip();
            return;
        }
        this.#enabled = enabled;
        // Re-evaluate the current video: enabling fetches its segments, disabling clears the overlay and the button.
        this.#videoID = null;
        this.checkVideoID();
    }

    checkVideoID() {
        // Duck Player's page has the same nocookie URL as the embed it frames, so on nocookie only the document with the
        // video acts; loadstart re-checks once the video appears.
        const location = this.#doc.location;
        const ownsPlayer = !isNoCookieOrigin(location.origin) || getMainVideo(this.#doc);
        const videoID = ownsPlayer ? videoIDFromURL(location.href) : null;
        if (videoID === this.#videoID) return;
        this.#videoID = videoID;
        this.#segments = [];
        this.#undoPlayback = null;
        this.#undoSeekPending = false;
        this.clearUndo();
        this.renderOverlay();
        this.updateSkip();
        if (videoID && this.#enabled) void this.fetchSegments(videoID);
    }

    /**
     * @param {string} videoID
     */
    async fetchSegments(videoID) {
        try {
            const { segments } = await this.request('getSegments', { videoID });
            // The user may have moved to another video, or turned the feature off, while the request was in flight.
            if (videoID !== this.#videoID || !this.#enabled) return;
            // A malformed response would otherwise throw from every timeupdate, outside this try.
            this.#segments = Array.isArray(segments) ? segments : [];
            this.#renderedDuration = 0;
            this.renderOverlay();
            this.updateSkip();
        } catch {
            // Native resolves lookup failures with an empty list; a rejection means the handler is missing. Nothing to show.
        }
    }

    // Draws the current segments on the progress bar. Cheap when nothing changed, since timeupdate calls it often.
    renderOverlay() {
        if (!this.#segments.length || this.inAd()) {
            this.#overlay?.remove();
            return;
        }
        const duration = getMainVideo(this.#doc)?.duration ?? NaN;
        if (this.#overlay?.isConnected && duration === this.#renderedDuration) return;

        const bar = findFirstVisible(this.#doc, this.#progressBarSelectors);
        if (!bar || !(duration > 0)) return;

        if (!this.#overlay) {
            this.#overlay = this.#doc.createElement('div');
            this.#overlay.className = OVERLAY_CLASS;
        }
        if (this.#overlay.parentElement !== bar) bar.prepend(this.#overlay);
        this.#overlay.replaceChildren(
            ...this.validSegments(duration).flatMap((segment) => {
                const position = segmentPosition(segment, duration);
                if (!position) return [];
                const el = this.#doc.createElement('div');
                el.style.left = position.left;
                el.style.right = position.right;
                return [el];
            }),
        );
        this.#renderedDuration = duration;
    }

    // While YouTube plays an ad the video element plays the ad, so its time and duration say nothing about the segments.
    inAd() {
        return findFirstVisible(this.#doc, this.#adShowingSelectors) !== null;
    }

    // YouTube's controls are on screen. The skip button sits where they draw, so it waits for them to fade.
    controlsVisible() {
        return findFirstVisible(this.#doc, this.#controlsVisibleSelectors) !== null;
    }

    /**
     * Toggling the controls changes only classes: no media event fires, and a paused video sends no timeupdate. So while
     * the button is mounted, class changes in its host's subtree re-check it. The host contains the controls on every
     * known surface (the player on desktop, its container or controls layer on mobile).
     * @param {Element} host
     */
    observeControls(host) {
        if (this.#controlsObserved === host) return;
        // The skip button's own host is in the subtree and its classes drive its animations; reacting to those would loop.
        this.#controlsObserver ??= new MutationObserver((records) => {
            if (records.some((record) => record.target !== this.#skipButton?.host)) this.updateSkip();
        });
        this.#controlsObserver.disconnect();
        this.#controlsObserver.observe(host, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });
        this.#controlsObserved = host;
    }

    /**
     * Segments that apply to the video currently loaded in the player.
     * @param {number} duration
     */
    validSegments(duration) {
        return this.#segments.filter((segment) => matchesDuration(segment, duration));
    }

    /**
     * @param {HTMLVideoElement} video
     * @param {Segment} segment
     */
    skipTo(video, segment) {
        // The end is exclusive, so landing on it leaves the segment. Segments that touch or overlap it are skipped in the
        // same jump; landing inside one would mark it as seeked into and turn its auto skip into a button.
        const segments = this.validSegments(video.duration);
        let end = segment.end;
        for (let next = segmentAt(segments, end); next; next = segmentAt(segments, end)) end = next.end;
        video.currentTime = end;
        this.hideSkipButton();
        return end;
    }

    /**
     * Offers to undo an automatic skip for a few seconds.
     * @param {{ start: number, end: number }} segment
     */
    offerUndo(segment) {
        clearTimeout(this.#undoTimer);
        this.#undoSegment = segment;
        this.#undoTimer = setTimeout(() => {
            this.#undoSegment = null;
            // Not just hideSkipButton: a paused video fires no timeupdate, and the busy flag must clear too.
            this.updateSkip();
        }, UNDO_TIMEOUT_MS);
    }

    clearUndo() {
        clearTimeout(this.#undoTimer);
        this.#undoSegment = null;
    }

    /**
     * Shows the skip button in `parent` as `kind`, sliding it in when it wasn't on screen. Showing it while it animates
     * out turns it back around. While YouTube's controls show it slides away and stays mounted but hidden, so its
     * countdown keeps the time already used, and slides in again once they fade.
     * @param {Element} parent
     * @param {'skip' | 'undo'} kind
     * @param {boolean} visible
     * @returns {HTMLElement} the button's shadow host
     */
    showSkipButton(parent, kind, visible) {
        this.#skipButton ??= this.createSkipButton();
        const { host, label } = this.#skipButton;
        if (this.#skipButtonExit) this.resetSkipButton();
        const kindChanged = host.classList.contains('undo') !== (kind === 'undo');
        if (kindChanged) {
            host.classList.toggle('undo', kind === 'undo');
            label.textContent = this.localized(kind === 'undo' ? 'undoSkipButton' : 'skipButton');
        }
        const moved = host.parentElement !== parent;
        if (moved) parent.append(host);
        if (!visible) {
            if (host.classList.contains('on')) {
                // Slides out to the right, as when it leaves for good, then hides.
                host.classList.remove('on');
                this.#skipButtonConcealTimer = setTimeout(() => {
                    this.#skipButtonConcealTimer = undefined;
                    host.style.display = 'none';
                }, SLIDE_OUT_MS);
            } else if (this.#skipButtonConcealTimer === undefined) {
                host.style.display = 'none';
            }
            return host;
        }
        clearTimeout(this.#skipButtonConcealTimer);
        this.#skipButtonConcealTimer = undefined;
        const wasHidden = host.style.display === 'none';
        host.style.display = '';
        // Appearing, or a new kind of offer: start the slide in from the hidden state.
        if (moved || kindChanged || wasHidden || !host.classList.contains('on')) {
            host.classList.remove('on');
            void host.offsetWidth;
        }
        host.classList.add('on');
        return host;
    }

    /**
     * Animates the skip button out, then removes it. A tap folds it down to the skip icon; anything else slides it off.
     * @param {'collapse' | 'slide'} exit
     */
    hideSkipButton(exit = 'slide') {
        this.stopSkipButtonCountdown();
        this.#skipButtonFor = null;
        this.#controlsObserver?.disconnect();
        this.#controlsObserved = null;
        if (!this.#skipButton?.host.isConnected || this.#skipButtonExit) return;
        const { host, collapsible } = this.#skipButton;
        if (exit === 'slide') {
            host.classList.remove('on');
            this.#skipButtonExit = [setTimeout(() => this.removeSkipButton(), SLIDE_OUT_MS)];
            return;
        }
        // max-width only transitions between lengths, so pin each part to its width before folding it to 0.
        for (const el of collapsible) el.style.maxWidth = `${el.offsetWidth}px`;
        void host.offsetWidth;
        host.classList.add('collapse');
        for (const el of collapsible) el.style.maxWidth = '0';
        this.#skipButtonExit = [
            setTimeout(() => host.classList.add('out'), COLLAPSE_FADE_AT_MS),
            setTimeout(() => this.removeSkipButton(), COLLAPSE_DONE_MS),
        ];
    }

    removeSkipButton() {
        if (!this.#skipButton) return;
        const { host } = this.#skipButton;
        host.remove();
        this.resetSkipButton();
        host.classList.remove('on');
        host.style.display = '';
    }

    // Cancels any exit animation and clears its state.
    resetSkipButton() {
        if (!this.#skipButton) return;
        const { host, collapsible } = this.#skipButton;
        for (const timer of this.#skipButtonExit ?? []) clearTimeout(timer);
        this.#skipButtonExit = null;
        clearTimeout(this.#skipButtonConcealTimer);
        this.#skipButtonConcealTimer = undefined;
        host.classList.remove('collapse', 'out');
        for (const el of collapsible) el.style.maxWidth = '';
    }

    startSkipButtonCountdown() {
        const uuid = this.#skipButtonFor;
        if (!uuid || this.#skipButtonCountdownStart !== null) return;
        this.#skipButtonCountdownStart = Date.now();
        this.#skipButtonTimer = setTimeout(() => {
            this.#skipButtonTimedOut = uuid;
            this.hideSkipButton();
        }, this.#skipButtonMsLeft);
    }

    stopSkipButtonCountdown() {
        clearTimeout(this.#skipButtonTimer);
        if (this.#skipButtonCountdownStart === null) return;
        this.#skipButtonMsLeft -= Date.now() - this.#skipButtonCountdownStart;
        this.#skipButtonCountdownStart = null;
    }

    // Reacts to the playhead: in auto mode seeks past a segment as soon as playback enters it, in manual mode (or for
    // a segment the user seeked into) shows the skip button while inside one and hides it otherwise; while YouTube's
    // controls are on screen the button stays mounted but hidden. An ended video is never inside one: a segment end
    // past the player's duration clamps the skip to the end, still before that end.
    updateSkip() {
        const video = getMainVideo(this.#doc);
        // Segments first: timeupdate calls this often, and inAd queries the DOM.
        this.#skipSegment =
            video && !video.ended && this.#segments.length && !this.inAd()
                ? segmentAt(this.validSegments(video.duration), video.currentTime)
                : null;
        if (this.#undoPlayback && (!video || video.currentTime < this.#undoPlayback.start || video.currentTime >= this.#undoPlayback.end)) {
            this.#undoPlayback = null;
            this.#undoSeekPending = false;
        }
        if (this.#skipSegment?.uuid !== this.#seekedInto) this.#seekedInto = null;
        if (video && this.#skipSegment && this.#skipMode === 'auto' && !this.#seekedInto && !this.#undoPlayback) {
            const end = this.skipTo(video, this.#skipSegment);
            this.offerUndo({ start: this.#skipSegment.start, end });
            // Playback is past the segment now; fall through to show the undo button.
            this.#skipSegment = null;
        }
        const uuid = this.#skipSegment?.uuid ?? null;
        // Leaving the segment forgets its timeout, so coming back to it shows the button again.
        if (uuid !== this.#skipButtonTimedOut) this.#skipButtonTimedOut = null;
        // Inside a segment the skip button takes over from an undo offer.
        if (uuid) this.clearUndo();
        const skippable = uuid && !this.#skipButtonTimedOut && !this.#undoPlayback;
        // No undo over an ad: it plays in the same video element, so the tap would seek the ad.
        const kind = skippable ? 'skip' : this.#undoSegment && !this.inAd() ? 'undo' : null;
        this.#doc.documentElement.toggleAttribute(BUSY_ATTR, Boolean(uuid || kind));
        const host = kind ? findFirstVisible(this.#doc, this.#skipButtonHostSelectors) : null;
        if (!host || !kind) {
            this.hideSkipButton();
            return;
        }
        const controlsVisible = this.controlsVisible();
        const skipButton = this.showSkipButton(host, kind, !controlsVisible);
        if (skippable && this.#skipButtonFor !== uuid) {
            this.stopSkipButtonCountdown();
            this.#skipButtonFor = uuid;
            this.#skipButtonMsLeft = SKIP_BUTTON_TIMEOUT_MS;
        }
        this.observeControls(host);
        // Playing means not paused and not stalled waiting for data.
        if (skippable && !controlsVisible && video && !video.paused && video.readyState >= video.HAVE_FUTURE_DATA) {
            this.startSkipButtonCountdown();
        } else {
            this.stopSkipButtonCountdown();
        }
        if (host.id !== 'player-controls') return;
        const hostRect = host.getBoundingClientRect();
        if (this.#doc !== document) {
            // Android's Duck Player embed: the host fills the embed's viewport, which in fullscreen letterboxes the video.
            // The button only shows while the controls are hidden, so it has nothing to clear: pin it to the video's
            // bottom-right corner, as on m.youtube.com.
            const videoRect = video?.getBoundingClientRect();
            if (!videoRect?.height) return;
            skipButton.style.bottom = `${Math.round(hostRect.bottom - videoRect.bottom) + 40}px`;
            skipButton.style.right = `${Math.round(hostRect.right - videoRect.right) + 8}px`;
            return;
        }
        const row = host.querySelector('.player-controls-bottom');
        if (row) skipButton.style.bottom = `${Math.round(hostRect.bottom - row.getBoundingClientRect().top) + 12}px`;
    }

    /**
     * Localized copy for a key: the bundled locale, then bundled English.
     * @param {string} key
     * @returns {string}
     */
    localized(key) {
        return STRINGS[this.#locale]?.[STRINGS_FILE]?.[key] ?? STRINGS.en?.[STRINGS_FILE]?.[key] ?? key;
    }

    // A closed shadow root keeps the button's markup and listeners out of reach of YouTube's scripts. Built with DOM
    // calls, not innerHTML: YouTube enforces Trusted Types, which blocks assigning a plain string to innerHTML.
    /** @returns {SkipButton} */
    createSkipButton() {
        const host = this.#doc.createElement('div');
        host.className = SKIP_BUTTON_CLASS;
        const shadow = host.attachShadow({ mode: 'closed' });
        const style = this.#doc.createElement('style');
        style.textContent = SKIP_BUTTON_STYLES;
        const button = this.#doc.createElement('button');
        button.type = 'button';
        // The label changes between "Skip" and "Undo Skip"; announce it.
        button.setAttribute('aria-live', 'polite');
        const logo = createIcon(this.#doc, DAX_ICON_URI);
        const label = this.#doc.createElement('span');
        label.textContent = this.localized('skipButton');
        const sweep = this.#doc.createElement('span');
        sweep.className = 'sweep';
        for (const el of [logo, label]) el.className = 'collapsible';
        const skipIcon = createIcon(this.#doc, SKIP_ICON_URI);
        skipIcon.className = 'skip-icon';
        const undoIcon = createIcon(this.#doc, UNDO_ICON_URI);
        undoIcon.className = 'undo-icon';
        button.append(logo, label, skipIcon, undoIcon, sweep);
        shadow.append(style, button);
        // Keep the tap from also reaching the player, which would toggle YouTube's controls.
        button.addEventListener('pointerdown', (e) => e.stopPropagation());
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const video = getMainVideo(this.#doc);
            const undo = this.#undoSegment;
            if (video && undo) {
                // Going back is a choice to watch the segment: no auto skip and no skip button until playback leaves it.
                this.clearUndo();
                this.hideSkipButton();
                this.#undoPlayback = undo;
                this.#undoSeekPending = true;
                video.currentTime = undo.start;
                return;
            }
            if (!video || !this.#skipSegment) return;
            this.hideSkipButton('collapse');
            this.skipTo(video, this.#skipSegment);
        });
        return { host, label, collapsible: [logo, label] };
    }
}

export default SegmentSkip;
