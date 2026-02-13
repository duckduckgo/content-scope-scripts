import fc from 'fast-check';
import {
    matchHostname,
    satisfiesMinVersion,
    isMaxSupportedVersion,
    stripVersion,
    processAttr,
    isStateEnabled,
    camelcase,
    iterateDataKey,
    isSupportedVersion,
    withDefaults,
} from '../src/utils.js';
import { polyfillProcessGlobals } from './helpers/polyfill-process-globals.js';

polyfillProcessGlobals();

// --- Arbitraries ---

/** Generate a valid hostname label (e.g. 'foo', 'bar123') */
const hostnameLabel = () => fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/);

/** Generate a valid domain name (e.g. 'foo.bar.com') */
const domainName = () =>
    fc.tuple(fc.array(hostnameLabel(), { minLength: 1, maxLength: 4 }), hostnameLabel()).map(([labels, tld]) => [...labels, tld].join('.'));

/** Generate a semantic version string (e.g. '1.2.3') */
const versionString = () =>
    fc
        .tuple(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }))
        .map(([a, b, c]) => `${a}.${b}.${c}`);

/** Generate a positive integer version */
const versionInt = () => fc.integer({ min: 0, max: 10000 });

/** Generate a dash-separated lowercase string for camelcase testing */
const dashCaseString = () => fc.array(fc.stringMatching(/^[a-z]{1,8}$/), { minLength: 1, maxLength: 5 }).map((parts) => parts.join('-'));

// --- matchHostname ---

describe('matchHostname properties', () => {
    it('is reflexive: any domain matches itself', () => {
        fc.assert(
            fc.property(domainName(), (domain) => {
                expect(matchHostname(domain, domain)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('subdomain always matches parent domain', () => {
        fc.assert(
            fc.property(hostnameLabel(), domainName(), (sub, domain) => {
                const subdomain = `${sub}.${domain}`;
                expect(matchHostname(subdomain, domain)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('parent domain does not match subdomain', () => {
        fc.assert(
            fc.property(hostnameLabel(), domainName(), (sub, domain) => {
                const subdomain = `${sub}.${domain}`;
                // parent should NOT match a subdomain exception
                expect(matchHostname(domain, subdomain)).toBeFalse();
            }),
            { numRuns: 100 },
        );
    });

    it('unrelated domains do not match', () => {
        fc.assert(
            fc.property(domainName(), domainName(), (a, b) => {
                // Only check when domains are truly unrelated
                if (a !== b && !a.endsWith(`.${b}`) && !b.endsWith(`.${a}`)) {
                    expect(matchHostname(a, b)).toBeFalse();
                }
            }),
            { numRuns: 100 },
        );
    });
});

// --- satisfiesMinVersion ---

describe('satisfiesMinVersion properties', () => {
    it('is reflexive: any version satisfies itself', () => {
        fc.assert(
            fc.property(versionString(), (v) => {
                expect(satisfiesMinVersion(v, v)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('higher major version always satisfies lower min', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 50 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                (minMajor, minMinor, minPatch, appMinor, appPatch) => {
                    const minVersion = `${minMajor}.${minMinor}.${minPatch}`;
                    const appVersion = `${minMajor + 1}.${appMinor}.${appPatch}`;
                    expect(satisfiesMinVersion(minVersion, appVersion)).toBeTrue();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('lower major version never satisfies higher min', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 50 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                (minMajor, minMinor, minPatch, appMinor, appPatch) => {
                    const minVersion = `${minMajor}.${minMinor}.${minPatch}`;
                    const appVersion = `${minMajor - 1}.${appMinor}.${appPatch}`;
                    expect(satisfiesMinVersion(minVersion, appVersion)).toBeFalse();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('is transitive: if a >= b and b >= c then a >= c', () => {
        fc.assert(
            fc.property(versionString(), versionString(), versionString(), (a, b, c) => {
                if (satisfiesMinVersion(b, a) && satisfiesMinVersion(c, b)) {
                    expect(satisfiesMinVersion(c, a)).toBeTrue();
                }
            }),
            { numRuns: 200 },
        );
    });
});

// --- isSupportedVersion ---

describe('isSupportedVersion properties', () => {
    it('handles string versions consistently with satisfiesMinVersion', () => {
        fc.assert(
            fc.property(versionString(), versionString(), (min, current) => {
                expect(isSupportedVersion(min, current)).toBe(satisfiesMinVersion(min, current));
            }),
            { numRuns: 100 },
        );
    });

    it('handles numeric versions: min <= current', () => {
        fc.assert(
            fc.property(versionInt(), versionInt(), (min, current) => {
                expect(isSupportedVersion(min, current)).toBe(min <= current);
            }),
            { numRuns: 100 },
        );
    });

    it('returns false for mismatched types', () => {
        fc.assert(
            fc.property(versionString(), versionInt(), (strVersion, intVersion) => {
                expect(isSupportedVersion(strVersion, intVersion)).toBeFalse();
                expect(isSupportedVersion(intVersion, strVersion)).toBeFalse();
            }),
            { numRuns: 50 },
        );
    });
});

// --- isMaxSupportedVersion ---

describe('isMaxSupportedVersion properties', () => {
    it('is reflexive for string versions', () => {
        fc.assert(
            fc.property(versionString(), (v) => {
                expect(isMaxSupportedVersion(v, v)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('is reflexive for numeric versions', () => {
        fc.assert(
            fc.property(versionInt(), (v) => {
                expect(isMaxSupportedVersion(v, v)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });

    it('lower current version satisfies max version (numeric)', () => {
        fc.assert(
            fc.property(versionInt(), fc.integer({ min: 0, max: 5000 }), (max, delta) => {
                const current = max > delta ? max - delta : 0;
                expect(isMaxSupportedVersion(max, current)).toBeTrue();
            }),
            { numRuns: 100 },
        );
    });
});

// --- stripVersion ---

describe('stripVersion properties', () => {
    it('output has same number of components as input', () => {
        fc.assert(
            fc.property(versionString(), fc.integer({ min: 1, max: 3 }), (v, keep) => {
                const result = stripVersion(v, keep);
                expect(result.split('.').length).toBe(v.split('.').length);
            }),
            { numRuns: 100 },
        );
    });

    it('with keepComponents=1, at most one non-zero component', () => {
        fc.assert(
            fc.property(versionString(), (v) => {
                const result = stripVersion(v, 1);
                const nonZero = result.split('.').filter((c) => c !== '0');
                expect(nonZero.length).toBeLessThanOrEqual(1);
            }),
            { numRuns: 100 },
        );
    });
});

// --- camelcase ---

describe('camelcase properties', () => {
    it('output never contains hyphens', () => {
        fc.assert(
            fc.property(dashCaseString(), (input) => {
                const result = camelcase(input);
                expect(result).not.toContain('-');
            }),
            { numRuns: 100 },
        );
    });

    it('preserves first character', () => {
        fc.assert(
            fc.property(dashCaseString(), (input) => {
                const result = camelcase(input);
                expect(result[0]).toBe(input[0]);
            }),
            { numRuns: 100 },
        );
    });
});

// --- processAttr ---

describe('processAttr properties', () => {
    it('returns defaultValue when configSetting is undefined', () => {
        fc.assert(
            fc.property(fc.anything(), (defaultVal) => {
                // @ts-expect-error - testing undefined configSetting
                expect(processAttr(undefined, defaultVal)).toBe(defaultVal);
            }),
            { numRuns: 50 },
        );
    });

    it('returns number value for type:number', () => {
        fc.assert(
            fc.property(fc.double({ noNaN: true }), (n) => {
                const result = processAttr({ type: 'number', value: n }, undefined);
                expect(result).toBe(n);
            }),
            { numRuns: 50 },
        );
    });

    it('returns string value for type:string', () => {
        fc.assert(
            fc.property(fc.string(), (s) => {
                const result = processAttr({ type: 'string', value: s }, undefined);
                expect(result).toBe(s);
            }),
            { numRuns: 50 },
        );
    });

    it('returns boolean value for type:boolean', () => {
        fc.assert(
            fc.property(fc.boolean(), (b) => {
                const result = processAttr({ type: 'boolean', value: b }, undefined);
                expect(result).toBe(b);
            }),
            { numRuns: 10 },
        );
    });

    it('returns undefined for type:undefined', () => {
        const result = processAttr({ type: 'undefined' }, 'fallback');
        expect(result).toBeUndefined();
    });

    it('returns defaultValue for non-object types', () => {
        fc.assert(
            fc.property(fc.integer(), fc.string(), (val, defaultVal) => {
                // @ts-expect-error - testing with primitive as configSetting
                expect(processAttr(val, defaultVal)).toBe(defaultVal);
            }),
            { numRuns: 50 },
        );
    });

    it('returns defaultValue for object without type', () => {
        // @ts-expect-error - testing with object missing required 'type' property
        expect(processAttr({ value: 'test' }, 'default')).toBe('default');
    });
});

// --- isStateEnabled ---

describe('isStateEnabled properties', () => {
    it('enabled always returns true regardless of platform', () => {
        fc.assert(
            fc.property(fc.anything(), (platform) => {
                // @ts-expect-error - testing with arbitrary platform values
                expect(isStateEnabled('enabled', platform)).toBeTrue();
            }),
            { numRuns: 20 },
        );
    });

    it('disabled always returns false regardless of platform', () => {
        fc.assert(
            fc.property(fc.anything(), (platform) => {
                // @ts-expect-error - testing with arbitrary platform values
                expect(isStateEnabled('disabled', platform)).toBeFalse();
            }),
            { numRuns: 20 },
        );
    });

    it('internal returns true only when platform.internal is true', () => {
        expect(isStateEnabled('internal', { name: 'extension', internal: true })).toBeTrue();
        expect(isStateEnabled('internal', { name: 'extension', internal: false })).toBeFalse();
        expect(isStateEnabled('internal', { name: 'extension' })).toBeFalse();
        expect(isStateEnabled('internal', undefined)).toBeFalse();
    });

    it('preview returns true only when platform.preview is true', () => {
        expect(isStateEnabled('preview', { name: 'extension', preview: true })).toBeTrue();
        expect(isStateEnabled('preview', { name: 'extension', preview: false })).toBeFalse();
        expect(isStateEnabled('preview', { name: 'extension' })).toBeFalse();
        expect(isStateEnabled('preview', undefined)).toBeFalse();
    });

    it('unknown states return false', () => {
        fc.assert(
            fc.property(
                fc.string().filter((s) => !['enabled', 'disabled', 'internal', 'preview'].includes(s)),
                (state) => {
                    expect(isStateEnabled(state, { name: 'extension' })).toBeFalse();
                },
            ),
            { numRuns: 50 },
        );
    });
});

// --- iterateDataKey ---

describe('iterateDataKey properties', () => {
    it('is deterministic: same key produces same callback sequence', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), (key) => {
                const calls1 = [];
                const calls2 = [];
                iterateDataKey(key, (item, byte) => {
                    calls1.push([item, byte]);
                });
                iterateDataKey(key, (item, byte) => {
                    calls2.push([item, byte]);
                });
                expect(calls1).toEqual(calls2);
            }),
            { numRuns: 50 },
        );
    });

    it('total iterations equals key.length * 9 when not exiting early', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 20 }), (key) => {
                let count = 0;
                iterateDataKey(key, () => {
                    count++;
                });
                expect(count).toBe(key.length * 9);
            }),
            { numRuns: 50 },
        );
    });

    it('respects early exit when callback returns null', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 1, max: 20 }), (key, stopAfter) => {
                const maxIterations = key.length * 9;
                const effectiveStop = Math.min(stopAfter, maxIterations);
                let count = 0;
                iterateDataKey(key, () => {
                    count++;
                    return count >= effectiveStop ? null : undefined;
                });
                expect(count).toBe(effectiveStop);
            }),
            { numRuns: 50 },
        );
    });
});

// --- withDefaults ---

describe('withDefaults properties', () => {
    it('returns defaults when config is undefined', () => {
        fc.assert(
            fc.property(fc.anything(), (defaults) => {
                const result = withDefaults(defaults, undefined);
                // Use Object.is to handle NaN correctly
                expect(Object.is(result, defaults)).toBeTrue();
            }),
            { numRuns: 50 },
        );
    });

    it('config values take precedence over defaults for flat objects', () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), fc.string(), (key, defaultVal, configVal) => {
                const defaults = { [key]: defaultVal };
                const config = { [key]: configVal };
                const result = withDefaults(defaults, config);
                expect(result[key]).toBe(configVal);
            }),
            { numRuns: 50 },
        );
    });

    it('defaults fill in missing config keys', () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (key, val) => {
                const defaults = { [key]: val, extra: 'default' };
                const config = { [key]: 'override' };
                const result = withDefaults(defaults, config);
                expect(result.extra).toBe('default');
                expect(result[key]).toBe('override');
            }),
            { numRuns: 50 },
        );
    });

    it('returns config directly when defaults is undefined', () => {
        fc.assert(
            fc.property(fc.anything(), (config) => {
                const result = withDefaults(undefined, config);
                expect(Object.is(result, config)).toBeTrue();
            }),
            { numRuns: 20 },
        );
    });

    it('arrays in config replace arrays in defaults (no merge)', () => {
        const result = withDefaults({ items: [1, 2, 3] }, { items: [4, 5] });
        expect(result.items).toEqual([4, 5]);
    });
});
