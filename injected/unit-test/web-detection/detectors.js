import { BROKEN, IMG, RENDERED, brokenFonts, fonts, renderedText, run, timeline } from './support.js';

/**
 * @typedef {import('./support.js').Install} Install
 */

describe('WebDetection detectors', () => {
    describe('the five detectors', () => {
        it('reports a broken image count and share', () => {
            const brokenImages = { element: BROKEN, using: 'length' };
            const detector = {
                match: { ...brokenImages, is: { gte: 1 } },
                actions: [
                    {
                        define: {
                            brokenImages,
                            brokenShare: { div: [{ ref: 'brokenImages' }, { element: { selector: 'img' }, using: 'length' }] },
                        },
                    },
                    {
                        breakageReportData: {
                            data: { brokenImages: { value: { ref: 'brokenImages' } }, brokenShare: { value: { ref: 'brokenShare' } } },
                        },
                    },
                    {
                        if: { ref: 'brokenImages', is: 1 },
                        then: { fireEvent: { type: 'brokenImages_count1' } },
                        else: {
                            if: { ref: 'brokenImages', is: { lt: 5 } },
                            then: { fireEvent: { type: 'brokenImages_count2to4' } },
                            else: { fireEvent: { type: 'brokenImages_count5Plus' } },
                        },
                    },
                ],
            };
            const html = IMG('data-complete') + IMG('data-complete') + IMG('data-complete data-width="4"') + '<img data-complete>';
            const result = run(html, detector);
            expect(result.detected).toBe(true);
            expect(result.events).toEqual([{ type: 'brokenImages_count2to4' }]);
            expect(result.entry?.data).toEqual({ brokenImages: 2, brokenShare: 0.5 });
        });

        it('reports a slow page load once, refreshing its breakage data on every run until the load ends', () => {
            const slowLoad = {
                actions: {
                    if: { none: [{ ref: 'this.finished', is: true }] },
                    then: [
                        {
                            define: {
                                loadEventEnd: {
                                    only: { api: { path: 'performance.getEntriesByType', args: ['navigation'], field: 'loadEventEnd' } },
                                },
                                elapsed: { api: { path: 'performance.now', args: [] } },
                            },
                        },
                        { breakageReportData: { data: { loadEventEnd: { value: { ref: 'loadEventEnd' } } } } },
                        {
                            if: {
                                all: [
                                    {
                                        any: [
                                            { ref: 'loadEventEnd', is: { gte: 8000 } },
                                            { ref: 'elapsed', is: { gte: 15000 } },
                                        ],
                                    },
                                    { none: [{ ref: 'this.sent', is: true }] },
                                ],
                            },
                            then: [
                                {
                                    if: { ref: 'loadEventEnd', is: 0 },
                                    then: { fireEvent: { type: 'pageLoadTime_loadLoading' } },
                                    else: { fireEvent: { type: 'pageLoadTime_load8sPlus' } },
                                },
                                { define: { 'this.sent': true } },
                            ],
                        },
                        { define: { 'this.finished': { ref: 'loadEventEnd', is: { gt: 0 } } } },
                    ],
                },
            };
            const slow = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 9000 }]) });
            expect(slow.events).toEqual([{ type: 'pageLoadTime_load8sPlus' }]);
            expect(slow.ctx.detectorNames.get('this.finished')).toBe(true);
            const fast = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900 }]) });
            expect(fast.events).toEqual([]);
            expect(fast.entry?.data).toEqual({ loadEventEnd: 900 });
            const now = (/** @type {any} */ w) =>
                Object.defineProperty(w.Performance.prototype, 'now', { configurable: true, value: () => 16000 });
            const stillLoading = run('', slowLoad, { install: [timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 0 }]), now] });
            expect(stillLoading.events).toEqual([{ type: 'pageLoadTime_loadLoading' }]);
            expect(stillLoading.ctx.detectorNames.get('this.finished')).toBe(false);
        });

        it('reports failed stylesheets and fonts, both counts either way', () => {
            const failedStylesheets = {
                api: {
                    path: 'performance.getEntriesByType',
                    args: ['resource'],
                    where: { initiatorType: 'link', responseStatus: { gte: 400 } },
                },
                using: 'length',
            };
            const failedFontFaces = { api: { path: 'document.fonts', where: { status: 'error' } }, using: 'length' };
            const detector = {
                match: {
                    any: [
                        { ...failedStylesheets, is: { gt: 0 } },
                        { ...failedFontFaces, is: { gt: 0 } },
                    ],
                },
                actions: [
                    { define: { failedStylesheets, failedFontFaces } },
                    {
                        breakageReportData: {
                            data: {
                                failedStylesheets: { value: { ref: 'failedStylesheets' } },
                                failedFontFaces: { value: { ref: 'failedFontFaces' } },
                            },
                        },
                    },
                ],
            };
            const failedSheet = timeline([
                { name: 'a.css', entryType: 'resource', initiatorType: 'link', responseStatus: 404 },
                { name: 'b.css', entryType: 'resource', initiatorType: 'link', responseStatus: 200 },
            ]);
            const loadedSheet = timeline([{ name: 'b.css', entryType: 'resource', initiatorType: 'link', responseStatus: 200 }]);
            const data = (/** @type {Install[]} */ install) => run('', detector, { install }).entry?.data;
            expect(data([failedSheet, fonts(['error', 'loaded'])])).toEqual({ failedStylesheets: 1, failedFontFaces: 1 });
            // A `document.fonts` that throws fails `match`, since every operand is evaluated
            const throwing = run('', detector, { install: [failedSheet, brokenFonts] });
            expect(throwing.detected).toBe('aborted');
            expect(throwing.failedAt).toBe('match.any.1.api');
            expect(data([loadedSheet, fonts(['error'])])).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
            // An engine without responseStatus counts 0, a reading
            const noStatus = timeline([{ name: 'a.css', entryType: 'resource', initiatorType: 'link' }], { missing: ['responseStatus'] });
            expect(data([noStatus, fonts(['error'])])).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
        });

        it('reports an empty known region', () => {
            const detector = {
                actions: [
                    { define: { comments: { element: { selector: ['#comments'] } } } },
                    {
                        if: { ref: 'comments' },
                        then: {
                            if: {
                                all: [
                                    { none: renderedText({ ref: 'comments' }) },
                                    {
                                        element: {
                                            selector: 'img',
                                            where: { complete: true, naturalWidth: { gt: 0 } },
                                            root: { ref: 'comments' },
                                        },
                                        using: 'length',
                                        is: { lt: 1 },
                                    },
                                ],
                            },
                            then: {
                                breakageReportData: {
                                    data: {
                                        region: { value: 'empty' },
                                        brokenImages: { value: { element: { ...BROKEN, root: { ref: 'comments' } }, using: 'length' } },
                                    },
                                },
                            },
                            else: { breakageReportData: { data: { region: { value: 'filled' } } } },
                        },
                    },
                ],
            };
            const entry = (/** @type {string} */ html) => run(html, detector).entry?.data;
            expect(entry('')).toBeUndefined();
            expect(entry('<div id="comments">hi</div>')).toEqual({ region: 'filled' });
            expect(entry(`<div id="comments">${IMG('data-complete')}</div>`)).toEqual({ region: 'empty', brokenImages: 1 });
            expect(entry('<div id="comments"> </div>')).toEqual({ region: 'empty', brokenImages: 0 });
        });

        it('counts error phrases in rendered text', () => {
            const keywordCount = {
                text: { xpath: RENDERED, pattern: ['access denied', 'page not found', '404 not found'] },
                using: 'length',
            };
            const detector = {
                match: { ...keywordCount, is: { gte: 1 } },
                actions: [
                    { define: { keywordCount } },
                    { breakageReportData: { data: { keywordCount: { value: { ref: 'keywordCount' } } } } },
                    { if: { ref: 'keywordCount', is: { gte: 2 } }, then: { fireEvent: { type: 'errorPhraseCount_count2Plus' } } },
                ],
            };
            const result = run('<h1>Page not found</h1><p>404 Not Found</p><script>page not found</script>', detector);
            expect(result.entry?.data).toEqual({ keywordCount: 2 });
            expect(result.events).toEqual([{ type: 'errorPhraseCount_count2Plus' }]);
        });
    });
});
