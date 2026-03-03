import { parseSurrogates } from '../src/features/tracker-protection/surrogates-parser.js';

describe('parseSurrogates', () => {
    it('should parse a single surrogate entry', () => {
        const text = 'googlesyndication.com/adsbygoogle.js application/javascript\nwindow.adsbygoogle = { push() {} };\n';
        const result = parseSurrogates(text);
        expect(Object.keys(result)).toEqual(['adsbygoogle.js']);
        expect(typeof result['adsbygoogle.js']).toBe('function');
    });

    it('should execute parsed surrogate code when called', () => {
        const text = 'example.com/test.js application/javascript\nglobalThis.__surrogateTestValue = 42;\n';
        const result = parseSurrogates(text);
        expect(globalThis.__surrogateTestValue).toBeUndefined();
        result['test.js']();
        expect(globalThis.__surrogateTestValue).toBe(42);
        delete globalThis.__surrogateTestValue;
    });

    it('should parse multiple surrogate entries separated by blank lines', () => {
        const text = [
            'google-analytics.com/ga.js application/javascript',
            '(function() { globalThis.__ga = function() {}; })();',
            '',
            'google-analytics.com/analytics.js application/javascript',
            '(function() { globalThis.__analytics = true; })();',
        ].join('\n');

        const result = parseSurrogates(text);
        expect(Object.keys(result).sort()).toEqual(['analytics.js', 'ga.js']);
        expect(typeof result['ga.js']).toBe('function');
        expect(typeof result['analytics.js']).toBe('function');
    });

    it('should strip comment lines starting with #', () => {
        const text = [
            '# This is a comment',
            '# Another comment',
            '',
            '# Comment before entry',
            'example.com/script.js application/javascript',
            '# Comment inside entry',
            'globalThis.__parsed = true;',
        ].join('\n');

        const result = parseSurrogates(text);
        expect(Object.keys(result)).toEqual(['script.js']);
        result['script.js']();
        expect(globalThis.__parsed).toBe(true);
        delete globalThis.__parsed;
    });

    it('should extract filename from domain/filename pattern', () => {
        const text = 'cdn.example.com/widget.js application/javascript\n/* noop */\n';
        const result = parseSurrogates(text);
        expect(Object.keys(result)).toEqual(['widget.js']);
    });

    it('should handle IIFE surrogates correctly', () => {
        const text = [
            'doubleclick.net/ad_status.js application/javascript',
            '(() => {',
            "  'use strict';",
            '  globalThis.__ad_status = 1;',
            '})();',
        ].join('\n');

        const result = parseSurrogates(text);
        result['ad_status.js']();
        expect(globalThis.__ad_status).toBe(1);
        delete globalThis.__ad_status;
    });

    it('should return empty object for null/undefined/empty input', () => {
        expect(parseSurrogates(null)).toEqual({});
        expect(parseSurrogates(undefined)).toEqual({});
        expect(parseSurrogates('')).toEqual({});
    });

    it('should skip entries with no code body', () => {
        const text = 'example.com/empty.js application/javascript\n';
        const result = parseSurrogates(text);
        expect(Object.keys(result)).toEqual([]);
    });

    it('should skip entries with invalid JavaScript', () => {
        const text = [
            'example.com/valid.js application/javascript',
            'globalThis.__valid = true;',
            '',
            'example.com/invalid.js application/javascript',
            'function { broken syntax +++',
        ].join('\n');

        const result = parseSurrogates(text);
        expect(Object.keys(result)).toEqual(['valid.js']);
    });

    it('should handle multi-line surrogate code', () => {
        const text = [
            'tracker.com/complex.js application/javascript',
            '(function() {',
            '  var a = 1;',
            '  var b = 2;',
            '  globalThis.__complexResult = a + b;',
            '})();',
        ].join('\n');

        const result = parseSurrogates(text);
        result['complex.js']();
        expect(globalThis.__complexResult).toBe(3);
        delete globalThis.__complexResult;
    });

    it('should use filename key matching TDS surrogate field format', () => {
        const text = [
            'google-analytics.com/ga.js application/javascript',
            '/* noop */',
            '',
            'connect.facebook.net/fb-sdk.js application/javascript',
            '/* noop */',
        ].join('\n');

        const result = parseSurrogates(text);
        expect('ga.js' in result).toBe(true);
        expect('fb-sdk.js' in result).toBe(true);
        expect('google-analytics.com/ga.js' in result).toBe(false);
    });
});
