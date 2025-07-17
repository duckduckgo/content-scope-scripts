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
        return { kind: 'visit', url: formatURL(url, { protocol: false, trailingSlash: false, search: false, hash: false }) };
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
            return { kind: 'visit', url: formatURL(url, { protocol: false, trailingSlash: false, search: false, hash: false }) };
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
                return { kind: 'visit', url: formatURL(url, { protocol: false, trailingSlash: false, search: false, hash: false }) };
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
            if (!url) return '';
            return formatURLForTerm(url, term);
        }
        case 'historyEntry': {
            const url = parseURL(suggestion.url);
            if (!url) return '';
            const searchQuery = getDuckDuckGoSearchQuery(url);
            if (searchQuery) {
                return searchQuery;
            } else {
                return suggestion.title || formatURLForTerm(url, term);
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
        case 'bookmark': {
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
 * @param {string} term
 * @returns {Suffix}
 */
export function getSuggestionSuffix(suggestion, term) {
    switch (suggestion.kind) {
        case 'website': {
            const url = parseURL(suggestion.url);
            if (!url) return null;
            const urlString = formatURLForTerm(url, term);
            const title = getSuggestionTitle(suggestion, term);
            if (urlString === title) return null;
            return { kind: 'raw', text: formatURL(url, { protocol: false, trailingSlash: false }) };
        }
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
            return { kind: 'raw', text: formatURL(url, { protocol: false, www: false, trailingSlash: false }) };
        }
        case 'internalPage':
            return { kind: 'duckDuckGo' };
    }
}

/**
 * @param {string} string
 * @returns {URL|null}
 */
function parseURL(string) {
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
function isURLish(string) {
    if (!parseURL(string)) return false;
    if (!string.includes('.')) return false;

    const hostnameRegex = /^(((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*[A-Za-z0-9-]{2,63})$/i;
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([a-fA-F0-9]{0,4}:){2,7}[a-fA-F0-9]{0,4}$/;
    const mathFormulaRegex = /^[\s$]*([\d]+(\.[\d]+)?|\.[\d]+)([\s]*[+\-*/][\s]*([\d]+(\.[\d]+)?|\.[\d]+))*[\s$]*$/;

    const isValidHostname = hostnameRegex.test(string);
    const isValidIp = ipv4Regex.test(string) || ipv6Regex.test(string);
    const isMathFormula = mathFormulaRegex.test(string);

    return (isValidHostname || isValidIp) && !isMathFormula;
}

/**
 * @param {URL} url
 * @param {object} options
 * @param {boolean} [options.protocol=true]
 * @param {boolean} [options.www=true]
 * @param {boolean} [options.trailingSlash=true]
 * @param {boolean} [options.search=true]
 * @param {boolean} [options.hash=true]
 * @returns {string}
 */
function formatURL(url, options = { protocol: true, www: true, trailingSlash: true, search: true, hash: true }) {
    let result = '';
    if (options.protocol) {
        result += `${url.protocol}://`;
    }
    if (options.www || !url.host.startsWith('www.')) {
        result += sliceAfterIgnoreCase(url.host, 'www.');
    } else {
        result += url.host;
    }
    if (!options.trailingSlash && url.pathname.endsWith('/')) {
        result += url.pathname.slice(0, -1);
    } else {
        result += url.pathname;
    }
    if (options.search) {
        result += url.search;
    }
    if (options.hash) {
        result += url.hash;
    }
    return result;
}

/**
 * @param {URL} url
 * @param {string} term
 */
function formatURLForTerm(url, term) {
    const isTypingProtocol = startsWithIgnoreCase(url.protocol, term);
    const isTypingWww = startsWithIgnoreCase('www.', sliceAfterIgnoreCase(term, url.protocol));
    const isTypingHost = startsWithIgnoreCase(url.host, term);
    return formatURL(url, {
        protocol: term !== '' && isTypingProtocol && !isTypingHost,
        www: sliceAfterIgnoreCase(term, url.protocol) !== '' && isTypingWww,
        trailingSlash: !term.endsWith('/'),
    });
}

/**
 * @param {URL} url
 * @returns {string}
 */
function getDuckDuckGoSearchQuery(url) {
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

/**
 * @param {string} string
 * @param {string} searchString
 * @returns {string}
 */
export function sliceAfterIgnoreCase(string, searchString) {
    if (startsWithIgnoreCase(string, searchString)) {
        return string.slice(searchString.length);
    }
    return string;
}
