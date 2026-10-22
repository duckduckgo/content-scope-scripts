import { parseDetectors } from '../../src/features/web-detection/compile/detector-config.js';
import { TaskReadCache } from '../../src/features/web-detection/evaluate/task-read-cache.js';
import WebDetection from '../../src/features/web-detection.js';
import { BROKEN, FAILING, IMG, RENDERED, brokenFonts, fonts, imageState, renderedText, run, timeline } from './support.js';

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
            const result = run(html, detector, { install: imageState });
            expect(result.detected).toBe(true);
            expect(result.ctx.events).toEqual([{ type: 'brokenImages_count2to4' }]);
            expect(result.ctx.entry.data).toEqual({ brokenImages: 2, brokenShare: 0.5 });
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
            expect(slow.ctx.events).toEqual([{ type: 'pageLoadTime_load8sPlus' }]);
            expect(slow.ctx.detectorNames.get('this.finished')).toBe(true);
            const fast = run('', slowLoad, { install: timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 900 }]) });
            expect(fast.ctx.events).toEqual([]);
            expect(fast.ctx.entry.data).toEqual({ loadEventEnd: 900 });
            const stillLoading = run('', slowLoad, {
                install: (w) => {
                    timeline([{ name: 'n', entryType: 'navigation', loadEventEnd: 0 }])(w);
                    Object.defineProperty(w.Performance.prototype, 'now', { configurable: true, writable: true, value: () => 16000 });
                },
            });
            expect(stillLoading.ctx.events).toEqual([{ type: 'pageLoadTime_loadLoading' }]);
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
            const both = (/** @type {any} */ w) => {
                failedSheet(w);
                fonts(['error', 'loaded'])(w);
            };
            expect(run('', detector, { install: both }).ctx.entry.data).toEqual({ failedStylesheets: 1, failedFontFaces: 1 });
            // A `document.fonts` that throws fails `match`, since every operand is evaluated
            const throwingFonts = (/** @type {any} */ w) => {
                failedSheet(w);
                brokenFonts(w);
            };
            const throwing = run('', detector, { install: throwingFonts });
            expect(throwing.detected).toBe('aborted');
            expect(throwing.failedAt).toBe('match.any.1.api');
            const fontOnly = (/** @type {any} */ w) => {
                loadedSheet(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: fontOnly }).ctx.entry.data).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
            // An engine without responseStatus counts 0, a reading
            const noStatus = (/** @type {any} */ w) => {
                timeline([{ name: 'a.css', entryType: 'resource', initiatorType: 'link' }], { missing: ['responseStatus'] })(w);
                fonts(['error'])(w);
            };
            expect(run('', detector, { install: noStatus }).ctx.entry.data).toEqual({ failedStylesheets: 0, failedFontFaces: 1 });
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
            const entry = (/** @type {string} */ html) => {
                const { ctx } = run(html, detector, { install: imageState });
                return ctx.entry.written ? ctx.entry.data : undefined;
            };
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
            expect(result.ctx.entry.data).toEqual({ keywordCount: 2 });
            expect(result.ctx.events).toEqual([{ type: 'errorPhraseCount_count2Plus' }]);
        });
    });

    describe('WebDetection results', () => {
        /**
         * @param {any} detectors
         * @returns {WebDetection}
         */
        function createInstance(detectors) {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { webDetection: { detectors } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const instance = new WebDetection('webDetection', undefined, {}, args);
            instance.init();
            return instance;
        }

        // Frame detection reads window.self and window.top
        /** @type {any} */
        let originalWindow;
        beforeEach(() => {
            originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
        });
        afterEach(() => {
            globalThis.window = originalWindow;
        });

        const aborting = { ...FAILING, using: 'length', is: { gt: 0 } };

        it('lists an aborted detector in breakage results, with no data', () => {
            const instance = createInstance({
                g: { d: { match: aborting, actions: { breakageReportData: { data: { x: { value: 1 } } } } } },
            });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                { detectorId: 'g.d', errors: { 'match.api': 'aborted' } },
            ]);
        });

        it('lists a detector with no breakageReportData action once a run fails', () => {
            const instance = createInstance({ g: { d: { actions: [{ if: aborting, then: { fireEvent: { type: 't' } } }] } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([
                { detectorId: 'g.d', errors: { 'actions.0.if.api': 'aborted' } },
            ]);
        });

        it('lists no entry for a detector with no breakageReportData action that has not failed', () => {
            const instance = createInstance({ g: { d: { match: false, actions: { fireEvent: { type: 't' } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([]);
        });

        it('adds breakageReportData data on a match', () => {
            const instance = createInstance({ g: { d: { match: true, actions: { breakageReportData: { data: { x: { value: 1 } } } } } } });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', detected: true, data: { x: 1 } }]);
        });

        it('returns error for a detector that fails to parse', () => {
            const instance = createInstance({
                g: { d: { match: { element: { selector: 'img' }, using: 'length' }, actions: { breakageReportData: {} } } },
            });
            expect(instance.runDetectors({ trigger: 'breakageReport' })).toEqual([{ detectorId: 'g.d', errors: { parse: 'error' } }]);
        });

        it('fires nothing on an aborted `match`, and runs again on the next trigger', async () => {
            const detectors = { g: { d: { match: aborting, actions: { fireEvent: { type: 't' } } } } };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            const run = spyOn(instance, '_runDetector').and.callThrough();
            const detector = { groupName: 'g', detectorId: 'g.d', config: parseDetectors(/** @type {any} */ (detectors)).g.d };
            instance._runAutoDetector(detector, new TaskReadCache());
            instance._runAutoDetector(detector, new TaskReadCache());
            await Promise.resolve();
            expect(run).toHaveBeenCalledTimes(2);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });

        it('fires the event with its data on a match', async () => {
            const detectors = {
                g: { d: { match: true, actions: { fireEvent: { type: 't', data: { x: { value: 2, buckets: { two: 2 } } } } } } },
            };
            const instance = createInstance(detectors);
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            instance._runAutoDetector(
                { groupName: 'g', detectorId: 'g.d', config: parseDetectors(/** @type {any} */ (detectors)).g.d },
                new TaskReadCache(),
            );
            await Promise.resolve();
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 't', data: { x: 'two' } });
        });
    });
});
