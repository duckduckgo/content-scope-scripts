import { JSDOM } from 'jsdom';
import { extractPageTypeSignals } from '../src/features/page-context.js';

/**
 * @param {string} html - full document HTML to parse.
 */
function signalsFor(html) {
    const dom = new JSDOM(html);
    return extractPageTypeSignals(dom.window.document);
}

function scriptLd(obj) {
    return '<script type="application/ld+json">' + JSON.stringify(obj) + '</script>';
}

function pageWithHead(headHtml) {
    return `<!DOCTYPE html><html><head>${headHtml}</head><body></body></html>`;
}

describe('page-context.js - extractPageTypeSignals', () => {
    it('returns empty signals for a bare page', () => {
        const signals = signalsFor('<!DOCTYPE html><html><head></head><body></body></html>');
        expect(signals).toEqual({ jsonLdType: [], ogType: null, lang: '' });
    });

    it('reads and trims og:type', () => {
        const signals = signalsFor(pageWithHead('<meta property="og:type" content=" video.other ">'));
        expect(signals.ogType).toBe('video.other');
    });

    it('returns null og:type when the meta tag is absent', () => {
        expect(signalsFor(pageWithHead('')).ogType).toBe(null);
    });

    it('reads the declared page language', () => {
        const signals = signalsFor('<!DOCTYPE html><html lang="en-US"><head></head><body></body></html>');
        expect(signals.lang).toBe('en-US');
    });

    it('reads a string @type from JSON-LD', () => {
        expect(signalsFor(pageWithHead(scriptLd({ '@type': 'Recipe' }))).jsonLdType).toEqual(['Recipe']);
    });

    it('reads an array @type from JSON-LD', () => {
        expect(signalsFor(pageWithHead(scriptLd({ '@type': ['Recipe', 'NewsArticle'] }))).jsonLdType).toEqual(['Recipe', 'NewsArticle']);
    });

    it('walks @graph entries', () => {
        const head = scriptLd({ '@graph': [{ '@type': 'Product' }, { '@type': 'Offer' }] });
        expect(signalsFor(pageWithHead(head)).jsonLdType).toEqual(['Product', 'Offer']);
    });

    it('dedupes across multiple blocks and preserves schema.org casing', () => {
        const head = scriptLd({ '@type': 'Recipe' }) + scriptLd({ '@type': ['Recipe', 'VideoObject'] });
        expect(signalsFor(pageWithHead(head)).jsonLdType).toEqual(['Recipe', 'VideoObject']);
    });

    it('skips malformed JSON-LD blocks but keeps valid ones', () => {
        const head = '<script type="application/ld+json">{ not valid json </script>' + scriptLd({ '@type': 'Article' });
        expect(signalsFor(pageWithHead(head)).jsonLdType).toEqual(['Article']);
    });

    it('ignores non-string @type values', () => {
        expect(signalsFor(pageWithHead(scriptLd({ '@type': ['Recipe', 123, null] }))).jsonLdType).toEqual(['Recipe']);
    });

    it('caps the number of collected types', () => {
        const many = Array.from({ length: 20 }, (_, i) => ({ '@type': 'T' + i }));
        const dom = new JSDOM(pageWithHead(scriptLd(many)));
        const signals = extractPageTypeSignals(dom.window.document, { maxTypes: 3 });
        expect(signals.jsonLdType).toEqual(['T0', 'T1', 'T2']);
    });

    it('skips oversized JSON-LD blocks', () => {
        const big = { '@type': 'Recipe', padding: 'x'.repeat(50) };
        const dom = new JSDOM(pageWithHead(scriptLd(big)));
        const signals = extractPageTypeSignals(dom.window.document, { maxBlockLength: 10 });
        expect(signals.jsonLdType).toEqual([]);
    });

    it('collects nothing when maxTypes is explicitly 0', () => {
        const dom = new JSDOM(pageWithHead(scriptLd({ '@type': 'Recipe' })));
        expect(extractPageTypeSignals(dom.window.document, { maxTypes: 0 }).jsonLdType).toEqual([]);
    });

    it('discovers JSON-LD with non-canonical script type casing', () => {
        const head = '<script type="APPLICATION/LD+JSON">' + JSON.stringify({ '@type': 'Recipe' }) + '</script>';
        expect(signalsFor(pageWithHead(head)).jsonLdType).toEqual(['Recipe']);
    });

    it('bails out of deeply nested JSON-LD without collecting past the cap (a thrown RangeError fails this test)', () => {
        let nested = /** @type {any} */ ({ '@type': 'TooDeep' });
        for (let i = 0; i < 60; i++) nested = { '@graph': [nested] };
        const head = scriptLd({ '@type': 'Shallow', '@graph': [nested] });
        const signals = signalsFor(pageWithHead(head));
        expect(signals.jsonLdType).toContain('Shallow');
        expect(signals.jsonLdType).not.toContain('TooDeep');
    });

    it('ignores @type / @graph inherited from a polluted Object.prototype', () => {
        // Aliased reference so the deliberate pollution doesn't trip the no-extend-native lint rule.
        const proto = /** @type {Record<string, unknown>} */ (Object.prototype);
        proto['@type'] = 'Polluted';
        try {
            const signals = signalsFor(pageWithHead(scriptLd({ name: 'no own @type' })));
            expect(signals.jsonLdType).toEqual([]);
        } finally {
            delete proto['@type'];
        }
    });

    it('collects all three signals from a realistic page (recipe with embedded video)', () => {
        const head =
            '<meta property="og:type" content="article">' +
            scriptLd({ '@type': ['Recipe', 'NewsArticle'] }) +
            scriptLd({ '@type': 'VideoObject' });
        const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><head>${head}</head><body></body></html>`);
        expect(extractPageTypeSignals(dom.window.document)).toEqual({
            jsonLdType: ['Recipe', 'NewsArticle', 'VideoObject'],
            ogType: 'article',
            lang: 'en',
        });
    });
});
