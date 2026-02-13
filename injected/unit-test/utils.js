import {
    matchHostname,
    postDebugMessage,
    initStringExemptionLists,
    processConfig,
    satisfiesMinVersion,
    isMaxSupportedVersion,
    getTabHostname,
    processAttr,
    isStateEnabled,
    withDefaults,
    withRetry,
    getStackTraceUrls,
    getStackTraceOrigins,
    isFeatureBroken,
    isPlatformSpecificFeature,
    isGloballyDisabled,
} from '../src/utils.js';
import { polyfillProcessGlobals } from './helpers/polyfill-process-globals.js';

/**
 * @typedef {import('../src/utils.js').ConfigSetting} ConfigSetting
 */

polyfillProcessGlobals();

describe('Helpers checks', () => {
    describe('matchHostname', () => {
        it('Expect results on matchHostnames', () => {
            expect(matchHostname('b.domain.com', 'domain.com')).toBeTrue();
            expect(matchHostname('domain.com', 'b.domain.com')).toBeFalse();
            expect(matchHostname('domain.com', 'domain.com')).toBeTrue();
            expect(matchHostname('a.b.c.e.f.domain.com', 'domain.com')).toBeTrue();
            expect(matchHostname('otherdomain.com', 'domain.com')).toBeFalse();
            expect(matchHostname('domain.com', 'otherdomain.com')).toBeFalse();
        });
    });

    it('processes config in expected way for minSupportedVersion and numeric versions', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {
                        beep: 'boop',
                    },
                    exceptions: [],
                },
                testFeatureTooBig: {
                    state: 'enabled',
                    minSupportedVersion: 100,
                    settings: {},
                    exceptions: [],
                },
                testFeatureSmall: {
                    state: 'enabled',
                    minSupportedVersion: 99,
                    settings: {},
                    exceptions: [],
                },
                testFeatureSmaller: {
                    state: 'enabled',
                    minSupportedVersion: 98,
                    settings: {
                        barp: true,
                    },
                    exceptions: [],
                },
                testFeatureOutlier: {
                    state: 'enabled',
                    minSupportedVersion: 97000,
                    settings: {},
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'android',
                },
                versionNumber: 99,
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig).toEqual({
            site: {
                domain: 'localhost',
                url: 'http://localhost:8080/',
                isBroken: false,
                allowlisted: false,
                // testFeatureTooBig is not enabled because it's minSupportedVersion is 100
                enabledFeatures: ['testFeature', 'testFeatureSmall', 'testFeatureSmaller'],
            },
            featureSettings: {
                testFeature: {
                    beep: 'boop',
                },
                testFeatureSmall: {},
                testFeatureSmaller: {
                    barp: true,
                },
            },
            platform: {
                name: 'android',
                version: 99,
            },
            versionNumber: 99,
            sessionKey: 'testSessionKey',
            bundledConfig: configIn,
            messagingContextName: 'contentScopeScripts',
        });
    });

    it('processes config in expected way for minSupportedVersion and string versions', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {
                        beep: 'boop',
                    },
                    exceptions: [],
                },
                testFeatureTooBig: {
                    state: 'enabled',
                    minSupportedVersion: '1.0.0',
                    settings: {},
                    exceptions: [],
                },
                testFeatureSmall: {
                    state: 'enabled',
                    minSupportedVersion: '0.9.9',
                    settings: {},
                    exceptions: [],
                },
                testFeatureSmaller: {
                    state: 'enabled',
                    minSupportedVersion: '0.9.8',
                    settings: {
                        barp: true,
                    },
                    exceptions: [],
                },
                testFeatureOutlier: {
                    state: 'enabled',
                    minSupportedVersion: '97.0.00',
                    settings: {},
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'ios',
                },
                versionString: '0.9.9',
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig).toEqual({
            site: {
                domain: 'localhost',
                url: 'http://localhost:8080/',
                isBroken: false,
                allowlisted: false,
                // testFeatureTooBig is not enabled because it's minSupportedVersion is 100
                enabledFeatures: ['testFeature', 'testFeatureSmall', 'testFeatureSmaller'],
            },
            featureSettings: {
                testFeature: {
                    beep: 'boop',
                },
                testFeatureSmall: {},
                testFeatureSmaller: {
                    barp: true,
                },
            },
            platform: {
                name: 'ios',
                version: '0.9.9',
            },
            versionString: '0.9.9',
            sessionKey: 'testSessionKey',
            bundledConfig: configIn,
            messagingContextName: 'contentScopeScripts',
        });
    });

    it('does not enable features with state "preview" when preview flag is not set', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {},
                    exceptions: [],
                },
                previewFeature: {
                    state: 'preview',
                    settings: {},
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'android',
                },
                versionNumber: 99,
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig.site.enabledFeatures).toEqual(['testFeature']);
        expect(processedConfig.featureSettings).toEqual({ testFeature: {} });
    });

    it('enables features with state "preview" when platform.preview is true', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {},
                    exceptions: [],
                },
                previewFeature: {
                    state: 'preview',
                    settings: { foo: 'bar' },
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'android',
                    preview: true,
                },
                versionNumber: 99,
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig.site.enabledFeatures).toEqual(['testFeature', 'previewFeature']);
        expect(processedConfig.featureSettings).toEqual({ testFeature: {}, previewFeature: { foo: 'bar' } });
    });

    it('does not enable features with state "internal" when internal flag is not set', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {},
                    exceptions: [],
                },
                internalFeature: {
                    state: 'internal',
                    settings: {},
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'android',
                },
                versionNumber: 99,
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig.site.enabledFeatures).toEqual(['testFeature']);
        expect(processedConfig.featureSettings).toEqual({ testFeature: {} });
    });

    it('enables features with state "internal" when platform.internal is true', () => {
        const configIn = {
            features: {
                testFeature: {
                    state: 'enabled',
                    settings: {},
                    exceptions: [],
                },
                internalFeature: {
                    state: 'internal',
                    settings: { baz: 'qux' },
                    exceptions: [],
                },
            },
            unprotectedTemporary: [],
        };
        const processedConfig = processConfig(
            configIn,
            [],
            {
                platform: {
                    name: 'android',
                    internal: true,
                },
                versionNumber: 99,
                sessionKey: 'testSessionKey',
            },
            [],
        );
        expect(processedConfig.site.enabledFeatures).toEqual(['testFeature', 'internalFeature']);
        expect(processedConfig.featureSettings).toEqual({ testFeature: {}, internalFeature: { baz: 'qux' } });
    });

    describe('utils.isStateEnabled', () => {
        it('returns true for "enabled" state regardless of platform flags', () => {
            expect(isStateEnabled('enabled', undefined)).toBeTrue();
            expect(isStateEnabled('enabled', { name: 'android' })).toBeTrue();
            expect(isStateEnabled('enabled', { name: 'android', internal: true })).toBeTrue();
            expect(isStateEnabled('enabled', { name: 'android', preview: true })).toBeTrue();
        });

        it('returns false for "disabled" state regardless of platform flags', () => {
            expect(isStateEnabled('disabled', undefined)).toBeFalse();
            expect(isStateEnabled('disabled', { name: 'android' })).toBeFalse();
            expect(isStateEnabled('disabled', { name: 'android', internal: true })).toBeFalse();
            expect(isStateEnabled('disabled', { name: 'android', preview: true })).toBeFalse();
        });

        it('returns true for "internal" state only when platform.internal is true', () => {
            expect(isStateEnabled('internal', undefined)).toBeFalse();
            expect(isStateEnabled('internal', { name: 'android' })).toBeFalse();
            expect(isStateEnabled('internal', { name: 'android', internal: false })).toBeFalse();
            expect(isStateEnabled('internal', { name: 'android', internal: true })).toBeTrue();
        });

        it('returns true for "preview" state only when platform.preview is true', () => {
            expect(isStateEnabled('preview', undefined)).toBeFalse();
            expect(isStateEnabled('preview', { name: 'android' })).toBeFalse();
            expect(isStateEnabled('preview', { name: 'android', preview: false })).toBeFalse();
            expect(isStateEnabled('preview', { name: 'android', preview: true })).toBeTrue();
        });

        it('returns false for unknown state values', () => {
            expect(isStateEnabled('unknown', { name: 'android' })).toBeFalse();
            expect(isStateEnabled(undefined, { name: 'android' })).toBeFalse();
            expect(isStateEnabled('', { name: 'android' })).toBeFalse();
        });
    });

    describe('utils.satisfiesMinVersion', () => {
        // Min version, Extension version, outcome
        /** @type {[string, string, boolean][]} */
        const cases = [
            ['12', '12', true],
            ['12', '13', true],
            ['12.1', '12.1', true],
            ['12.1.1', '12.1.1', true],
            ['12.1.1', '12.1.2', true],
            ['12.1.1', '12.2.0', true],
            ['13.12.12', '12.12.12', false],
            ['12.13.12', '12.12.12', false],
            ['12.12.13', '12.12.12', false],
            ['102.12.12', '102.12.11', false],
            ['102.12.12', '102.12.12', true],
            ['102.12.12', '102.12.13', true],
            ['102.12.12.1', '101', false],
            ['102.12.12.1', '103', true],
            ['102.12.12.1', '104', true],
            ['103', '102.12.12.1', false],
            ['101', '102.12.12.1', true],
            ['102.12.12.1', '102.13.12', true],
            ['102.12.12.1', '102.12.12', false],
            ['102.12.12.2', '102.12.12.1', false],
            ['102.12.12.1', '102.12.12.2', true],
            ['102.12.12.1', '102.12.12.1', true],
            ['102.12.12.1', '102.12.12.3', true],
            ['102.12.12.1', '102.12.12.1.1', true],
            ['102.12.12.1', '102.12.12.2.1', true],
            ['102.12.12.1', '102.12.12.1.1.1.1.1.1.1', true],
        ];
        for (const testCase of cases) {
            const [versionString, extensionVersionString, expectedOutcome] = testCase;
            it(`returns ${JSON.stringify(expectedOutcome)} for ${versionString} compared to ${extensionVersionString}`, () => {
                expect(satisfiesMinVersion(versionString, extensionVersionString)).toEqual(expectedOutcome);
            });
        }
    });

    describe('utils.isMaxSupportedVersion', () => {
        // Max version, Current version, outcome (should current version be allowed)
        /** @type {[string, string, boolean][]} */
        const stringCases = [
            ['12', '13', false],
            ['12', '12', true],
            ['12', '11', true],
            ['12.1', '12.2', false],
            ['12.1', '12.1', true],
            ['12.1', '12.0', true],
            ['12.1.1', '12.1.2', false],
            ['12.1.1', '12.1.1', true],
            ['12.1.1', '12.1.0', true],
            ['12.2.0', '12.2.1', false],
            ['12.2.0', '12.1.1', true],
            ['12.12.12', '13.12.12', false],
            ['12.12.12', '12.13.12', false],
            ['12.12.12', '12.12.13', false],
            ['12.12.12', '12.12.12', true],
            ['12.12.12', '12.12.11', true],
            ['102.12.11', '102.12.12', false],
            ['102.12.12', '102.12.12', true],
            ['102.12.13', '102.12.14', false],
            ['102.12.13', '102.12.12', true],
            ['101', '102.12.12.1', false],
            ['103', '102.12.12.1', true],
            ['104', '102.12.12.1', true],
            ['102.12.12.1', '103', false],
            ['102.12.12.1', '101', true],
            ['102.13.12', '102.14.12', false],
            ['102.13.12', '102.12.12.1', true],
            ['102.12.12', '102.12.12.1', false],
            ['102.12.12.1', '102.12.12.2', false],
            ['102.12.12.2', '102.12.12.3', false],
            ['102.12.12.2', '102.12.12.1', true],
            ['102.12.12.1', '102.12.12.1', true],
            ['102.12.12.3', '102.12.12.4', false],
            ['102.12.12.3', '102.12.12.1', true],
            ['102.12.12.1.1', '102.12.12.1.2', false],
            ['102.12.12.1.1', '102.12.12.1', true],
            ['102.12.12.2.1', '102.12.12.2.2', false],
            ['102.12.12.2.1', '102.12.12.1', true],
            ['102.12.12.1.1.1.1.1.1.1', '102.12.12.1.1.1.1.1.1.2', false],
            ['102.12.12.1.1.1.1.1.1.1', '102.12.12.1', true],
        ];
        for (const testCase of stringCases) {
            const [maxVersionString, currentVersionString, expectedOutcome] = testCase;
            it(`returns ${JSON.stringify(expectedOutcome)} for max version ${maxVersionString} with current ${currentVersionString}`, () => {
                expect(isMaxSupportedVersion(maxVersionString, currentVersionString)).toEqual(expectedOutcome);
            });
        }

        // Max version, Current version, outcome (integers)
        /** @type {[number, number, boolean][]} */
        const intCases = [
            [100, 99, true],
            [100, 100, true],
            [100, 101, false],
            [99, 99, true],
            [99, 98, true],
            [98, 99, false],
            [0, 0, true],
            [0, 1, false],
            [1, 0, true],
            [200, 199, true],
            [200, 201, false],
            [150, 150, true],
            [150, 151, false],
            [151, 150, true],
        ];
        for (const testCase of intCases) {
            const [maxVersion, currentVersion, expectedOutcome] = testCase;
            it(`returns ${JSON.stringify(expectedOutcome)} for max version ${maxVersion} with current ${currentVersion} (integers)`, () => {
                expect(isMaxSupportedVersion(maxVersion, currentVersion)).toEqual(expectedOutcome);
            });
        }
    });

    describe('utils.postDebugMessage', () => {
        const counters = new Map();
        globalThis.postMessage = (message) => {
            counters.set(message.action, (counters.get(message.action) || 0) + 1);
        };
        initStringExemptionLists({ debug: false });
        for (let i = 0; i < 10; i++) {
            postDebugMessage('testa', { ding: 1 });
            postDebugMessage('testa', { ding: 2 });
            postDebugMessage('testb', { boop: true });
            postDebugMessage('testc', { boop: true }, true);
        }
        it('does not trigger post messages without debug flag', () => {
            expect(counters.get('testa')).toEqual(undefined);
            expect(counters.get('testb')).toEqual(undefined);
            expect(counters.get('testc')).toEqual(10);
        });

        initStringExemptionLists({ debug: true });
        for (let i = 0; i < 6000; i++) {
            postDebugMessage('testd', { ding: 1 });
            postDebugMessage('testd', { ding: 2 });
            postDebugMessage('teste', { boop: true });
            postDebugMessage('testf', { boop: true }, true);
        }
        it('posts messages', () => {
            expect(counters.get('testd')).toEqual(5000);
            expect(counters.get('teste')).toEqual(5000);
            expect(counters.get('testf')).toEqual(5000);
        });
    });

    describe('utils.getTabHostname', () => {
        it('returns the hostname of the URL', () => {
            const hostname = getTabHostname();
            expect(hostname).toEqual('localhost');

            const reset = polyfillProcessGlobals('http://example.com');
            const hostname2 = getTabHostname();
            expect(hostname2).toEqual('example.com');
            reset();

            const hostname3 = getTabHostname();
            expect(hostname3).toEqual('localhost');

            // Validates when we're in a frame thats sandboxed so top is null
            const reset2 = polyfillProcessGlobals('https://bloop.com', ['http://example.com'], true);
            const hostname5 = getTabHostname();
            expect(hostname5).toEqual('example.com');
            reset2();
        });
    });

    describe('processAttr', () => {
        describe('Basic types', () => {
            it('returns default value when configSetting is undefined', () => {
                expect(processAttr(/** @type {any} */ (undefined), 'default')).toBe('default');
            });

            it('returns default value when configSetting is not an object', () => {
                expect(processAttr(/** @type {any} */ ('string'), 'default')).toBe('default');
                expect(processAttr(/** @type {any} */ (123), 'default')).toBe('default');
                expect(processAttr(/** @type {any} */ (true), 'default')).toBe('default');
            });

            it('returns default value when configSetting has no type', () => {
                expect(processAttr(/** @type {any} */ ({}), 'default')).toBe('default');
            });

            it('handles undefined type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'undefined' };
                expect(processAttr(configSetting)).toBe(undefined);
            });

            it('handles string type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'string', value: 'hello' };
                expect(processAttr(configSetting)).toBe('hello');
            });

            it('handles number type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'number', value: 42 };
                expect(processAttr(configSetting)).toBe(42);
            });

            it('handles boolean type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'boolean', value: true };
                expect(processAttr(configSetting)).toBe(true);
            });

            it('handles null type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'null', value: null };
                expect(processAttr(configSetting)).toBe(null);
            });

            it('handles array type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'array', value: [1, 2, 3] };
                expect(processAttr(configSetting)).toEqual([1, 2, 3]);
            });

            it('handles object type', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'object', value: { key: 'value' } };
                expect(processAttr(configSetting)).toEqual({ key: 'value' });
            });
        });

        describe('Function type', () => {
            it('handles function type with functionName', () => {
                /** @type {ConfigSetting} */
                const configSetting = { type: 'function', functionName: 'noop' };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toBe(undefined); // noop returns undefined
            });

            it('handles function type with functionValue', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'number',
                        value: 1,
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toBe(1);
            });

            it('handles function type with complex functionValue', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'string',
                        value: 'hello world',
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toBe('hello world');
            });

            it('handles function type with nested object functionValue', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'object',
                        value: { message: 'test', count: 5 },
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toEqual({ message: 'test', count: 5 });
            });

            it('handles function type with array functionValue', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'array',
                        value: ['a', 'b', 'c'],
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toEqual(['a', 'b', 'c']);
            });

            it('prefers functionName over functionValue when both are present', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionName: 'noop',
                    functionValue: {
                        type: 'string',
                        value: 'should not be used',
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toBe(undefined); // noop returns undefined
            });
        });

        describe('Async support', () => {
            it('handles async string', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'string',
                    value: 'boop',
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toBe('boop');
            });

            it('handles async number', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'number',
                    value: 123,
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toBe(123);
            });

            it('handles async boolean', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'boolean',
                    value: false,
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toBe(false);
            });

            it('handles async array', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'array',
                    value: [1, 2, 'test'],
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toEqual([1, 2, 'test']);
            });

            it('handles async object', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'object',
                    value: { key: 'async-value', nested: { prop: 'test' } },
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toEqual({ key: 'async-value', nested: { prop: 'test' } });
            });

            it('handles async null', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'null',
                    value: null,
                    async: true,
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toBe(null);
            });

            it('non-async values should not be wrapped in Promise', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'string',
                    value: 'not async',
                };
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(false);
                expect(result).toBe('not async');
            });
        });

        describe('Criteria support', () => {
            it('handles array with criteria selection - fallback case', () => {
                /** @type {ConfigSetting[]} */
                const configSetting = [
                    {
                        type: 'string',
                        value: 'fallback',
                    },
                    {
                        type: 'string',
                        value: 'criteria-based',
                        criteria: { arch: 'SomeOtherArch' }, // This won't match, so should use fallback
                    },
                ];
                const result = processAttr(configSetting);
                expect(result).toBe('fallback');
            });

            it('handles async array with criteria selection - fallback case', async () => {
                /** @type {ConfigSetting[]} */
                const configSetting = [
                    {
                        type: 'string',
                        value: 'fallback',
                        async: true,
                    },
                    {
                        type: 'string',
                        value: 'criteria-based',
                        criteria: { arch: 'SomeOtherArch' }, // This won't match, so should use fallback
                        async: true,
                    },
                ];
                const result = processAttr(configSetting);
                expect(result instanceof Promise).toBe(true);
                const resolvedValue = await result;
                expect(resolvedValue).toBe('fallback');
            });
        });

        describe('Complex combinations', () => {
            it('handles function with async functionValue', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'string',
                        value: 'async result',
                        async: true,
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                const functionResult = result();
                expect(functionResult instanceof Promise).toBe(true);
            });

            it('function returns correct async value', async () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'object',
                        value: { data: 'complex async object' },
                        async: true,
                    },
                };
                const result = processAttr(configSetting);
                const functionResult = result();
                const resolvedValue = await functionResult;
                expect(resolvedValue).toEqual({ data: 'complex async object' });
            });

            it('nested function with nested processAttr calls', () => {
                /** @type {ConfigSetting} */
                const configSetting = {
                    type: 'function',
                    functionValue: {
                        type: 'function',
                        functionValue: {
                            type: 'number',
                            value: 42,
                        },
                    },
                };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                const nestedFunction = result();
                expect(typeof nestedFunction).toBe('function');
                expect(nestedFunction()).toBe(42);
            });
        });
    });

    describe('withDefaults', () => {
        it('should return defaults when config is undefined', () => {
            const defaults = { a: 1, b: 2 };
            expect(withDefaults(defaults, undefined)).toEqual({ a: 1, b: 2 });
        });

        it('should return config when defaults is undefined', () => {
            expect(withDefaults(undefined, { a: 10 })).toEqual({ a: 10 });
        });

        it('should override primitive values with config', () => {
            const defaults = { a: 1, b: 2 };
            const config = { a: 10 };
            expect(withDefaults(defaults, config)).toEqual({ a: 10, b: 2 });
        });

        it('should deeply merge nested objects', () => {
            const defaults = {
                level1: {
                    a: 1,
                    level2: {
                        b: 2,
                        c: 3,
                    },
                },
            };
            const config = {
                level1: {
                    level2: {
                        b: 20,
                    },
                },
            };
            expect(withDefaults(defaults, config)).toEqual({
                level1: {
                    a: 1,
                    level2: {
                        b: 20,
                        c: 3,
                    },
                },
            });
        });

        it('should replace arrays entirely (not merge them)', () => {
            const defaults = { items: [1, 2, 3] };
            const config = { items: [4, 5] };
            expect(withDefaults(defaults, config)).toEqual({ items: [4, 5] });
        });

        it('should use default array when config value is undefined', () => {
            const defaults = { items: [1, 2, 3] };
            const config = {};
            expect(withDefaults(defaults, config)).toEqual({ items: [1, 2, 3] });
        });

        it('should handle config replacing object with primitive', () => {
            const defaults = { nested: { a: 1 } };
            const config = { nested: 'replaced' };
            expect(withDefaults(defaults, config)).toEqual({ nested: 'replaced' });
        });

        it('should handle config replacing primitive with object', () => {
            const defaults = { value: 'string' };
            const config = { value: { nested: true } };
            expect(withDefaults(defaults, config)).toEqual({ value: { nested: true } });
        });

        it('should allow additional keys from config', () => {
            const defaults = { a: 1, b: 2 };
            const config = { a: 10, c: 30 };
            expect(withDefaults(defaults, config)).toEqual({ a: 10, b: 2, c: 30 });
        });

        it('should allow additional keys from defaults', () => {
            const defaults = { a: 1, b: 2 };
            const config = { c: 30 };
            expect(withDefaults(defaults, config)).toEqual({ a: 1, b: 2, c: 30 });
        });

        it('should merge nested objects keeping additional keys from config', () => {
            const defaults = { outer: { inner: { a: 1 } } };
            const config = { outer: { inner: { a: 2, b: 3 } } };
            expect(withDefaults(defaults, config)).toEqual({ outer: { inner: { a: 2, b: 3 } } });
        });
    });

    describe('withRetry', () => {
        it('resolves when function returns a truthy value', async () => {
            /** @type {any} */
            const result = await withRetry(() => /** @type {any} */ ('success'), 3, 10, 'linear');
            expect(result).toBe('success');
        });

        it('retries and eventually resolves', async () => {
            let count = 0;
            /** @type {any} */
            const result = await withRetry(() => /** @type {any} */ (count++ >= 2 ? 'found' : null), 5, 10, 'linear');
            expect(result).toBe('found');
            expect(count).toBe(3);
        });

        it('rejects after max attempts with null return', async () => {
            await expectAsync(withRetry(() => /** @type {any} */ (null), 2, 10, 'linear')).toBeRejected();
        });

        it('rejects after max attempts with throwing function', async () => {
            await expectAsync(
                withRetry(
                    () => {
                        throw new Error('boom');
                    },
                    2,
                    10,
                    'linear',
                ),
            ).toBeRejected();
        });

        it('uses exponential backoff by default', async () => {
            let count = 0;
            /** @type {any} */
            const result = await withRetry(() => /** @type {any} */ (count++ >= 1 ? 'done' : null), 4, 10);
            expect(result).toBe('done');
        });
    });

    describe('getStackTraceUrls', () => {
        it('extracts https URLs from a stack trace', () => {
            const stack = `Error
    at Object.<anonymous> (https://example.com/script.js:10:5)
    at Module._compile (node:internal/modules:1:2)`;
            const urls = getStackTraceUrls(stack);
            expect(urls.size).toBe(1);
            const url = [...urls][0];
            expect(url.hostname).toBe('example.com');
        });

        it('extracts http URLs from a stack trace', () => {
            const stack = 'at test (http://localhost:3220/test.js:1:1)';
            const urls = getStackTraceUrls(stack);
            expect(urls.size).toBe(1);
        });

        it('returns empty set for stack without URLs', () => {
            const urls = getStackTraceUrls('Error\n    at <anonymous>:1:1');
            expect(urls.size).toBe(0);
        });
    });

    describe('getStackTraceOrigins', () => {
        it('returns hostnames from stack trace URLs', () => {
            const stack = `Error
    at fn (https://tracker.com/lib.js:1:1)
    at fn2 (https://other.com/app.js:2:3)`;
            const origins = getStackTraceOrigins(stack);
            expect(origins.has('tracker.com')).toBeTrue();
            expect(origins.has('other.com')).toBeTrue();
        });
    });

    describe('isFeatureBroken', () => {
        it('returns false when feature is in enabledFeatures', () => {
            /** @type {any} */
            const args = { site: { enabledFeatures: ['testFeature'] } };
            expect(isFeatureBroken(args, 'testFeature')).toBeFalse();
        });

        it('returns true when feature is not in enabledFeatures', () => {
            /** @type {any} */
            const args = { site: { enabledFeatures: ['other'] } };
            expect(isFeatureBroken(args, 'testFeature')).toBeTrue();
        });

        it('handles platform-specific features correctly', () => {
            /** @type {any} */
            const args = { site: { enabledFeatures: ['navigatorInterface'] } };
            expect(isFeatureBroken(args, 'navigatorInterface')).toBeFalse();

            /** @type {any} */
            const args2 = { site: { enabledFeatures: [] } };
            expect(isFeatureBroken(args2, 'navigatorInterface')).toBeTrue();
        });
    });

    describe('isPlatformSpecificFeature', () => {
        it('returns true for known platform features', () => {
            expect(isPlatformSpecificFeature('navigatorInterface')).toBeTrue();
            expect(isPlatformSpecificFeature('messageBridge')).toBeTrue();
            expect(isPlatformSpecificFeature('favicon')).toBeTrue();
        });

        it('returns false for non-platform features', () => {
            expect(isPlatformSpecificFeature('cookie')).toBeFalse();
            expect(isPlatformSpecificFeature('gpc')).toBeFalse();
        });
    });

    describe('isGloballyDisabled', () => {
        it('returns true when site is allowlisted', () => {
            expect(isGloballyDisabled({ site: { allowlisted: true, isBroken: false } })).toBeTrue();
        });

        it('returns true when site is broken', () => {
            expect(isGloballyDisabled({ site: { allowlisted: false, isBroken: true } })).toBeTrue();
        });

        it('returns false when neither', () => {
            expect(isGloballyDisabled({ site: { allowlisted: false, isBroken: false } })).toBeFalse();
        });
    });
});
