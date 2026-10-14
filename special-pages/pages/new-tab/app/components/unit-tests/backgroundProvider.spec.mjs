import { describe, it } from 'node:test';
import { deepEqual, equal } from 'node:assert/strict';
import { inferSchemeFrom, themeFromBrowser } from '../backgroundScheme.js';

describe('themeFromBrowser', () => {
    it('follows the system preference when browser theme is system', () => {
        equal(themeFromBrowser('system', 'light'), 'light');
        equal(themeFromBrowser('system', 'dark'), 'dark');
    });

    it('returns an explicit browser theme unchanged', () => {
        equal(themeFromBrowser('light', 'dark'), 'light');
        equal(themeFromBrowser('dark', 'light'), 'dark');
    });
});

describe('inferSchemeFrom', () => {
    it('derives both schemes from the browser when the background is default', () => {
        deepEqual(inferSchemeFrom({ kind: 'default' }, 'light', 'dark'), { bg: 'light', browser: 'light' });
        deepEqual(inferSchemeFrom({ kind: 'default' }, 'system', 'dark'), { bg: 'dark', browser: 'dark' });
    });

    it('uses predefined color metadata for solid color backgrounds', () => {
        deepEqual(inferSchemeFrom({ kind: 'color', value: 'color01' }, 'light', 'light'), {
            bg: 'dark',
            browser: 'light',
        });
        deepEqual(inferSchemeFrom({ kind: 'color', value: 'color05' }, 'dark', 'dark'), {
            bg: 'light',
            browser: 'dark',
        });
    });

    it('uses predefined gradient metadata for gradient backgrounds', () => {
        deepEqual(inferSchemeFrom({ kind: 'gradient', value: 'gradient01' }, 'dark', 'dark'), {
            bg: 'light',
            browser: 'dark',
        });
    });

    it('uses the uploaded image color scheme for userImage backgrounds', () => {
        deepEqual(
            inferSchemeFrom(
                {
                    kind: 'userImage',
                    value: {
                        id: '01',
                        src: 'images/01.jpg',
                        thumb: 'images/01-thumb.jpg',
                        colorScheme: 'dark',
                    },
                },
                'light',
                'light',
            ),
            { bg: 'dark', browser: 'light' },
        );
    });

    it('derives the background scheme from custom hex values', () => {
        deepEqual(inferSchemeFrom({ kind: 'hex', value: '#000000' }, 'light', 'light'), {
            bg: 'dark',
            browser: 'light',
        });
        deepEqual(inferSchemeFrom({ kind: 'hex', value: '#ffffff' }, 'dark', 'dark'), {
            bg: 'light',
            browser: 'dark',
        });
    });
});
