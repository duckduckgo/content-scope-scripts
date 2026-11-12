import { JSDOM } from 'jsdom';
import { getFaviconList } from '../src/features/favicon.js';

/**
 * @param {string} headHtml - markup placed inside `<head>`.
 */
function faviconsFor(headHtml) {
    const dom = new JSDOM(`<!DOCTYPE html><html><head>${headHtml}</head><body></body></html>`, {
        url: 'https://example.com/page',
    });
    const origDocument = global.document;
    const origHTMLLinkElement = global.HTMLLinkElement;

    global.document = dom.window.document;
    global.HTMLLinkElement = dom.window.HTMLLinkElement;

    try {
        return getFaviconList();
    } finally {
        global.document = origDocument;
        global.HTMLLinkElement = origHTMLLinkElement;
    }
}

describe('favicon.js - getFaviconList', () => {
    it('excludes Safari mask-icon links while keeping real favicons', () => {
        const favicons = faviconsFor(`
            <link rel="icon" href="/favicon.png" type="image/png">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        `);

        expect(favicons.map((f) => f.rel)).toEqual(['icon', 'icon', 'apple-touch-icon']);
        expect(favicons.map((f) => new URL(f.href).pathname)).toEqual(['/favicon.png', '/favicon.svg', '/apple-touch-icon.png']);
    });

    it('excludes mask-icon case-insensitively', () => {
        const favicons = faviconsFor(`
            <link rel="MASK-ICON" href="/mask-icon-upper.svg" color="#000">
            <link rel="mask-icon" href="/mask-icon-lower.svg" color="#000">
        `);

        expect(favicons).toEqual([]);
    });
});
