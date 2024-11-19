// Constant array of colors for empty favicon backgrounds
const EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES = [
    '#94B3AF',
    '#727998',
    '#645468',
    '#4D5F7F',
    '#855DB6',
    '#5E5ADB',
    '#678FFF',
    '#6BB4EF',
    '#4A9BAE',
    '#66C4C6',
    '#55D388',
    '#99DB7A',
    '#ECCC7B',
    '#E7A538',
    '#DD6B4C',
    '#D65D62',
];

/**
 * Converts a URL to a color from the predefined array
 * @param {string} url
 */
export function urlToColor(url) {
    const host = getHost(url);
    const index = Math.abs(getDJBHash(host) % EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES.length);
    return EMPTY_FAVICON_TEXT_BACKGROUND_COLOR_BRUSHES[index];
}

/**
 * DJB hashing algorithm to get a consistent color index from URL host
 * @param {string} str
 */
function getDJBHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return hash;
}

/**
 * Extracts the host part of the URL
 * @param {string} url
 * @return {string}
 */
function getHost(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
        return '?';
    }
}
