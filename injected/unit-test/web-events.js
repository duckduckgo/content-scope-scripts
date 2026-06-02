import { WebEvents } from '../src/features/web-events.js';
import { buildExperimentsParameter } from '../src/features/web-events/experiments.js';

describe('WebEvents', () => {
    describe('fireEvent', () => {
        /**
         * @param {{ type: string, data?: Record<string, unknown> }} event
         * @returns {{ method: string, params: Record<string, any> }}
         */
        function captureNotify(event) {
            /** @type {{ method: string, params: Record<string, any> } | null} */
            let captured = null;
            const args = {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: {},
                featureSettings: {},
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const instance = new WebEvents('webEvents', undefined, {}, args);
            // @ts-expect-error - partial mock: only notify is needed for this test
            instance._messaging = {
                notify: (/** @type {string} */ method, /** @type {Record<string, any>} */ params) => {
                    captured = { method, params };
                },
            };
            instance.fireEvent(event);
            if (!captured) throw new Error('notify was not called');
            return captured;
        }

        it('sends correct method and params for a basic event', () => {
            const { method, params } = captureNotify({ type: 'adwall' });
            expect(method).toBe('webEvent');
            expect(params).toEqual({ type: 'adwall', data: {} });
        });

        it('forwards data field when provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: { extra: 'info' } });
            expect(params).toEqual({ type: 'adwall', data: { extra: 'info' } });
        });

        it('sends empty object for data when not provided', () => {
            const { params } = captureNotify({ type: 'adwall' });
            expect(params.data).toEqual({});
        });

        it('sends empty object for data when explicitly undefined', () => {
            const { params } = captureNotify({ type: 'adwall', data: undefined });
            expect(params.data).toEqual({});
        });

        it('preserves provided data object', () => {
            const { params } = captureNotify({ type: 'adwall', data: { detected: true, score: 0.9 } });
            expect(params.data).toEqual({ detected: true, score: 0.9 });
        });

        it('preserves empty data object when explicitly provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: {} });
            expect(params.data).toEqual({});
        });

        it('never includes nativeData in the params', () => {
            const { params } = captureNotify({ type: 'adwall' });
            expect('nativeData' in params).toBe(false);
        });

        it('never includes nativeData even when data is provided', () => {
            const { params } = captureNotify({ type: 'adwall', data: { foo: 'bar' } });
            expect('nativeData' in params).toBe(false);
        });

        it('strips unknown fields and never passes nativeData', () => {
            // Even if someone passes nativeData in the event object, fireEvent destructures
            // only { type, data }, so nativeData should never appear in the outgoing message.
            const { params } = captureNotify(/** @type {any} */ ({ type: 'adwall', nativeData: { bad: true } }));
            expect('nativeData' in params).toBe(false);
        });
    });
    describe('buildExperimentsParameter', () => {
        it('returns an empty object when there are no assignments', () => {
            expect(buildExperimentsParameter([])).toEqual({});
        });

        it('maps assignments to the canonical shape', () => {
            const result = buildExperimentsParameter([
                { name: 'contentScopeExperiment4', cohort: 'treatment' },
                { name: 'tdsNextExperiment008', cohort: 'control' },
            ]);
            expect(result).toEqual({
                contentScopeExperiment4: { cohort: 'treatment' },
                tdsNextExperiment008: { cohort: 'control' },
            });
        });

        it('includes changedInPeriod only when truthy', () => {
            const result = buildExperimentsParameter([
                { name: 'a', cohort: 'treatment', changedInPeriod: true },
                { name: 'b', cohort: 'control', changedInPeriod: false },
            ]);
            expect(result).toEqual({
                a: { cohort: 'treatment', changedInPeriod: true },
                b: { cohort: 'control' },
            });
        });

        it('filters by matchExperiments regex', () => {
            const assignments = [
                { name: 'tdsNextExperiment008', cohort: 'treatment' },
                { name: 'contentScopeExperiment4', cohort: 'control' },
                { name: 'someOtherExperiment', cohort: 'control' },
            ];
            const result = buildExperimentsParameter(assignments, '^(tdsNextExperiment|contentScopeExperiment)');
            expect(result).toEqual({
                tdsNextExperiment008: { cohort: 'treatment' },
                contentScopeExperiment4: { cohort: 'control' },
            });
        });

        it('returns an empty object for an invalid regex', () => {
            expect(buildExperimentsParameter([{ name: 'a', cohort: 'b' }], '([')).toEqual({});
        });

        it('ignores assignments missing a name or cohort', () => {
            const result = buildExperimentsParameter([
                { name: '', cohort: 'treatment' },
                { name: 'a', cohort: '' },
                { name: 'b', cohort: 'control' },
            ]);
            expect(result).toEqual({ b: { cohort: 'control' } });
        });
    });

    describe('getExperiments', () => {
        /**
         * @param {Array<{feature: string, cohort: string, subfeature: string}>} [currentCohorts]
         */
        function createFeature(currentCohorts) {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: {},
                featureSettings: {},
                bundledConfig: undefined,
                messagingContextName: 'test',
                currentCohorts,
            };
            return new WebEvents('webEvents', undefined, {}, args);
        }

        it('returns an empty object when there are no current cohorts', () => {
            expect(createFeature(undefined).getExperiments()).toEqual({});
            expect(createFeature([]).getExperiments()).toEqual({});
        });

        it('maps currentCohorts using the subfeature as the experiment name', () => {
            const feature = createFeature([
                { feature: 'contentScopeExperiments', subfeature: 'contentScopeExperiment4', cohort: 'treatment' },
            ]);
            expect(feature.getExperiments()).toEqual({ contentScopeExperiment4: { cohort: 'treatment' } });
        });

        it('applies matchExperiments filtering', () => {
            const feature = createFeature([
                { feature: 'contentScopeExperiments', subfeature: 'contentScopeExperiment4', cohort: 'treatment' },
                { feature: 'other', subfeature: 'someOtherExperiment', cohort: 'control' },
            ]);
            expect(feature.getExperiments({ matchExperiments: '^contentScopeExperiment' })).toEqual({
                contentScopeExperiment4: { cohort: 'treatment' },
            });
        });
    });
});
