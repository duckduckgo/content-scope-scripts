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
});
