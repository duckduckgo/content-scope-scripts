import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    getInputSuffix,
    getSuggestionTitle,
    getSuggestionCompletionString,
    getSuggestionSuffix,
    parseURL,
    isURLish,
    formatURL,
    formatURLForTerm,
    getDuckDuckGoSearchQuery,
    startsWithIgnoreCase,
} from '../utils.js';

/**
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 */

test.describe('getInputSuffix', () => {
    test('returns null for empty term', () => {
        equal(getInputSuffix('', null), null);
    });

    test('returns null when there is no selected suggestion', () => {
        equal(getInputSuffix('pizza', null), null);
    });

    test('returns "Search DuckDuckGo" if selected suggestion is a phrase', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'phrase', phrase: 'pizza recipe' };
        const suffix = getInputSuffix('pizza', suggestion);
        equal(suffix?.kind, 'searchDuckDuckGo');
    });

    test('returns "Visit $url" if selected suggestion is a website', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'website', url: 'https://www.example.com/foo/bar' };
        const suffix = getInputSuffix('foo', suggestion);
        equal(suffix?.kind, 'visit');
        equal(suffix?.url, 'www.example.com/foo/bar');
    });

    test('returns title if it is different to completion (bookmark)', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'bookmark',
            title: 'Worlds Greatest Pizza',
            url: 'https://pizza.com/page',
            isFavorite: true,
            score: 100,
        };
        const suffix = getInputSuffix('pizza.com', suggestion);
        equal(suffix?.kind, 'raw');
        equal(suffix?.text, 'Worlds Greatest Pizza');
    });

    test('returns "Visit $url" if title matches completion (bookmark)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Worlds Greatest Pizza', url: 'https://pizza.com/page', isFavorite: true, score: 99 };
        const suffix = getInputSuffix('world ', suggestion);
        equal(suffix?.kind, 'visit');
        equal(suffix?.url, 'pizza.com/page');
    });

    test('returns title if it is different to completion (historyEntry)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'Worlds Greatest Pizza', url: 'https://pizza.com/history', score: 95 };
        const suffix = getInputSuffix('pizza.com', suggestion);
        equal(suffix?.kind, 'raw');
        equal(suffix?.text, 'Worlds Greatest Pizza');
    });

    test('returns "Visit $url" if title matches completion (historyEntry)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'Worlds Greatest Pizza', url: 'https://pizza.com/history', score: 95 };
        const suffix = getInputSuffix('world ', suggestion);
        equal(suffix?.kind, 'visit');
        equal(suffix?.url, 'pizza.com/history');
    });

    test('returns title if it is different to completion (internalPage)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'DuckDuckGo Settings', url: 'duck://settings', score: 10 };
        const suffix = getInputSuffix('set', suggestion);
        equal(suffix?.kind, 'raw');
        equal(suffix?.text, 'DuckDuckGo Settings');
    });

    test('returns "Visit $url" if title matches completion (internalPage)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'DuckDuckGo Settings', url: 'duck://settings', score: 10 };
        const suffix = getInputSuffix('DuckD', suggestion);
        equal(suffix?.kind, 'visit');
        equal(suffix?.url, 'settings');
    });

    test('returns DuckDuckGo if selected suggestion is an open tab', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'openTab', title: 'Pizza Tab', tabId: 'tab-33', score: 33 };
        const suffix = getInputSuffix('pizza', suggestion);
        equal(suffix?.kind, 'duckDuckGo');
    });
});

test.describe('getSuggestionTitle', () => {
    test('returns phrase for phrase', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'phrase', phrase: 'pizza near me' };
        equal(getSuggestionTitle(suggestion, ''), 'pizza near me');
        equal(getSuggestionTitle(suggestion, 'pizza'), 'pizza near me');
    });

    test('returns formatted url for website', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'website', url: 'https://www.example.com/path' };
        equal(getSuggestionTitle(suggestion, ''), 'example.com/path');
        equal(getSuggestionTitle(suggestion, 'examp'), 'example.com/path');
        equal(getSuggestionTitle(suggestion, 'www.examp'), 'www.example.com/path');
    });

    test('returns empty string for website with invalid url', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'website', url: 'not a real url' };
        equal(getSuggestionTitle(suggestion, ''), '');
    });

    test('returns search query for a DuckDuckGo search history entry', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'historyEntry',
            title: 'Best Pizza',
            url: 'https://duckduckgo.com/?q=secret+pizza',
            score: 85,
        };
        equal(getSuggestionTitle(suggestion, ''), 'secret pizza');
    });

    test('returns title for a history entry', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'historyEntry',
            title: 'Italian Pizza History',
            url: 'https://example.com/search?q=Italian%20Pizza%20History',
            score: 78,
        };
        equal(getSuggestionTitle(suggestion, ''), 'Italian Pizza History');
    });

    test('returns formatted url for a history entry if there is no title', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'historyEntry',
            title: '',
            url: 'https://www.example.com/search?q=Pizza%20Dough%20Calculator',
            score: 74,
        };
        equal(getSuggestionTitle(suggestion, ''), 'example.com/search?q=Pizza%20Dough%20Calculator');
        equal(getSuggestionTitle(suggestion, 'examp'), 'example.com/search?q=Pizza%20Dough%20Calculator');
        equal(getSuggestionTitle(suggestion, 'www.examp'), 'www.example.com/search?q=Pizza%20Dough%20Calculator');
    });

    test('returns empty string for a history entry if there is no title and url is invalid', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'historyEntry',
            title: '',
            url: 'not a url',
            score: 59,
        };
        equal(getSuggestionTitle(suggestion, ''), '');
    });

    test('returns title for a bookmark', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Pizza Hut', url: 'https://pizzahut.com', isFavorite: false, score: 98 };
        equal(getSuggestionTitle(suggestion, ''), 'Pizza Hut');
    });

    test('returns title for an internal page', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'DuckDuckGo Settings', url: 'duck://settings', score: 3 };
        equal(getSuggestionTitle(suggestion, ''), 'DuckDuckGo Settings');
    });

    test('returns title for an open tab', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'openTab', title: 'Pizza vs Tacos', tabId: 'tab-38', score: 20 };
        equal(getSuggestionTitle(suggestion, ''), 'Pizza vs Tacos');
    });
});

test.describe('getSuggestionCompletionString', () => {
    test('returns url string if url matches prefix of term (historyEntry)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'My Pizza', url: 'https://pizza.com/menu', score: 76 };
        equal(getSuggestionCompletionString(suggestion, 'pizza.com'), 'pizza.com/menu');
        equal(getSuggestionCompletionString(suggestion, 'pizza.com/menu'), 'pizza.com/menu');
        equal(getSuggestionCompletionString(suggestion, 'pizza'), 'pizza.com/menu');
        equal(getSuggestionCompletionString(suggestion, 'PiZz'), 'pizza.com/menu'); // case insensitive
    });

    test('returns title if url does not match prefix of term (historyEntry)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'My Pizza', url: 'https://pizza.com/menu', score: 76 };
        equal(getSuggestionCompletionString(suggestion, 'my'), 'My Pizza');
        equal(getSuggestionCompletionString(suggestion, 'my pi'), 'My Pizza');
        equal(getSuggestionCompletionString(suggestion, 'hot dog'), 'My Pizza');
    });

    test('returns title if there is no url (historyEntry)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'My Pizza', url: '', score: 76 };
        equal(getSuggestionCompletionString(suggestion, 'pizza.com'), 'My Pizza');
        equal(getSuggestionCompletionString(suggestion, 'my'), 'My Pizza');
    });

    test('returns url string if url matches prefix of term (bookmark)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Pizza Hot', url: 'https://pizza.com/order', isFavorite: false, score: 95 };
        equal(getSuggestionCompletionString(suggestion, 'pizza.com'), 'pizza.com/order');
        equal(getSuggestionCompletionString(suggestion, 'pizza.com/order'), 'pizza.com/order');
        equal(getSuggestionCompletionString(suggestion, 'pizza'), 'pizza.com/order');
        equal(getSuggestionCompletionString(suggestion, 'PiZz'), 'pizza.com/order'); // case insensitive
    });

    test('returns title if url does not match prefix of term (bookmark)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Pizza Hot', url: 'https://pizza.com/order', isFavorite: false, score: 95 };
        equal(getSuggestionCompletionString(suggestion, 'my'), 'Pizza Hot');
        equal(getSuggestionCompletionString(suggestion, 'my pi'), 'Pizza Hot');
        equal(getSuggestionCompletionString(suggestion, 'hot dog'), 'Pizza Hot');
    });

    test('returns title if there is no url (bookmark)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Pizza Place', url: '', isFavorite: false, score: 77 };
        equal(getSuggestionCompletionString(suggestion, 'pizza.com'), 'Pizza Place');
        equal(getSuggestionCompletionString(suggestion, 'my'), 'Pizza Place');
    });

    test('returns url string if url matches prefix of term (internalPage)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'Settings', url: 'duck://settings', score: 19 };
        equal(getSuggestionCompletionString(suggestion, 'settings'), 'settings');
        equal(getSuggestionCompletionString(suggestion, 'set'), 'settings');
        equal(getSuggestionCompletionString(suggestion, 'Sett'), 'settings'); // case insensitive
    });

    test('returns title if url does not match prefix of term (internalPage)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'DuckDuckGo Settings', url: 'duck://settings', score: 10 };
        equal(getSuggestionCompletionString(suggestion, 'my setting'), 'DuckDuckGo Settings');
        equal(getSuggestionCompletionString(suggestion, 'abc'), 'DuckDuckGo Settings');
        equal(getSuggestionCompletionString(suggestion, 'search'), 'DuckDuckGo Settings');
    });

    test('returns title if there is no url (internalPage)', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'About Page', url: '', score: 17 };
        equal(getSuggestionCompletionString(suggestion, 'about'), 'About Page');
        equal(getSuggestionCompletionString(suggestion, 'info'), 'About Page');
    });

    test('returns phrase for phrase', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'phrase', phrase: 'pizza near me' };
        equal(getSuggestionCompletionString(suggestion, 'pizza'), 'pizza near me');
    });

    test('returns url for website', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'website', url: 'https://example.com/' };
        equal(getSuggestionCompletionString(suggestion, 'exam'), 'example.com');
    });

    test('returns title for openTab', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'openTab', title: 'Pizza Desktop', tabId: 'tab-5', score: 55 };
        equal(getSuggestionCompletionString(suggestion, 'pizza'), 'Pizza Desktop');
    });
});

test.describe('getSuggestionSuffix', () => {
    test('returns null for websites, phrases and open tabs', () => {
        /** @type {Suggestion} */
        const websiteSuggestion = { kind: 'website', url: 'https://pizzaexpress.com/' };
        /** @type {Suggestion} */
        const phraseSuggestion = { kind: 'phrase', phrase: 'pizza near me' };
        /** @type {Suggestion} */
        const openTabSuggestion = { kind: 'openTab', title: 'Pizza Tab', tabId: 'tab-123', score: 45 };

        equal(getSuggestionSuffix(websiteSuggestion), null);
        equal(getSuggestionSuffix(phraseSuggestion), null);
        equal(getSuggestionSuffix(openTabSuggestion), null);
    });

    test('returns formatted URL for history entries', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'History', url: 'https://www.pizza.com/page/', score: 83 };
        const suffix = getSuggestionSuffix(suggestion);
        equal(suffix?.kind, 'raw');
        equal(suffix?.text, 'pizza.com/page');
    });

    test('returns formatted URL for bookmarks', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'Dominos', url: 'https://www.dominos.com/', isFavorite: false, score: 94 };
        const suffix = getSuggestionSuffix(suggestion);
        equal(suffix?.kind, 'raw');
        equal(suffix?.text, 'dominos.com');
    });

    test('returns DuckDuckGo for internal pages', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'Settings', url: 'duck://settings', score: 2 };
        const suffix = getSuggestionSuffix(suggestion);
        equal(suffix?.kind, 'duckDuckGo');
    });

    test('returns null if url is invalid', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: 'broken', url: '?????', score: 74 };
        equal(getSuggestionSuffix(suggestion), null);
    });
});

test.describe('parseURL', () => {
    test('parses a valid url', () => {
        const url = parseURL('https://example.com/path');
        equal(url instanceof URL, true);
        equal(url?.hostname, 'example.com');
        equal(url?.protocol, 'https:');
    });

    test('parses a domain without scheme', () => {
        const url = parseURL('example.com');
        equal(url instanceof URL, true);
        equal(url?.hostname, 'example.com');
        equal(url?.protocol, 'https:');
    });

    test('returns null for invalid url', () => {
        const url = parseURL('?');
        equal(url, null);
    });
});

test.describe('isURLish', () => {
    test('returns true for simple domain with dot', () => {
        equal(isURLish('example.com'), true);
        equal(isURLish('foo.bar'), true);
        equal(isURLish('some.site'), true);
        equal(isURLish('my-site.org'), true);
    });

    test('returns true for full url', () => {
        equal(isURLish('https://example.com'), true);
        equal(isURLish('http://www.example.com'), true);
        equal(isURLish('ftp://files.example.com'), true);
    });

    test('returns true for domain with path/params/hash', () => {
        equal(isURLish('example.com/path'), true);
        equal(isURLish('example.com/index.html'), true);
        equal(isURLish('example.com?q=search'), true);
        equal(isURLish('example.com/path#hash'), true);
        equal(isURLish('example.com:8080'), true);
    });

    test('returns false for regular strings', () => {
        equal(isURLish('localhost'), false);
        equal(isURLish('duck'), false);
        equal(isURLish('what time is it'), false);
    });

    test('returns false for empty string', () => {
        equal(isURLish(''), false);
    });

    test('returns true for IP addresses', () => {
        equal(isURLish('127.0.0.1'), true);
        equal(isURLish('192.168.1.1'), true);
        equal(isURLish('8.8.8.8:53'), true);
    });

    test('returns true for URLs with subdomains', () => {
        equal(isURLish('www.example.com'), true);
        equal(isURLish('a.b.c.domain.co.uk'), true);
    });
});

test.describe('formatURL', () => {
    test('returns full URL by default (scheme, www, trailing slash, search, hash)', () => {
        const url = new URL('https://www.example.com/path/?q=123#myhash');
        equal(formatURL(url), 'https://www.example.com/path/?q=123#myhash');
    });

    test('omits scheme when options.scheme is false', () => {
        const url = new URL('https://www.example.com/path/');
        equal(formatURL(url, { scheme: false }), 'www.example.com/path/');
    });

    test('omits www when options.www is false', () => {
        const url = new URL('https://www.example.com/path/');
        equal(formatURL(url, { www: false }), 'https://example.com/path/');
    });

    test('does nothing when options.www is false and there is no www', () => {
        const url = new URL('https://example.com/path/');
        equal(formatURL(url, { www: false }), 'https://example.com/path/');
    });

    test('omits trailing slash when options.trailingSlash is false', () => {
        const url = new URL('https://www.example.com/path/');
        equal(formatURL(url, { trailingSlash: false }), 'https://www.example.com/path');
    });

    test('does nothing when options.trailingSlash is false and there is no trailing slash', () => {
        const url = new URL('https://www.example.com/path');
        equal(formatURL(url, { trailingSlash: false }), 'https://www.example.com/path');
    });

    test('omits search and hash when options.search and options.hash are false', () => {
        const url = new URL('https://example.com/path?foo=bar#section');
        equal(formatURL(url, { search: false, hash: false }), 'https://example.com/path');
    });

    test('combines all options to remove everything but host and path', () => {
        const url = new URL('https://www.example.com/foo/bar/?cat=d&b=2#hash');
        equal(
            formatURL(url, {
                scheme: false,
                www: false,
                trailingSlash: false,
                search: false,
                hash: false,
            }),
            'example.com/foo/bar',
        );
    });

    test('works with IPv4 addresses', () => {
        const url = new URL('http://127.0.0.1:8080/path/');
        equal(formatURL(url), 'http://127.0.0.1:8080/path/');
        equal(formatURL(url, { scheme: false, trailingSlash: false }), '127.0.0.1:8080/path');
    });

    test('works with IPv6 addresses', () => {
        const url = new URL('http://[::1]:8000/abc/');
        equal(formatURL(url), 'http://[::1]:8000/abc/');
        equal(formatURL(url, { scheme: false, trailingSlash: false }), '[::1]:8000/abc');
    });

    test('does not mutate original options object', () => {
        const url = new URL('https://www.example.com/path/?q=1#hash');
        const opts = { scheme: false, www: false, trailingSlash: false, search: false, hash: false };
        const formatted = formatURL(url, opts);
        equal(formatted, 'example.com/path');
        // original options unchanged
        equal(opts.scheme, false);
        equal(opts.www, false);
        equal(opts.trailingSlash, false);
        equal(opts.search, false);
        equal(opts.hash, false);
    });
});

test.describe('formatURLForTerm', () => {
    test('returns simple url when given an empty term', () => {
        const wwwUrl = new URL('https://www.example.com/path/');
        equal(formatURLForTerm(wwwUrl, ''), 'example.com/path');

        const noWwwUrl = new URL('https://example.com/path/');
        equal(formatURLForTerm(noWwwUrl, ''), 'example.com/path');
    });

    test('includes protocol when typing protocol', () => {
        const wwwUrl = new URL('https://www.example.com/path/');
        equal(formatURLForTerm(wwwUrl, 'htt'), 'https://example.com/path');
        equal(formatURLForTerm(wwwUrl, 'https://'), 'https://example.com/path');

        const noWwwUrl = new URL('https://example.com/path/');
        equal(formatURLForTerm(noWwwUrl, 'htt'), 'https://example.com/path');
        equal(formatURLForTerm(noWwwUrl, 'https://'), 'https://example.com/path');
    });

    test('includes www when typing www', () => {
        const wwwUrl = new URL('https://www.example.com/path/');
        equal(formatURLForTerm(wwwUrl, 'ww'), 'www.example.com/path');
        equal(formatURLForTerm(wwwUrl, 'www.'), 'www.example.com/path');

        const noWwwUrl = new URL('https://example.com/path/');
        equal(formatURLForTerm(noWwwUrl, 'ww'), 'example.com/path');
        equal(formatURLForTerm(noWwwUrl, 'www.'), 'example.com/path');
    });

    test('includes trailing slash when typing trailing slash', () => {
        const wwwUrl = new URL('https://www.example.com/path/');
        equal(formatURLForTerm(wwwUrl, 'www.example.com/path/'), 'www.example.com/path/');

        const noWwwUrl = new URL('https://example.com/path/');
        equal(formatURLForTerm(noWwwUrl, 'example.com/path/'), 'example.com/path/');
    });
});

test.describe('getDuckDuckGoSearchQuery', () => {
    test('returns search query for a valid DuckDuckGo search URL with pathname "/"', () => {
        const url = new URL('https://duckduckgo.com/?q=best+pizza');
        equal(getDuckDuckGoSearchQuery(url), 'best pizza');
    });

    test('returns empty string if q param is missing', () => {
        const url = new URL('https://duckduckgo.com/');
        equal(getDuckDuckGoSearchQuery(url), '');
    });

    test('returns empty string if host is not duckduckgo.com', () => {
        const url = new URL('https://google.com/?q=test');
        equal(getDuckDuckGoSearchQuery(url), '');
    });

    test('returns empty string if path is not "/"', () => {
        const url = new URL('https://duckduckgo.com/about?q=blah');
        equal(getDuckDuckGoSearchQuery(url), '');
    });

    test('returns empty string if q param is empty', () => {
        const url = new URL('https://duckduckgo.com/?q=');
        equal(getDuckDuckGoSearchQuery(url), '');
    });

    test('returns query for duckduckgo.com with no pathname but has q', () => {
        const url = new URL('https://duckduckgo.com?q=abcd');
        equal(getDuckDuckGoSearchQuery(url), 'abcd');
    });

    test('returns empty string if search param is present but host is invalid', () => {
        const url = new URL('https://sub.duckduckgo.com/?q=abc');
        equal(getDuckDuckGoSearchQuery(url), '');
    });

    test('returns search query for a valid DuckDuckGo search with additional params', () => {
        const url = new URL('https://duckduckgo.com/?q=weather&ia=web');
        equal(getDuckDuckGoSearchQuery(url), 'weather');
    });
});

test.describe('startsWithIgnoreCase', () => {
    test('returns true for matching prefix (case insensitive)', () => {
        equal(startsWithIgnoreCase('Foobar', 'foo'), true);
        equal(startsWithIgnoreCase('FOOBAR', 'foo'), true);
        equal(startsWithIgnoreCase('foobar', 'FOO'), true);
        equal(startsWithIgnoreCase('Hello World', 'hello'), true);
    });

    test('returns false when prefix does not match', () => {
        equal(startsWithIgnoreCase('foobar', 'baz'), false);
        equal(startsWithIgnoreCase('hello world', 'world'), false);
        equal(startsWithIgnoreCase('abc', 'abcd'), false);
    });

    test('returns true when searchString is empty', () => {
        equal(startsWithIgnoreCase('foobar', ''), true);
        equal(startsWithIgnoreCase('', ''), true);
    });

    test('returns false if string is empty but searchString is not', () => {
        equal(startsWithIgnoreCase('', 'foo'), false);
    });

    test('works with non-alphabetic characters', () => {
        equal(startsWithIgnoreCase('123abc', '123'), true);
        equal(startsWithIgnoreCase('!@#Test', '!@#'), true);
        equal(startsWithIgnoreCase('Test!', 'test!'), true);
        equal(startsWithIgnoreCase('Test!', 'Test!@#'), false);
    });
});
