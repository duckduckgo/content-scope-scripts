import BreakageReporting from '../src/features/breakage-reporting.js';

describe('BreakageReporting', () => {
    /** @type {any} */
    let originalDocument;
    beforeEach(() => {
        originalDocument = globalThis.document;
        // @ts-expect-error - mocking for test
        globalThis.document = { referrer: '' };
    });
    afterEach(() => {
        globalThis.document = originalDocument;
    });

    /**
     * File a breakage report against a stub webDetection, giving the `breakageData` it sends.
     *
     * @param {{ runDetectors: () => void, getBreakageReportData: () => unknown[] }} webDetection
     * @returns {Promise<unknown>}
     */
    async function fileReport(webDetection) {
        const stub = {
            ...webDetection,
            _exposedMethods: ['runDetectors', 'getBreakageReportData'],
            _ready: Promise.resolve({ status: 'ready' }),
        };
        const args = {
            site: { domain: 'example.com', url: 'https://example.com/page' },
            platform: {},
            // Off, as they read `window`
            featureSettings: { breakageReporting: { opener: 'disabled', reloaded: 'disabled' } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        // @ts-expect-error - stub features map for test
        const feature = new BreakageReporting('breakageReporting', undefined, { webDetection: stub }, args);
        /** @type {((value: unknown) => unknown) | undefined} */
        let onReport;
        /** @type {Promise<any>} */
        const result = new Promise((resolve) => {
            // @ts-expect-error - partial messaging stub
            feature._messaging = {
                subscribe(/** @type {string} */ _name, /** @type {(value: unknown) => unknown} */ callback) {
                    onReport = callback;
                    return () => {};
                },
                notify(/** @type {string} */ _name, /** @type {unknown} */ params) {
                    resolve(params);
                },
            };
        });
        feature.init();
        await onReport?.({});
        const { breakageData } = await result;
        return breakageData && JSON.parse(decodeURIComponent(breakageData));
    }

    it('reports the entries earlier runs wrote when the report run throws', async () => {
        const entries = [{ detectorId: 'g.d', detected: true }];
        const breakageData = await fileReport({
            runDetectors() {
                throw new Error('boom');
            },
            getBreakageReportData: () => entries,
        });
        expect(breakageData).toEqual({ webDetection: entries });
    });

    it('runs the detectors before it reads the entries', async () => {
        /** @type {string[]} */
        const calls = [];
        await fileReport({
            runDetectors: () => calls.push('run'),
            getBreakageReportData: () => {
                calls.push('read');
                return [];
            },
        });
        expect(calls).toEqual(['run', 'read']);
    });
});
