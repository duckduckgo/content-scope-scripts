import { deepEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { filterTabs } from '../components/chat-tools/tab-attachment/tabFilter.js';

/** @type {import('../../../types/new-tab.js').TabMetadata[]} */
const sample = [
    { tabId: '1', title: 'MacBook Neo - Apple', url: 'https://apple.com/macbook', favicon: null },
    { tabId: '2', title: 'Starbucks Coffee', url: 'https://starbucks.com', favicon: null },
    { tabId: '3', title: 'Dinosaur Wikipedia', url: 'https://en.wikipedia.org/dinosaur', favicon: null },
];

test.describe('filterTabs', () => {
    test('returns all tabs for an empty query', () => {
        deepEqual(
            filterTabs(sample, '').map((t) => t.tabId),
            ['1', '2', '3'],
        );
    });

    test('returns all tabs for a whitespace-only query', () => {
        deepEqual(
            filterTabs(sample, '   ').map((t) => t.tabId),
            ['1', '2', '3'],
        );
    });

    test('matches against title, case-insensitively', () => {
        deepEqual(
            filterTabs(sample, 'macbook').map((t) => t.tabId),
            ['1'],
        );
        deepEqual(
            filterTabs(sample, 'MACBOOK').map((t) => t.tabId),
            ['1'],
        );
    });

    test('matches against URL', () => {
        deepEqual(
            filterTabs(sample, 'wikipedia').map((t) => t.tabId),
            ['3'],
        );
    });

    test('matches partial substrings', () => {
        deepEqual(
            filterTabs(sample, 'st').map((t) => t.tabId),
            ['2'],
        );
    });

    test('returns empty for no matches', () => {
        deepEqual(filterTabs(sample, 'zzz'), []);
    });

    test('ranks title-and-URL matches above title-only, and title-only above URL-only', () => {
        /** @type {import('../../../types/new-tab.js').TabMetadata[]} */
        const tabs = [
            // URL-only match (score 1)
            { tabId: 'url-only', title: 'Fruit stand', url: 'https://apple.com', favicon: null },
            // title-only match (score 2)
            { tabId: 'title-only', title: 'Apple pie recipe', url: 'https://recipes.example', favicon: null },
            // title + URL match (score 3)
            { tabId: 'both', title: 'Apple Store', url: 'https://apple.com/store', favicon: null },
        ];
        deepEqual(
            filterTabs(tabs, 'apple').map((t) => t.tabId),
            ['both', 'title-only', 'url-only'],
        );
    });

    test('keeps input order for equal scores', () => {
        /** @type {import('../../../types/new-tab.js').TabMetadata[]} */
        const tabs = [
            { tabId: 'a', title: 'Apple one', url: 'https://one.example', favicon: null },
            { tabId: 'b', title: 'Apple two', url: 'https://two.example', favicon: null },
            { tabId: 'c', title: 'Apple three', url: 'https://three.example', favicon: null },
        ];
        deepEqual(
            filterTabs(tabs, 'apple').map((t) => t.tabId),
            ['a', 'b', 'c'],
        );
    });

    test('hoists the current tab to the front when it survives the filter', () => {
        deepEqual(
            filterTabs(sample, '', '3').map((t) => t.tabId),
            ['3', '1', '2'],
        );
    });

    test('hoisting preserves the relative order of the remaining tabs', () => {
        deepEqual(
            filterTabs(sample, '', '2').map((t) => t.tabId),
            ['2', '1', '3'],
        );
    });

    test('does not hoist a current tab that the query filtered out', () => {
        deepEqual(
            filterTabs(sample, 'macbook', '3').map((t) => t.tabId),
            ['1'],
        );
    });

    test('hoisting an unknown current tab id is a no-op', () => {
        deepEqual(
            filterTabs(sample, '', 'nope').map((t) => t.tabId),
            ['1', '2', '3'],
        );
    });
});
