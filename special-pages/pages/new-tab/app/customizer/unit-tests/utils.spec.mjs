import { describe, it } from 'node:test';
import { equal, strictEqual } from 'node:assert/strict';
import { detectThemeFromHex, detectThemeNearBlackOrWhiteFromHex, getLuminanceFromHex } from '../utils.js';

describe('getLuminanceFromHex', () => {
    it('computes WCAG relative luminance on a 6-digit hex code', () => {
        strictEqual(getLuminanceFromHex('#000000'), 0);
        equal(getLuminanceFromHex('#ffffff') > 254, true);
    });

    it('ignores an alpha channel on 8-digit hex codes', () => {
        strictEqual(getLuminanceFromHex('#ff000080'), getLuminanceFromHex('#ff0000'));
    });

    it('accepts hex codes without a leading hash', () => {
        strictEqual(getLuminanceFromHex('808080'), getLuminanceFromHex('#808080'));
    });
});

describe('detectThemeFromHex', () => {
    it('returns dark for low-luminance backgrounds', () => {
        equal(detectThemeFromHex('#000000'), 'dark');
        equal(detectThemeFromHex('#342e42'), 'dark');
    });

    it('returns light for high-luminance backgrounds', () => {
        equal(detectThemeFromHex('#ffffff'), 'light');
        equal(detectThemeFromHex('#dbdddf'), 'light');
    });

    it('uses 128 as the light/dark threshold', () => {
        equal(detectThemeFromHex('#7f7f7f'), 'dark');
        equal(detectThemeFromHex('#808080'), 'light');
    });
});

describe('detectThemeNearBlackOrWhiteFromHex', () => {
    it('flags near-black backgrounds for token compensation', () => {
        equal(detectThemeNearBlackOrWhiteFromHex('#000000'), 'dark');
        equal(detectThemeNearBlackOrWhiteFromHex('#262626'), 'dark');
    });

    it('flags near-white backgrounds for token compensation', () => {
        equal(detectThemeNearBlackOrWhiteFromHex('#ffffff'), 'light');
        equal(detectThemeNearBlackOrWhiteFromHex('#f0f0f0'), 'light');
    });

    it('returns undefined for mid-range luminance', () => {
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#808080'), undefined);
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#577de4'), undefined);
    });

    it('uses the documented 40/215 luminance thresholds', () => {
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#1a1a1a'), 'dark');
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#808080'), undefined);
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#d0d0d0'), undefined);
        strictEqual(detectThemeNearBlackOrWhiteFromHex('#f5f5f5'), 'light');
    });
});
