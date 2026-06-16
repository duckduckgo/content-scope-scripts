import { JSDOM } from 'jsdom';
import { getFaviconList } from '../src/features/favicon.js';

/**
 * Sets up JSDOM globals with the given `<head>` markup (favicons live in the head).
 * Returns a teardown function that restores the originals.
 *
 * @param {string} headHTML
 */
function setupHead(headHTML) {
    const dom = new JSDOM(`<!DOCTYPE html><html><head>${headHTML}</head><body></body></html>`, {
        url: 'https://example.com/',
    });
    const origDocument = global.document;
    const origHTMLLinkElement = global.HTMLLinkElement;

    global.document = dom.window.document;
    global.HTMLLinkElement = dom.window.HTMLLinkElement;

    return () => {
        global.document = origDocument;
        global.HTMLLinkElement = origHTMLLinkElement;
    };
}

describe('favicon.js - getFaviconList', () => {
    it('excludes Safari mask-icon links and keeps real favicons (including SVG)', () => {
        const teardown = setupHead(`
            <link rel="icon" href="https://example.com/favicon.png" type="image/png">
            <link rel="icon" href="https://example.com/favicon.svg" type="image/svg+xml">
            <link rel="mask-icon" href="https://example.com/safari-pinned-tab.svg" color="#000000">
            <link rel="apple-touch-icon" href="https://example.com/apple-touch-icon.png">
        `);
        try {
            const favicons = getFaviconList();

            // The Safari pinned-tab mask icon is dropped.
            expect(favicons.map((f) => f.rel)).not.toContain('mask-icon');

            // Real favicons — including the non-mask SVG — are retained, in document order.
            expect(favicons.map((f) => f.href)).toEqual([
                'https://example.com/favicon.png',
                'https://example.com/favicon.svg',
                'https://example.com/apple-touch-icon.png',
            ]);
        } finally {
            teardown();
        }
    });

    it('is case-insensitive for the mask-icon rel', () => {
        const teardown = setupHead(`
            <link rel="MASK-ICON" href="https://example.com/safari-pinned-tab.svg">
            <link rel="icon" href="https://example.com/favicon.png" type="image/png">
        `);
        try {
            expect(getFaviconList().map((f) => f.href)).toEqual(['https://example.com/favicon.png']);
        } finally {
            teardown();
        }
    });

    it('leaves a page without mask icons unchanged', () => {
        const teardown = setupHead(`<link rel="shortcut icon" href="https://example.com/favicon.ico">`);
        try {
            expect(getFaviconList().map((f) => f.rel)).toEqual(['shortcut icon']);
        } finally {
            teardown();
        }
    });
});
