import { isValidSelector } from '../../utils.js';

/** @typedef {import('../../types/sponsor-block.js').Segment} Segment */

// Pure helpers, kept apart from the feature so the unit tests can load them: the feature imports SVG assets, which
// plain Node can't.

/**
 * youtube.com, youtube-nocookie.com (Duck Player's embed) and their subdomains.
 * @param {string} hostname
 */
export function isYouTubeHost(hostname) {
    return ['youtube.com', 'youtube-nocookie.com'].some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/**
 * @param {string} origin
 */
export function isNoCookieOrigin(origin) {
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
 * The selector list from a privacy-config setting, without malformed entries, or `defaults` when the setting is not a
 * list. An empty list is kept: config can turn off every selector.
 * @param {unknown} setting
 * @param {string[]} defaults
 * @returns {string[]}
 */
export function validSelectors(setting, defaults) {
    if (!Array.isArray(setting)) return defaults;
    return setting.filter((s) => typeof s === 'string' && isValidSelector(s));
}
