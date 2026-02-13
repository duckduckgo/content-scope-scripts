import fc from 'fast-check';
import ConfigFeature from '../src/config-feature.js';
import { polyfillProcessGlobals } from './helpers/polyfill-process-globals.js';

polyfillProcessGlobals();

/**
 * Helper to create a ConfigFeature instance with the given args
 */
function createFeature(args = {}) {
    const defaultArgs = {
        site: {
            domain: args.domain || 'example.com',
            url: args.url || 'http://example.com/page',
        },
        platform: {
            name: args.platformName || 'extension',
            version: args.version,
            internal: args.internal,
            preview: args.preview,
        },
        featureSettings: args.featureSettings || {},
        // Use undefined bundledConfig to avoid overriding featureSettings in the constructor
        bundledConfig: args.bundledConfig,
        messagingContextName: 'contentScopeScripts',
        currentCohorts: args.currentCohorts || [],
    };
    return new ConfigFeature('testFeature', defaultArgs);
}

// --- Arbitraries ---

const hostnameLabel = () => fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);

const domainName = () =>
    fc.tuple(fc.array(hostnameLabel(), { minLength: 1, maxLength: 3 }), hostnameLabel()).map(([labels, tld]) => [...labels, tld].join('.'));

// --- _matchConditionalBlock ---

describe('ConfigFeature._matchConditionalBlock properties', () => {
    it('empty condition block always matches', () => {
        const feature = createFeature();
        expect(feature._matchConditionalBlock({})).toBeTrue();
    });

    it('unknown condition keys always fail (backwards compatibility)', () => {
        const knownKeys = [
            'domain',
            'context',
            'urlPattern',
            'experiment',
            'minSupportedVersion',
            'maxSupportedVersion',
            'injectName',
            'internal',
            'preview',
        ];
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-z]{3,20}$/).filter((s) => !knownKeys.includes(s)),
                (key) => {
                    const feature = createFeature();
                    const block = { [key]: 'anyvalue' };
                    expect(feature._matchConditionalBlock(block)).toBeFalse();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('domain condition matches when domain is a subdomain', () => {
        fc.assert(
            fc.property(hostnameLabel(), domainName(), (sub, parent) => {
                const subdomain = `${sub}.${parent}`;
                const feature = createFeature({ domain: subdomain });
                expect(feature._matchConditionalBlock({ domain: parent })).toBeTrue();
            }),
            { numRuns: 50 },
        );
    });

    it('domain condition with array always fails (explicit guard)', () => {
        const feature = createFeature({ domain: 'example.com' });
        expect(feature._matchConditionalBlock({ domain: ['example.com'] })).toBeFalse();
    });

    it('_matchConditionalBlockOrArray: single block delegates to _matchConditionalBlock', () => {
        const feature = createFeature();
        // Empty block matches
        expect(feature._matchConditionalBlockOrArray({})).toBeTrue();
        // Unknown key fails
        // @ts-expect-error - testing with unknown condition key
        expect(feature._matchConditionalBlockOrArray({ unknownKey: true })).toBeFalse();
    });

    it('_matchConditionalBlockOrArray: array returns true if any block matches', () => {
        const feature = createFeature({ domain: 'example.com' });
        // One matching, one not
        expect(feature._matchConditionalBlockOrArray([{ domain: 'other.com' }, { domain: 'example.com' }])).toBeTrue();
        // None matching
        expect(feature._matchConditionalBlockOrArray([{ domain: 'other.com' }, { domain: 'another.com' }])).toBeFalse();
    });
});

// --- version matching ---

describe('ConfigFeature version matching properties', () => {
    it('minSupportedVersion: current >= min returns true', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 50 }),
                fc.integer({ min: 0, max: 50 }),
                fc.integer({ min: 0, max: 50 }),
                (major, minor, patch) => {
                    const version = `${major}.${minor}.${patch}`;
                    const feature = createFeature({ version });
                    // same version should match
                    expect(feature._matchMinSupportedVersion({ minSupportedVersion: version })).toBeTrue();
                },
            ),
            { numRuns: 50 },
        );
    });

    it('maxSupportedVersion: current <= max returns true', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 50 }),
                fc.integer({ min: 0, max: 50 }),
                fc.integer({ min: 0, max: 50 }),
                (major, minor, patch) => {
                    const version = `${major}.${minor}.${patch}`;
                    const feature = createFeature({ version });
                    // same version should match
                    expect(feature._matchMaxSupportedVersion({ maxSupportedVersion: version })).toBeTrue();
                },
            ),
            { numRuns: 50 },
        );
    });

    it('missing version in condition block returns false', () => {
        const feature = createFeature({ version: '1.0.0' });
        expect(feature._matchMinSupportedVersion({})).toBeFalse();
        expect(feature._matchMaxSupportedVersion({})).toBeFalse();
    });
});

// --- experiment matching ---

describe('ConfigFeature experiment matching properties', () => {
    it('returns true when experiment and cohort match', () => {
        const feature = createFeature({
            currentCohorts: [{ feature: 'contentScopeExperiments', subfeature: 'myExperiment', cohort: 'treatment' }],
        });
        expect(
            feature._matchExperimentConditional({
                experiment: { experimentName: 'myExperiment', cohort: 'treatment' },
            }),
        ).toBeTrue();
    });

    it('returns false when experiment name does not match', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), (name) => {
                const feature = createFeature({
                    currentCohorts: [{ feature: 'contentScopeExperiments', subfeature: 'other', cohort: 'control' }],
                });
                if (name !== 'other') {
                    expect(
                        feature._matchExperimentConditional({
                            experiment: { experimentName: name, cohort: 'control' },
                        }),
                    ).toBeFalse();
                }
            }),
            { numRuns: 50 },
        );
    });

    it('returns false when no experiment in condition block', () => {
        const feature = createFeature();
        expect(feature._matchExperimentConditional({})).toBeFalse();
    });

    it('returns false when experiment is missing name or cohort', () => {
        const feature = createFeature();
        expect(feature._matchExperimentConditional({ experiment: {} })).toBeFalse();
        expect(feature._matchExperimentConditional({ experiment: { experimentName: 'test' } })).toBeFalse();
        expect(feature._matchExperimentConditional({ experiment: { cohort: 'test' } })).toBeFalse();
    });
});

// --- internal/preview matching ---

describe('ConfigFeature internal/preview matching properties', () => {
    it('internal matches when platform.internal matches condition', () => {
        const feature = createFeature({ internal: true });
        expect(feature._matchInternalConditional({ internal: true })).toBeTrue();
        expect(feature._matchInternalConditional({ internal: false })).toBeFalse();
    });

    it('preview matches when platform.preview matches condition', () => {
        const feature = createFeature({ preview: true });
        expect(feature._matchPreviewConditional({ preview: true })).toBeTrue();
        expect(feature._matchPreviewConditional({ preview: false })).toBeFalse();
    });

    it('internal/preview return false when condition is undefined', () => {
        const feature = createFeature();
        expect(feature._matchInternalConditional({})).toBeFalse();
        expect(feature._matchPreviewConditional({})).toBeFalse();
    });

    it('internal returns false when platform.internal is undefined', () => {
        const feature = createFeature();
        expect(feature._matchInternalConditional({ internal: true })).toBeFalse();
    });
});

// --- getFeatureSettingEnabled ---

describe('ConfigFeature.getFeatureSettingEnabled properties', () => {
    it('returns boolean for all state string values', () => {
        const states = ['enabled', 'disabled', 'internal', 'preview', 'unknown', ''];
        for (const state of states) {
            const feature = createFeature({
                featureSettings: {
                    testFeature: { toggle: state },
                },
            });
            const result = feature.getFeatureSettingEnabled('toggle');
            expect(typeof result).toBe('boolean');
        }
    });

    it('uses defaultState when setting does not exist', () => {
        const feature = createFeature({
            featureSettings: { testFeature: {} },
        });
        expect(feature.getFeatureSettingEnabled('nonExistent', 'enabled')).toBeTrue();
        expect(feature.getFeatureSettingEnabled('nonExistent', 'disabled')).toBeFalse();
        expect(feature.getFeatureSettingEnabled('nonExistent')).toBeFalse();
    });

    it('handles object state values with state field', () => {
        const feature = createFeature({
            featureSettings: {
                testFeature: {
                    myToggle: { state: 'enabled', otherData: 123 },
                },
            },
        });
        expect(feature.getFeatureSettingEnabled('myToggle')).toBeTrue();
    });
});
