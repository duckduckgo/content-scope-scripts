import { JSDOM } from 'jsdom';
import { getFaviconList } from '../src/features/favicon.js';

describe('getFaviconList', () => {
    /**
     * @param {string} headHtml
     */
    function faviconsFor(headHtml) {
        const dom = new JSDOM(`<!DOCTYPE html><html><head>${headHtml}</head><body></body></html>`, {
            url: 'https://example.com',
        });
        const { document, HTMLLinkElement } = dom.window;
        const originalDocument = globalThis.document;
        const originalHTMLLinkElement = globalThis.HTMLLinkElement;
        globalThis.document = document;
        globalThis.HTMLLinkElement = HTMLLinkElement;
        try {
            return getFaviconList();
        } finally {
            globalThis.document = originalDocument;
            if (originalHTMLLinkElement === undefined) {
                // @ts-expect-error - restoring test env
                delete globalThis.HTMLLinkElement;
            } else {
                globalThis.HTMLLinkElement = originalHTMLLinkElement;
            }
        }
    }

    it('collects standard icon links', () => {
        const favicons = faviconsFor('<link rel="icon" href="/favicon.ico">' + '<link rel="apple-touch-icon" href="/apple.png">');
        expect(favicons.map((f) => f.rel).sort()).toEqual(['apple-touch-icon', 'icon']);
    });

    it('excludes Safari mask-icon links that are not real favicons', () => {
        const favicons = faviconsFor(
            '<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000">' + '<link rel="icon" href="/favicon.ico">',
        );
        expect(favicons).toHaveSize(1);
        expect(favicons[0].rel).toBe('icon');
        expect(favicons[0].href).toContain('/favicon.ico');
    });

    it('still collects non-mask icons when rel contains icon', () => {
        const favicons = faviconsFor('<link rel="shortcut icon" href="/shortcut.ico">');
        expect(favicons).toHaveSize(1);
        expect(favicons[0].href).toContain('/shortcut.ico');
    });
});
