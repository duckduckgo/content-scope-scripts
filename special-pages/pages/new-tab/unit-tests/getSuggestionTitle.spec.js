import { test } from 'node:test';
import { equal, throws } from 'node:assert/strict';
import { getSuggestionTitle } from '../app/omnibar/components/useSuggestions.js';

/**
 * @typedef {import('../types/new-tab.js').Suggestion} Suggestion
 */

test.describe('getSuggestionTitle', () => {
    test('returns title for bookmark', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: 'pizzahut.com', url: 'pizzahut.com', isFavorite: true, score: 97 };
        equal(getSuggestionTitle(suggestion), 'pizzahut.com');
    });

    test('returns display URL for bookmark without title', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'bookmark', title: '', url: 'dominos.com/order?pizza#special', isFavorite: false, score: 96 };
        equal(getSuggestionTitle(suggestion), 'dominos.com/order?pizza#special');
    });

    test('returns title for historyEntry', () => {
        /** @type {Suggestion} */
        const suggestion = {
            kind: 'historyEntry',
            title: 'Best Pizza Places in New York',
            url: 'https://example.com/search?q=Best%20Pizza%20Places%20in%20New%20York',
            score: 87,
        };
        equal(getSuggestionTitle(suggestion), 'Best Pizza Places in New York');
    });

    test('returns display URL for historyEntry without title', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'historyEntry', title: '', url: 'https://example.com/search?q=Pizza%20Dough%20Calculator', score: 85 };
        equal(getSuggestionTitle(suggestion), 'example.com/search?q=Pizza%20Dough%20Calculator');
    });

    test('returns title for internalPage', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: 'Settings', url: 'duck://settings', score: 1 };
        equal(getSuggestionTitle(suggestion), 'Settings');
    });

    test('returns display URL for internalPage without title', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'internalPage', title: '', url: 'duck://settings', score: 2 };
        equal(getSuggestionTitle(suggestion), 'settings');
    });

    test('returns phrase for phrase kind', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'phrase', phrase: 'pizza delivery' };
        equal(getSuggestionTitle(suggestion), 'pizza delivery');
    });

    test('returns title for openTab', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'openTab', title: 'Pizza Dough Calculator', tabId: 'tab-1', score: 1 };
        equal(getSuggestionTitle(suggestion), 'Pizza Dough Calculator');
    });

    test('returns display URL for website', () => {
        /** @type {Suggestion} */
        const suggestion = { kind: 'website', url: 'https://pizzaexpress.com/menu#vegetarian' };
        equal(getSuggestionTitle(suggestion), 'pizzaexpress.com/menu#vegetarian');
    });

    test('throws error for unknown kind', () => {
        /** @type {any} */
        const suggestion = { kind: 'unknown' };
        throws(() => getSuggestionTitle(suggestion), { message: 'Unknown suggestion kind' });
    });
});
