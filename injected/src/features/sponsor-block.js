import ContentFeature from '../content-feature.js';
import { injectGlobalStyles } from '../utils.js';
import { isValidSelector } from './chrome-webstore-patching/helpers.js';

/** @typedef {import('../types/sponsor-block.js').Segment} Segment */

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
// #player-container-id, so mount there to stay above that layer and receive taps; desktop uses the player itself.
const DEFAULT_SKIP_BUTTON_HOST_SELECTORS = ['#player-container-id', '#movie_player', '.html5-video-player'];
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
/* Skip button: bottom-right over the video, above the progress bar, like YouTube's own "Skip ad" button. */
.${SKIP_BUTTON_CLASS} {
    all: unset; position: absolute; right: 12px; bottom: 72px; z-index: 1000; box-sizing: border-box;
    padding: 10px 16px; border-radius: 8px; background: rgb(222, 88, 51); color: #fff;
    font: 500 14px/1.2 Roboto, Arial, sans-serif; cursor: pointer; pointer-events: auto;
}
.${SKIP_BUTTON_CLASS}:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
#player-container-id > .${SKIP_BUTTON_CLASS} { right: 8px; bottom: 40px; }
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
 * Skips sponsored segments in YouTube videos.
 *
 * Tracks the current video ID, asks native for its SponsorBlock segments, marks them on the progress bar and,
 * while playback is inside one, offers a button that jumps to its end.
 */
export class SponsorBlock extends ContentFeature {
    /** @type {string | null} */
    #videoID = null;
    #active = false;
    /** @type {Segment[]} */
    #segments = [];
    /** @type {HTMLElement | null} */
    #overlay = null;
    #renderedDuration = 0;
    /** @type {HTMLButtonElement | null} */
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

    init() {
        const { hostname, ancestorOrigins } = window.location;
        // Content scripts also run in iframes. Act in the top frame, or in Duck Player's embed: a nocookie frame whose
        // ancestors are all nocookie pages (Duck Player is served from that origin), never in embeds on other sites.
        const inDuckPlayerEmbed =
            isNoCookieOrigin(window.location.origin) && !!ancestorOrigins?.length && Array.from(ancestorOrigins).every(isNoCookieOrigin);
        if (!isYouTubeHost(hostname) || (window.top !== window && !inDuckPlayerEmbed)) {
            return;
        }
        this.#active = true;
        this.#progressBarSelectors = this.selectorsSetting('progressBarSelectors', DEFAULT_PROGRESS_BAR_SELECTORS);
        this.#skipButtonHostSelectors = this.selectorsSetting('skipButtonHostSelectors', DEFAULT_SKIP_BUTTON_HOST_SELECTORS);
        this.#adShowingSelectors = this.selectorsSetting('adShowingSelectors', DEFAULT_AD_SHOWING_SELECTORS);
        injectGlobalStyles(STYLES);

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
                this.updateSkipButton();
            },
            true,
        );
        document.addEventListener('seeked', () => this.updateSkipButton(), true);
    }

    // Called by the framework on SPA navigations (registered for every site, hence the #active guard).
    urlChanged() {
        if (this.#active) this.checkVideoID();
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
        this.updateSkipButton();
        if (videoID) void this.fetchSegments(videoID);
    }

    /**
     * @param {string} videoID
     */
    async fetchSegments(videoID) {
        try {
            const { segments } = await this.request('getSegments', { videoID });
            // The user may have moved to another video while the request was in flight.
            if (videoID !== this.#videoID) return;
            this.#segments = segments;
            this.#renderedDuration = 0;
            this.renderOverlay();
            this.updateSkipButton();
        } catch {
            // Native resolves lookup failures with an empty list; a rejection means the handler is missing. Nothing to show.
        }
    }

    // Draws the current segments on the progress bar. Cheap when nothing changed, since timeupdate calls it often.
    renderOverlay() {
        if (!this.#segments.length) {
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
            ...this.#segments.flatMap((segment) => {
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

    // Shows the skip button while playback is inside a segment and hides it otherwise.
    updateSkipButton() {
        const video = getMainVideo();
        // During an ad the video element plays the ad, so its time says nothing about the segments.
        const inAd = findFirstVisible(this.#adShowingSelectors) !== null;
        this.#skipSegment = video && !inAd ? segmentAt(this.#segments, video.currentTime) : null;
        const host = this.#skipSegment ? findFirstVisible(this.#skipButtonHostSelectors) : null;
        if (!host) {
            this.#skipButton?.remove();
            return;
        }
        this.#skipButton ??= this.createSkipButton();
        if (this.#skipButton.parentElement !== host) host.append(this.#skipButton);
    }

    createSkipButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = SKIP_BUTTON_CLASS;
        // Fixed literal, never page data. The icon matches YouTube's "next" glyph: a triangle and a bar.
        button.innerHTML =
            'Skip sponsored content <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="vertical-align:-1px"><path d="M1 1l7 5-7 5z M9 1h2v10H9z" fill="currentColor"/></svg>';
        // Keep the tap from also reaching the player, which would toggle YouTube's controls.
        button.addEventListener('pointerdown', (e) => e.stopPropagation());
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const video = getMainVideo();
            if (video && this.#skipSegment) video.currentTime = this.#skipSegment.end;
            this.#skipButton?.remove();
        });
        return button;
    }
}

export default SponsorBlock;
