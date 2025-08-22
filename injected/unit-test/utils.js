import {
    matchHostname,
    postDebugMessage,
    initStringExemptionLists,
    processConfig,
    satisfiesMinVersion,
    getTabHostname,
    processAttr,
} from '../src/utils.js';
import { polyfillProcessGlobals } from './helpers/polyfill-process-globals.js';

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
        });
    });

    it('does not enable features with state "preview"', () => {
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
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'undefined' };
                expect(processAttr(configSetting)).toBe(undefined);
            });

            it('handles string type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'string', value: 'hello' };
                expect(processAttr(configSetting)).toBe('hello');
            });

            it('handles number type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'number', value: 42 };
                expect(processAttr(configSetting)).toBe(42);
            });

            it('handles boolean type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'boolean', value: true };
                expect(processAttr(configSetting)).toBe(true);
            });

            it('handles null type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'null', value: null };
                expect(processAttr(configSetting)).toBe(null);
            });

            it('handles array type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'array', value: [1, 2, 3] };
                expect(processAttr(configSetting)).toEqual([1, 2, 3]);
            });

            it('handles object type', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'object', value: { key: 'value' } };
                expect(processAttr(configSetting)).toEqual({ key: 'value' });
            });
        });

        describe('Function type', () => {
            it('handles function type with functionName', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
                const configSetting = { type: 'function', functionName: 'noop' };
                const result = processAttr(configSetting);
                expect(typeof result).toBe('function');
                expect(result()).toBe(undefined); // noop returns undefined
            });

            it('handles function type with functionValue', () => {
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting[]} */
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
                /** @type {import('../src/utils.js').ConfigSetting[]} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
                /** @type {import('../src/utils.js').ConfigSetting} */
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
});
