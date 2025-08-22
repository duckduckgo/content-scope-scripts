import { describe, test, expect } from 'vitest';
import { processAttr } from './utils.js';

describe('processAttr', () => {
    describe('Basic types', () => {
        test('returns default value when configSetting is undefined', () => {
            expect(processAttr(undefined, 'default')).toBe('default');
        });

        test('returns default value when configSetting is not an object', () => {
            expect(processAttr('string', 'default')).toBe('default');
            expect(processAttr(123, 'default')).toBe('default');
            expect(processAttr(true, 'default')).toBe('default');
        });

        test('returns default value when configSetting has no type', () => {
            expect(processAttr({}, 'default')).toBe('default');
        });

        test('handles undefined type', () => {
            const configSetting = { type: 'undefined' };
            expect(processAttr(configSetting)).toBe(undefined);
        });

        test('handles string type', () => {
            const configSetting = { type: 'string', value: 'hello' };
            expect(processAttr(configSetting)).toBe('hello');
        });

        test('handles number type', () => {
            const configSetting = { type: 'number', value: 42 };
            expect(processAttr(configSetting)).toBe(42);
        });

        test('handles boolean type', () => {
            const configSetting = { type: 'boolean', value: true };
            expect(processAttr(configSetting)).toBe(true);
        });

        test('handles null type', () => {
            const configSetting = { type: 'null', value: null };
            expect(processAttr(configSetting)).toBe(null);
        });

        test('handles array type', () => {
            const configSetting = { type: 'array', value: [1, 2, 3] };
            expect(processAttr(configSetting)).toEqual([1, 2, 3]);
        });

        test('handles object type', () => {
            const configSetting = { type: 'object', value: { key: 'value' } };
            expect(processAttr(configSetting)).toEqual({ key: 'value' });
        });
    });

    describe('Function type', () => {
        test('handles function type with functionName', () => {
            const configSetting = { type: 'function', functionName: 'noop' };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toBe(undefined); // noop returns undefined
        });

        test('handles function type with functionValue', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'number',
                    value: 1
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toBe(1);
        });

        test('handles function type with complex functionValue', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'string',
                    value: 'hello world'
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toBe('hello world');
        });

        test('handles function type with nested object functionValue', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'object',
                    value: { message: 'test', count: 5 }
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toEqual({ message: 'test', count: 5 });
        });

        test('handles function type with array functionValue', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'array',
                    value: ['a', 'b', 'c']
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toEqual(['a', 'b', 'c']);
        });

        test('prefers functionName over functionValue when both are present', () => {
            const configSetting = {
                type: 'function',
                functionName: 'noop',
                functionValue: {
                    type: 'string',
                    value: 'should not be used'
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            expect(result()).toBe(undefined); // noop returns undefined
        });
    });

    describe('Async support', () => {
        test('handles async string', async () => {
            const configSetting = {
                type: 'string',
                value: 'boop',
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toBe('boop');
        });

        test('handles async number', async () => {
            const configSetting = {
                type: 'number',
                value: 123,
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toBe(123);
        });

        test('handles async boolean', async () => {
            const configSetting = {
                type: 'boolean',
                value: false,
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toBe(false);
        });

        test('handles async array', async () => {
            const configSetting = {
                type: 'array',
                value: [1, 2, 'test'],
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toEqual([1, 2, 'test']);
        });

        test('handles async object', async () => {
            const configSetting = {
                type: 'object',
                value: { key: 'async-value', nested: { prop: 'test' } },
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toEqual({ key: 'async-value', nested: { prop: 'test' } });
        });

        test('handles async null', async () => {
            const configSetting = {
                type: 'null',
                value: null,
                async: true
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            expect(await result).toBe(null);
        });

        test('non-async values should not be wrapped in Promise', () => {
            const configSetting = {
                type: 'string',
                value: 'not async'
            };
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(false);
            expect(result).toBe('not async');
        });
    });

    describe('Criteria support', () => {
        test('handles array with criteria selection - fallback case', () => {
            const configSetting = [
                {
                    type: 'string',
                    value: 'fallback',
                },
                {
                    type: 'string',
                    value: 'criteria-based',
                    criteria: { arch: 'SomeOtherArch' } // This won't match, so should use fallback
                }
            ];
            const result = processAttr(configSetting);
            expect(result).toBe('fallback');
        });

        test('handles async array with criteria selection - fallback case', async () => {
            const configSetting = [
                {
                    type: 'string',
                    value: 'fallback',
                    async: true
                },
                {
                    type: 'string',
                    value: 'criteria-based',
                    criteria: { arch: 'SomeOtherArch' }, // This won't match, so should use fallback
                    async: true
                }
            ];
            const result = processAttr(configSetting);
            expect(result instanceof Promise).toBe(true);
            const resolvedValue = await result;
            expect(resolvedValue).toBe('fallback');
        });
    });

    describe('Complex combinations', () => {
        test('handles function with async functionValue', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'string',
                    value: 'async result',
                    async: true
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            const functionResult = result();
            expect(functionResult instanceof Promise).toBe(true);
        });

        test('function returns correct async value', async () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'object',
                    value: { data: 'complex async object' },
                    async: true
                }
            };
            const result = processAttr(configSetting);
            const functionResult = result();
            expect(await functionResult).toEqual({ data: 'complex async object' });
        });

        test('nested function with nested processAttr calls', () => {
            const configSetting = {
                type: 'function',
                functionValue: {
                    type: 'function',
                    functionValue: {
                        type: 'number',
                        value: 42
                    }
                }
            };
            const result = processAttr(configSetting);
            expect(typeof result).toBe('function');
            const nestedFunction = result();
            expect(typeof nestedFunction).toBe('function');
            expect(nestedFunction()).toBe(42);
        });
    });
});
