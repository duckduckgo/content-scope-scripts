import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { isTabLimitExceeded, resolveAttachedTabs } from '../components/chat-tools/tab-attachment/tabAttachments.logic.js';

/** @type {import('../../../types/new-tab.js').TabMetadata[]} */
const openTabs = [
    { tabId: 'tab-1', title: 'Starbucks', url: 'https://starbucks.com', favicon: null },
    { tabId: 'tab-2', title: 'MacBook', url: 'https://apple.com', favicon: null },
];

test.describe('resolveAttachedTabs', () => {
    test('returns open tabs with their attach timestamps', () => {
        const entries = [
            { tabId: 'tab-1', addedAtRelative: 100 },
            { tabId: 'tab-2', addedAtRelative: 200 },
        ];

        deepEqual(resolveAttachedTabs(entries, openTabs), [
            { ...openTabs[0], addedAtRelative: 100 },
            { ...openTabs[1], addedAtRelative: 200 },
        ]);
    });

    test('drops entries for tabs that have since closed', () => {
        const entries = [
            { tabId: 'tab-1', addedAtRelative: 100 },
            { tabId: 'tab-closed', addedAtRelative: 150 },
            { tabId: 'tab-2', addedAtRelative: 200 },
        ];

        deepEqual(resolveAttachedTabs(entries, openTabs), [
            { ...openTabs[0], addedAtRelative: 100 },
            { ...openTabs[1], addedAtRelative: 200 },
        ]);
    });

    test('returns an empty list when every attached tab has closed', () => {
        const entries = [
            { tabId: 'tab-closed-a', addedAtRelative: 100 },
            { tabId: 'tab-closed-b', addedAtRelative: 200 },
        ];

        deepEqual(resolveAttachedTabs(entries, openTabs), []);
    });
});

test.describe('isTabLimitExceeded', () => {
    test('is false when the open attached count is within the cap', () => {
        equal(isTabLimitExceeded(2, 3), false);
        equal(isTabLimitExceeded(3, 3), false);
    });

    test('is true when the open attached count exceeds the cap', () => {
        equal(isTabLimitExceeded(4, 3), true);
    });

    test('treats an absent cap as unlimited', () => {
        equal(isTabLimitExceeded(100), false);
        equal(isTabLimitExceeded(100, undefined), false);
    });
});
