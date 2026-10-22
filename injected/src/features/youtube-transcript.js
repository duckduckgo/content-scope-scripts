/**
 * @file Fetches the transcript of the YouTube video on the current watch page, the same way
 * YouTube's own "Show transcript" panel does.
 */

const EXPANDED = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
const HIDDEN = 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN';
const TRANSCRIPT_PANEL = 'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]';
const MAX_SEARCH_DEPTH = 40;
const LINE_GROUP_MS = 20000;

/**
 * @typedef {{ startMs: number, text: string }} TranscriptSegment
 */

/**
 * @param {Location} location
 * @returns {string | null}
 */
export function youTubeVideoId(location) {
    if (!/(^|\.)youtube\.com$/.test(location.hostname) || location.pathname !== '/watch') return null;
    return new URLSearchParams(location.search).get('v');
}

/**
 * @param {unknown} node
 * @param {string} key
 * @param {number} [depth]
 * @returns {unknown}
 */
function findKey(node, key, depth = 0) {
    if (!node || typeof node !== 'object' || depth > MAX_SEARCH_DEPTH) return undefined;
    const record = /** @type {Record<string, unknown>} */ (node);
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
    for (const value of Object.values(record)) {
        const found = findKey(value, key, depth + 1);
        if (found !== undefined) return found;
    }
    return undefined;
}

/**
 * @param {unknown} node
 * @param {string} key
 * @param {unknown[]} out
 * @param {number} [depth]
 */
function collectKey(node, key, out, depth = 0) {
    if (!node || typeof node !== 'object' || depth > MAX_SEARCH_DEPTH) return;
    const record = /** @type {Record<string, unknown>} */ (node);
    for (const [k, value] of Object.entries(record)) {
        if (k === key) out.push(value);
        else collectKey(value, key, out, depth + 1);
    }
}

/**
 * @param {unknown} value - a YouTube text object: `{ simpleText }` or `{ runs: [{ text }] }`
 * @returns {string}
 */
function textOf(value) {
    if (!value || typeof value !== 'object') return '';
    const record = /** @type {{ simpleText?: unknown, runs?: unknown }} */ (value);
    if (typeof record.simpleText === 'string') return record.simpleText;
    if (Array.isArray(record.runs)) return record.runs.map((run) => (typeof run?.text === 'string' ? run.text : '')).join('');
    return '';
}

/**
 * @param {unknown} response - a `youtubei/v1/get_transcript` response
 * @returns {TranscriptSegment[]}
 */
export function parseTranscriptResponse(response) {
    /** @type {unknown[]} */
    const renderers = [];
    collectKey(response, 'transcriptSegmentRenderer', renderers);
    return renderers.flatMap((renderer) => {
        if (!renderer || typeof renderer !== 'object') return [];
        const record = /** @type {{ startMs?: unknown, snippet?: unknown }} */ (renderer);
        const text = textOf(record.snippet).replace(/\s+/g, ' ').trim();
        const startMs = Number(record.startMs);
        return text && Number.isFinite(startMs) ? [{ startMs, text }] : [];
    });
}

/**
 * @param {string} timestamp - such as 12:34 or 1:02:03
 * @returns {number | null}
 */
function parseTimestamp(timestamp) {
    const parts = timestamp.split(':').map(Number);
    if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return parts.reduce((total, n) => total * 60 + n, 0) * 1000;
}

/**
 * Reads segments from the transcript panel's rendered text, which alternates timestamp and text
 * lines in both the old and the redesigned panel.
 * @param {string} panelText
 * @returns {TranscriptSegment[]}
 */
export function parseTranscriptPanelText(panelText) {
    /** @type {TranscriptSegment[]} */
    const segments = [];
    const lines = panelText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i] ?? '';
        if (!/^\d{1,2}(:\d{2}){1,2}$/.test(line)) continue;
        const startMs = parseTimestamp(line);
        const text = lines[i + 1] ?? '';
        if (startMs === null || /^\d{1,2}(:\d{2}){1,2}$/.test(text)) continue;
        segments.push({ startMs, text });
        i++;
    }
    return segments;
}

/**
 * @param {number} ms
 */
function formatTimestamp(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h ? `[${h}:${String(m).padStart(2, '0')}:${s}]` : `[${m}:${s}]`;
}

/**
 * Joins segments into one line per ~20 seconds so the text stays readable and every line keeps a
 * timestamp to jump to.
 * @param {TranscriptSegment[]} segments
 * @returns {string}
 */
export function formatTranscript(segments) {
    /** @type {string[]} */
    const lines = [];
    let lineStart = -Infinity;
    for (const segment of segments) {
        if (segment.startMs - lineStart >= LINE_GROUP_MS || lines.length === 0) {
            lineStart = segment.startMs;
            lines.push(`${formatTimestamp(segment.startMs)} ${segment.text}`);
        } else {
            lines[lines.length - 1] += ` ${segment.text}`;
        }
    }
    return lines.join('\n');
}

/**
 * @param {number} ms
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @typedef {{ get: (key: string) => unknown }} YtConfig
 */

/**
 * @param {YtConfig} ytcfg
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {AbortSignal} signal
 * @returns {Promise<unknown>}
 */
async function postInnertube(ytcfg, path, body, signal) {
    const key = ytcfg.get('INNERTUBE_API_KEY');
    const url = `/youtubei/v1/${path}?prettyPrint=false${typeof key === 'string' ? `&key=${encodeURIComponent(key)}` : ''}`;
    /** @type {Record<string, string>} */
    const headers = { 'content-type': 'application/json' };
    const clientName = ytcfg.get('INNERTUBE_CONTEXT_CLIENT_NAME');
    const clientVersion = ytcfg.get('INNERTUBE_CLIENT_VERSION');
    if (clientName != null) headers['x-youtube-client-name'] = String(clientName);
    if (clientVersion != null) headers['x-youtube-client-version'] = String(clientVersion);
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({ context: ytcfg.get('INNERTUBE_CONTEXT'), ...body }),
        signal,
    });
    return response.ok ? response.json() : null;
}

/**
 * Approach 1: the endpoint the transcript panel calls. Only works where the page's own globals
 * are reachable, i.e. when running in the page's main world.
 * @param {string} videoId
 * @param {AbortSignal} signal
 * @returns {Promise<TranscriptSegment[]>}
 */
async function fetchTranscriptFromApi(videoId, signal) {
    const pageWindow = /** @type {{ ytcfg?: YtConfig, ytInitialData?: unknown }} */ (/** @type {unknown} */ (window));
    const ytcfg = pageWindow.ytcfg;
    if (typeof ytcfg?.get !== 'function') return [];
    let watchData = pageWindow.ytInitialData;
    const initialVideoId = /** @type {{ watchEndpoint?: { videoId?: unknown } } | undefined} */ (findKey(watchData, 'currentVideoEndpoint'))
        ?.watchEndpoint?.videoId;
    // ytInitialData describes the first video loaded; after in-app navigation, ask for the current one.
    if (initialVideoId !== videoId) {
        watchData = await postInnertube(ytcfg, 'next', { videoId }, signal);
    }
    const endpoint = /** @type {{ params?: unknown } | undefined} */ (findKey(watchData, 'getTranscriptEndpoint'));
    if (typeof endpoint?.params !== 'string') return [];
    return parseTranscriptResponse(await postInnertube(ytcfg, 'get_transcript', { params: endpoint.params }, signal));
}

/**
 * Approach 2: open the transcript panel out of sight, read it, and put it back the way it was.
 * @param {number} timeoutMs
 * @returns {Promise<TranscriptSegment[]>}
 */
async function scrapeTranscriptPanel(timeoutMs) {
    const panel = document.querySelector(TRANSCRIPT_PANEL);
    if (!(panel instanceof HTMLElement)) return [];
    const wasOpen = panel.getAttribute('visibility') === EXPANDED;
    const previousStyle = panel.getAttribute('style');
    if (!wasOpen) {
        // Kept in the layout (not moved offscreen) so YouTube still loads it, just invisible.
        panel.style.setProperty('opacity', '0');
        panel.style.setProperty('pointer-events', 'none');
        // The description's "Show transcript" button makes YouTube load the transcript; flipping the
        // panel's visibility attribute alone only shows it.
        const showButton = document.querySelector('ytd-video-description-transcript-section-renderer button');
        if (showButton instanceof HTMLElement) showButton.click();
        else panel.setAttribute('visibility', EXPANDED);
    }
    try {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const segments = parseTranscriptPanelText(panel.innerText);
            if (segments.length) return segments;
            await delay(250);
        }
        return [];
    } finally {
        if (!wasOpen) {
            panel.setAttribute('visibility', HIDDEN);
            if (previousStyle === null) panel.removeAttribute('style');
            else panel.setAttribute('style', previousStyle);
        }
    }
}

/**
 * @param {string} videoId
 * @param {{ timeoutMs?: number, log?: { info: (...args: unknown[]) => void } }} [options]
 * @returns {Promise<string | null>} the formatted transcript, or null when the video has none or YouTube refused
 */
export async function fetchYouTubeTranscript(videoId, { timeoutMs = 8000, log } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let segments = /** @type {TranscriptSegment[]} */ ([]);
    try {
        segments = await fetchTranscriptFromApi(videoId, controller.signal);
    } catch (e) {
        log?.info('YouTube transcript request failed', e);
    } finally {
        clearTimeout(timer);
    }
    if (!segments.length && youTubeVideoId(window.location) === videoId) {
        log?.info('Falling back to the transcript panel');
        segments = await scrapeTranscriptPanel(timeoutMs);
    }
    return segments.length ? formatTranscript(segments) : null;
}
