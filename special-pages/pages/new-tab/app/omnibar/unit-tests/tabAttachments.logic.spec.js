import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { isTabLimitExceeded, selectAttachedOpenTabs } from '../components/chat-tools/tab-attachment/tabAttachments.logic.js';

/** @type {import('../../../types/new-tab.js').TabMetadata[]} */
const openTabs = [
    { tabId: 'tab-1', title: 'MacBook Neo - Apple', url: 'https://apple.com/macbook', favicon: null },
    { tabId: 'tab-2', title: 'Starbucks Coffee Company', url: 'https://starbucks.com', favicon: null },
];

test.describe('selectAttachedOpenTabs', () => {
    test('returns attached tabs that are still open', () => {
        const entries = [
            { tabId: 'tab-1', addedAtRelative: 1 },
            { tabId: 'tab-2', addedAtRelative: 2 },
        ];
        deepEqual(
            selectAttachedOpenTabs(entries, openTabs).map((tab) => tab.tabId),
            ['tab-1', 'tab-2'],
        );
    });

    test('drops entries for tabs that have closed', () => {
        const entries = [
            { tabId: 'tab-1', addedAtRelative: 1 },
            { tabId: 'tab-2', addedAtRelative: 2 },
        ];
        deepEqual(
            selectAttachedOpenTabs(entries, [openTabs[0]]).map((tab) => tab.tabId),
            ['tab-1'],
        );
    });

    test('preserves addedAtRelative on surviving entries', () => {
        const entries = [{ tabId: 'tab-2', addedAtRelative: 42 }];
        equal(selectAttachedOpenTabs(entries, openTabs)[0]?.addedAtRelative, 42);
    });
});

test.describe('isTabLimitExceeded', () => {
    test('is false when the open attached count is within the cap', () => {
        equal(isTabLimitExceeded(1, 1), false);
    });

    test('is true when the open attached count exceeds the cap', () => {
        equal(isTabLimitExceeded(2, 1), true);
    });

    test('treats an absent max as unlimited', () => {
        equal(isTabLimitExceeded(99), false);
    });

    test('closed tabs excluded from the open count do not trigger the soft cap', () => {
        const entries = [
            { tabId: 'tab-1', addedAtRelative: 1 },
            { tabId: 'tab-2', addedAtRelative: 2 },
        ];
        const attachedOpenCount = selectAttachedOpenTabs(entries, [openTabs[0]]).length;
        equal(isTabLimitExceeded(attachedOpenCount, 1), false);
    });
});
