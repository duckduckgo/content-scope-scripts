/**
 * @typedef {import('../../types/new-tab.js').Suggestion} Suggestion
 */

/**
 * @param {Suggestion} suggestion
 * @returns {string}
 */
export function getSuggestionTitle(suggestion) {
    switch (suggestion.kind) {
        case 'bookmark':
        case 'historyEntry':
        case 'internalPage':
            return suggestion.title || getDisplayURL(suggestion.url);
        case 'phrase':
            return suggestion.phrase;
        case 'openTab':
            return suggestion.title;
        case 'website':
            return getDisplayURL(suggestion.url);
        default:
            throw new Error('Unknown suggestion kind');
    }
}

/**
 * @param {string} url
 * @returns {string}
 */
function getDisplayURL(url) {
    const { host, pathname, search, hash } = new URL(url);
    return host + pathname + search + hash;
}
