/**
 * @typedef {import('../../types/new-tab.js').Suggestion} Suggestion
 */

/**
 * @typedef {(
 *  | { kind: 'searchDuckDuckGo' }
 *  | { kind: 'duckDuckGo' }
 *  | { kind: 'visit', url: string }
 *  | { kind: 'raw', text: string }
 *  | null
 * )} Suffix
 */

/**
 * @param {string} term
 * @param {Suggestion|null} selectedSuggestion
 * @returns {Suffix}
 */
export function getInputSuffix(term, selectedSuggestion) {
    if (!term) {
        return null;
    }

    if (selectedSuggestion) {
        return getSuggestionInputSuffix(selectedSuggestion, term);
    }

    if (isURLish(term)) {
        const url = parseURL(term);
        if (!url) throw new Error('isURLish returned true but parseURL failed');
        return { kind: 'visit', url: formatURL(url, { scheme: false, trailingSlash: false, search: false, hash: false }) };
    } else {
        return { kind: 'searchDuckDuckGo' };
    }
}

/**
 * @param {Suggestion} suggestion
 * @param {string} term
 * @returns {Suffix}
 */
function getSuggestionInputSuffix(suggestion, term) {
    switch (suggestion.kind) {
        case 'phrase':
            return { kind: 'searchDuckDuckGo' };
        case 'website': {
            const url = parseURL(suggestion.url);
            if (!url) return null;
            return { kind: 'visit', url: formatURL(url, { scheme: false, trailingSlash: false, search: false, hash: false }) };
        }
        case 'bookmark':
        case 'historyEntry':
        case 'internalPage': {
            const title = getSuggestionTitle(suggestion, term);
            const autocompletion = getSuggestionCompletionString(suggestion, term);
            const url = parseURL(suggestion.url);
            if (title && title !== autocompletion) {
                return { kind: 'raw', text: title };
            } else if (url) {
                return { kind: 'visit', url: formatURL(url, { scheme: false, trailingSlash: false, search: false, hash: false }) };
            } else {
                return null;
            }
        }
        case 'openTab':
            return { kind: 'duckDuckGo' };
    }
}

/**
 * @param {Suggestion} suggestion
 * @param {string} term
 * @returns {string}
 */
export function getSuggestionTitle(suggestion, term) {
    switch (suggestion.kind) {
        case 'phrase':
            return suggestion.phrase;
        case 'website': {
            const url = parseURL(suggestion.url);
            if (url) {
                return formatURLForTerm(url, term);
            } else {
                return '';
            }
        }
        case 'historyEntry': {
            const url = parseURL(suggestion.url);
            const searchQuery = url ? getDuckDuckGoSearchQuery(url) : '';
            if (searchQuery) {
                return searchQuery;
            } else if (suggestion.title) {
                return suggestion.title;
            } else if (url) {
                return formatURLForTerm(url, term);
            } else {
                return '';
            }
        }
        case 'bookmark':
        case 'internalPage':
        case 'openTab':
            return suggestion.title;
    }
}

/**
 * @param {Suggestion} suggestion
 * @param {string} term
 * @returns {string}
 */
export function getSuggestionCompletionString(suggestion, term) {
    switch (suggestion.kind) {
        case 'historyEntry':
        case 'bookmark':
        case 'internalPage': {
            const url = parseURL(suggestion.url);
            const urlString = url ? formatURLForTerm(url, term) : '';
            if (startsWithIgnoreCase(urlString, term)) {
                return urlString;
            } else {
                return getSuggestionTitle(suggestion, term);
            }
        }
        default:
            return getSuggestionTitle(suggestion, term);
    }
}

/**
 *
 * @param {Suggestion} suggestion
 * @returns {Suffix}
 */
export function getSuggestionSuffix(suggestion) {
    switch (suggestion.kind) {
        case 'website':
        case 'phrase':
            return null;
        case 'openTab':
            // @todo: openTab suggestions don't have a url property, so not sure how to handle this
            // In the macoS app, we return 'DuckDuckGo' for duck:// tabs, 'DuckDuckGo Search' for search tabs, and the URL for other tabs.
            return null;
        case 'historyEntry':
        case 'bookmark': {
            const url = parseURL(suggestion.url);
            if (!url) return null;
            return { kind: 'raw', text: formatURL(url, { scheme: false, www: false, trailingSlash: false }) };
        }
        case 'internalPage':
            return { kind: 'duckDuckGo' };
    }
}

/**
 * @param {string} string
 * @returns {URL|null}
 */
export function parseURL(string) {
    try {
        return new URL(string);
    } catch {}
    try {
        return new URL(`https://${string}`);
    } catch {}
    return null;
}

/**
 * @param {string} string
 * @returns {boolean}
 */
export function isURLish(string) {
    // @todo: This is overly simplistic.
    return string.includes('.') && parseURL(string) !== null;
}

/**
 * @param {URL} url
 * @param {object} [options]
 * @param {boolean} [options.scheme=true]
 * @param {boolean} [options.www=true]
 * @param {boolean} [options.trailingSlash=true]
 * @param {boolean} [options.search=true]
 * @param {boolean} [options.hash=true]
 * @returns {string}
 */
export function formatURL(url, { scheme = true, www = true, trailingSlash = true, search = true, hash = true } = {}) {
    let result = '';
    if (scheme) {
        result += `${url.protocol}//`;
    }
    if (!www && startsWithIgnoreCase(url.host, 'www.')) {
        result += url.host.slice(4);
    } else {
        result += url.host;
    }
    if (!trailingSlash && url.pathname.endsWith('/')) {
        result += url.pathname.slice(0, -1);
    } else {
        result += url.pathname;
    }
    if (search) {
        result += url.search;
    }
    if (hash) {
        result += url.hash;
    }
    return result;
}

/**
 * @param {URL} url
 * @param {string} term
 */
export function formatURLForTerm(url, term) {
    const scheme = `${url.protocol}//`;
    const isTypingScheme = startsWithIgnoreCase(scheme, term) || startsWithIgnoreCase(term, scheme);
    const termWithoutScheme = startsWithIgnoreCase(term, scheme) ? term.slice(scheme.length) : term;
    const isTypingWww = startsWithIgnoreCase('www.', termWithoutScheme) || startsWithIgnoreCase(termWithoutScheme, 'www.');
    const isTypingHost = startsWithIgnoreCase(url.host, term) || startsWithIgnoreCase(term, url.host);
    return formatURL(url, {
        scheme: term !== '' && isTypingScheme && !isTypingHost,
        www: termWithoutScheme !== '' && isTypingWww,
        trailingSlash: termWithoutScheme.endsWith('/'),
    });
}

/**
 * @param {URL} url
 * @returns {string}
 */
export function getDuckDuckGoSearchQuery(url) {
    const isDuckDuckGoSearch = url.hostname === 'duckduckgo.com' && (url.pathname === '/' || !url.pathname) && url.searchParams.has('q');
    return isDuckDuckGoSearch ? (url.searchParams.get('q') ?? '') : '';
}

/**
 * @param {string} string
 * @param {string} searchString
 * @returns {boolean}
 */
export function startsWithIgnoreCase(string, searchString) {
    return string.toLowerCase().startsWith(searchString.toLowerCase());
}
