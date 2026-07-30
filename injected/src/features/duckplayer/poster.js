/**
 * @module Duck Player poster painting
 *
 * Painting a YouTube thumbnail as an element's background, given candidates that may not
 * resolve to a real image.
 */

/**
 * Paint the first candidate that resolves to a displayable image as `target`'s background,
 * skipping any that do not. A `verify` candidate is HEAD-checked first, because YouTube
 * answers a thumbnail a video does not have with a valid placeholder image under a 404,
 * so its load event alone cannot tell the difference.
 * @param {HTMLElement} target
 * @param {{url: string, verify: boolean}[]} candidates - tried in order
 * @param {{signal?: AbortSignal, onResult?: (paintedUrl: string | null) => void}} [options]
 * @returns {Promise<void>}
 */
export async function paintFirstUsablePoster(target, candidates, { signal, onResult } = {}) {
    for (const candidate of candidates) {
        const url = safePosterUrl(candidate.url);
        if (!url) continue;
        if (candidate.verify && !(await headIsOk(url, signal))) continue;
        if (signal?.aborted) return;
        if (!(await imageLoads(url))) continue;
        if (signal?.aborted) return;

        target.style.backgroundImage = `url("${url}")`;
        target.style.backgroundSize = 'cover';
        return onResult?.(url);
    }
    if (!signal?.aborted) onResult?.(null);
}

/**
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<boolean>}
 */
async function headIsOk(url, signal) {
    try {
        return (await fetch(url, { method: 'HEAD', signal })).ok;
    } catch {
        return false;
    }
}

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
function imageLoads(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * Normalise a poster URL and reject anything that cannot be trusted inside the CSS url()
 * it is interpolated into; a candidate can be scraped from a computed style, so it is
 * page-controlled text. https: only, because new URL() percent-encodes the closing quote
 * for hierarchical schemes alone: a data: payload carries a quote through verbatim.
 * @param {string} url
 * @returns {string | null}
 */
function safePosterUrl(url) {
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol !== 'https:') return null;
        return parsed.href;
    } catch {
        return null;
    }
}

/**
 * Paint a single thumbnail, recording the outcome on `parent` for the overlay's own styling.
 * @param {HTMLElement} parent
 * @param {string} targetSelector
 * @param {string} imageUrl
 */
export function appendImageAsBackground(parent, targetSelector, imageUrl) {
    const target = parent.querySelector(targetSelector);
    if (!(target instanceof HTMLElement)) {
        return console.warn('could not find child with selector', targetSelector, 'from', parent);
    }
    void paintFirstUsablePoster(target, [{ url: imageUrl, verify: true }], {
        onResult: (paintedUrl) => {
            parent.dataset.thumbLoaded = String(Boolean(paintedUrl));
            if (paintedUrl) parent.dataset.thumbSrc = paintedUrl;
            else parent.dataset.error = String(true);
        },
    });
}
