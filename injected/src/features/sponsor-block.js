import ContentFeature from '../content-feature.js';
import { injectGlobalStyles, isValidSelector } from '../utils.js';

/** @typedef {import('../types/sponsor-block.js').Segment} Segment */
/** @typedef {import('../types/sponsor-block.js').OnConfigChangedParams} Config */

// Selector defaults, used until the privacy-config `sponsorBlock` settings ship the same keys. Ordered lists: the first
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

const OVERLAY_CLASS = 'ddg-sponsorblock-overlay';
const SKIP_BUTTON_CLASS = 'ddg-sponsorblock-skip';
const STYLES = `
.${OVERLAY_CLASS} { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.${OVERLAY_CLASS} > div { position: absolute; top: 0; bottom: 0; min-width: 2px; background: rgb(76, 186, 60); }
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
// Fixed literal, never page data. The icon matches YouTube's "next" glyph: a triangle and a bar.
const SKIP_BUTTON_HTML = `
<style>
button {
    all: unset; box-sizing: border-box; padding: 10px 16px; border-radius: 8px; background: rgb(222, 88, 51); color: #fff;
    font: 500 14px/1.2 Roboto, Arial, sans-serif; cursor: pointer;
}
button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
</style>
<button type="button">Skip sponsored content <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="vertical-align:-1px"><path d="M1 1l7 5-7 5z M9 1h2v10H9z" fill="currentColor"/></svg></button>
`;

/**
 * The first visible element matching the earliest selector in `selectors` that has one.
 * @param {string[]} selectors
 * @returns {Element | null}
 */
function findFirstVisible(selectors) {
    for (const selector of selectors) {
        const match = [...document.querySelectorAll(selector)].find((el) => el.getClientRects().length > 0);
        if (match) return match;
    }
    return null;
}

/**
 * youtube.com, youtube-nocookie.com (Duck Player's embed) and their subdomains.
 * @param {string} hostname
 */
function isYouTubeHost(hostname) {
    return ['youtube.com', 'youtube-nocookie.com'].some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/**
 * @param {string} origin
 */
function isNoCookieOrigin(origin) {
    return /^https:\/\/([\w-]+\.)*youtube-nocookie\.com$/.test(origin);
}

/**
 * Frame rule. Content scripts also run in iframes, so act only where the player is ours to handle:
 * - the top frame of youtube.com and m.youtube.com;
 * - the top frame of youtube-nocookie.com, which is how iOS Duck Player loads the video (no page around it);
 * - a youtube-nocookie.com frame whose ancestors are all nocookie pages: macOS Duck Player's embed, since the Duck Player
 *   page is served from that origin. Embeds on any other site never activate it.
 * @param {{ hostname: string, origin: string, isTop: boolean, ancestorOrigins: string[] }} frame
 */
export function shouldActivate({ hostname, origin, isTop, ancestorOrigins }) {
    if (!isYouTubeHost(hostname)) return false;
    if (isTop) return true;
    return isNoCookieOrigin(origin) && ancestorOrigins.length > 0 && ancestorOrigins.every(isNoCookieOrigin);
}

/**
 * @returns {HTMLVideoElement | null}
 */
function getMainVideo() {
    const video = document.querySelector('video.html5-main-video') ?? document.querySelector('video');
    return video instanceof HTMLVideoElement ? video : null;
}

/**
 * Returns the YouTube video ID for watch, shorts, live and embed URLs, or null for any other page.
 * @param {string} href
 * @returns {string | null}
 */
export function videoIDFromURL(href) {
    const { hostname, pathname, searchParams } = new URL(href);
    if (!isYouTubeHost(hostname)) return null;
    const id = pathname === '/watch' ? searchParams.get('v') : pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/**
 * Position of a segment on the progress bar as CSS percentages, or null when it falls outside the video
 * (e.g. while a short ad is playing).
 * @param {Segment} segment
 * @param {number} duration
 * @returns {{ left: string, right: string } | null}
 */
export function segmentPosition({ start, end }, duration) {
    if (!(duration > 0) || start >= duration || end <= start) return null;
    return {
        left: `${(Math.max(0, start) / duration) * 100}%`,
        right: `${(1 - Math.min(end, duration) / duration) * 100}%`,
    };
}

/**
 * The segment playing at `time`, or null. A segment's end is exclusive, so seeking to it leaves the segment.
 * @param {Segment[]} segments
 * @param {number} time
 * @returns {Segment | null}
 */
export function segmentAt(segments, time) {
    return segments.find(({ start, end }) => time >= start && time < end) ?? null;
}

/**
 * False when the segment was submitted against a different cut of the video, so its times no longer apply. A missing
 * or zero `videoDuration` means unknown and is accepted.
 * @param {Segment} segment
 * @param {number} duration
 */
export function matchesDuration({ videoDuration }, duration) {
    return !videoDuration || Math.abs(videoDuration - duration) <= 2;
}

/**
 * Skips sponsored segments in YouTube videos.
 *
 * Tracks the current video ID, asks native for its SponsorBlock segments, marks them on the progress bar and,
 * while playback is inside one, offers a button that jumps to its end.
 */
export class SponsorBlock extends ContentFeature {
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
    /** @type {HTMLElement | null} */
    #overlay = null;
    #renderedDuration = 0;
    /** @type {HTMLElement | null} shadow host of the skip button */
    #skipButton = null;
    /** @type {Segment | null} */
    #skipSegment = null;
    #progressBarSelectors = DEFAULT_PROGRESS_BAR_SELECTORS;
    #skipButtonHostSelectors = DEFAULT_SKIP_BUTTON_HOST_SELECTORS;
    #adShowingSelectors = DEFAULT_AD_SHOWING_SELECTORS;

    /**
     * Selector list from feature settings, falling back to `defaults` when the key is absent. Remote config is a
     * hot-fix channel, so malformed entries are dropped rather than letting them throw out of querySelectorAll.
     * @param {string} key
     * @param {string[]} defaults
     * @returns {string[]}
     */
    selectorsSetting(key, defaults) {
        const setting = this.getFeatureSetting(key);
        if (!Array.isArray(setting)) return defaults;
        return setting.filter((s) => typeof s === 'string' && isValidSelector(s));
    }

    async init() {
        const { hostname, origin, ancestorOrigins } = window.location;
        // ancestorOrigins is missing in Firefox; there the embed case simply stays inactive.
        const frame = { hostname, origin, isTop: window.top === window, ancestorOrigins: Array.from(ancestorOrigins ?? []) };
        if (!shouldActivate(frame)) return;
        this.#active = true;
        // Runs at document start, when there is no <head> to style yet. The player is built by YouTube's scripts after
        // the parse anyway, so nothing is lost by waiting.
        if (document.readyState === 'loading') {
            await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
        }
        this.#progressBarSelectors = this.selectorsSetting('progressBarSelectors', DEFAULT_PROGRESS_BAR_SELECTORS);
        this.#skipButtonHostSelectors = this.selectorsSetting('skipButtonHostSelectors', DEFAULT_SKIP_BUTTON_HOST_SELECTORS);
        this.#adShowingSelectors = this.selectorsSetting('adShowingSelectors', DEFAULT_AD_SHOWING_SELECTORS);
        injectGlobalStyles(STYLES);

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
        document.addEventListener('loadstart', () => this.checkVideoID(), true);
        // durationchange: duration is unknown at first and changes between ads and the video.
        // timeupdate: YouTube re-renders its controls (often on mobile), so re-attach the overlay when that happens;
        // it also drives the skip button, together with seeked for jumps while paused.
        document.addEventListener('durationchange', () => this.renderOverlay(), true);
        document.addEventListener(
            'timeupdate',
            () => {
                this.renderOverlay();
                this.updateSkip();
            },
            true,
        );
        document.addEventListener('seeked', () => this.updateSkip(), true);
        // seeking: fires only for jumps, never for natural playback, with the new position already set.
        document.addEventListener('seeking', () => this.markSeekedInto(), true);
    }

    // A drag or tap into a segment is a choice, so that segment gets the button instead of an auto skip. Our own skip
    // lands past every segment it touches, so it never marks anything.
    markSeekedInto() {
        const video = getMainVideo();
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
        const ownsPlayer = !isNoCookieOrigin(window.location.origin) || getMainVideo();
        const videoID = ownsPlayer ? videoIDFromURL(window.location.href) : null;
        if (videoID === this.#videoID) return;
        this.#videoID = videoID;
        this.#segments = [];
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
            this.#segments = segments;
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
        const duration = getMainVideo()?.duration ?? NaN;
        if (this.#overlay?.isConnected && duration === this.#renderedDuration) return;

        const bar = findFirstVisible(this.#progressBarSelectors);
        if (!bar || !(duration > 0)) return;

        if (!this.#overlay) {
            this.#overlay = document.createElement('div');
            this.#overlay.className = OVERLAY_CLASS;
        }
        if (this.#overlay.parentElement !== bar) bar.prepend(this.#overlay);
        this.#overlay.replaceChildren(
            ...this.validSegments(duration).flatMap((segment) => {
                const position = segmentPosition(segment, duration);
                if (!position) return [];
                const el = document.createElement('div');
                el.style.left = position.left;
                el.style.right = position.right;
                return [el];
            }),
        );
        this.#renderedDuration = duration;
    }

    // While YouTube plays an ad the video element plays the ad, so its time and duration say nothing about the segments.
    inAd() {
        return findFirstVisible(this.#adShowingSelectors) !== null;
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
        this.#skipButton?.remove();
    }

    // Reacts to the playhead: in auto mode seeks past a segment as soon as playback enters it, in manual mode (or for
    // a segment the user seeked into) shows the skip button while inside one and hides it otherwise. An ended video is
    // never inside one: a segment end past the player's duration clamps the skip to the end, still before that end.
    updateSkip() {
        const video = getMainVideo();
        // Segments first: timeupdate calls this often, and inAd queries the DOM.
        this.#skipSegment =
            video && !video.ended && this.#segments.length && !this.inAd()
                ? segmentAt(this.validSegments(video.duration), video.currentTime)
                : null;
        if (this.#skipSegment?.uuid !== this.#seekedInto) this.#seekedInto = null;
        if (video && this.#skipSegment && this.#skipMode === 'auto' && !this.#seekedInto) {
            this.skipTo(video, this.#skipSegment);
            return;
        }
        const host = this.#skipSegment ? findFirstVisible(this.#skipButtonHostSelectors) : null;
        if (!host) {
            this.#skipButton?.remove();
            return;
        }
        this.#skipButton ??= this.createSkipButton();
        if (this.#skipButton.parentElement !== host) host.append(this.#skipButton);
        const row = host.id === 'player-controls' ? host.querySelector('.player-controls-bottom') : null;
        if (row) {
            const gap = host.getBoundingClientRect().bottom - row.getBoundingClientRect().top;
            this.#skipButton.style.bottom = `${Math.round(gap) + 12}px`;
        }
    }

    // A closed shadow root keeps the button's markup and listeners out of reach of YouTube's scripts.
    createSkipButton() {
        const host = document.createElement('div');
        host.className = SKIP_BUTTON_CLASS;
        const shadow = host.attachShadow({ mode: 'closed' });
        shadow.innerHTML = SKIP_BUTTON_HTML;
        const button = /** @type {HTMLButtonElement} */ (shadow.querySelector('button'));
        // Keep the tap from also reaching the player, which would toggle YouTube's controls.
        button.addEventListener('pointerdown', (e) => e.stopPropagation());
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const video = getMainVideo();
            if (video && this.#skipSegment) this.skipTo(video, this.#skipSegment);
        });
        return host;
    }
}

export default SponsorBlock;
