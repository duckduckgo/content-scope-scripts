import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    DEFAULT_PROMPT_LIMITS,
    isConvertibleTextPaste,
    promptLength,
    resolvePromptLimits,
    textPastedSummary,
} from '../components/chat-tools/text-pasted/textPasted.js';

test.describe('resolvePromptLimits', () => {
    test('defaults when absent', () => {
        deepEqual(resolvePromptLimits(undefined), DEFAULT_PROMPT_LIMITS);
        deepEqual(resolvePromptLimits(null), { pasteConversionThreshold: 4000, maxCharacters: 16000 });
    });

    test('uses native values', () => {
        deepEqual(resolvePromptLimits({ pasteConversionThreshold: 100, maxCharacters: 500 }), {
            pasteConversionThreshold: 100,
            maxCharacters: 500,
        });
    });

    test('falls back per field for invalid values', () => {
        deepEqual(resolvePromptLimits({ pasteConversionThreshold: 0, maxCharacters: 500 }), {
            pasteConversionThreshold: 500,
            maxCharacters: 500,
        });
        deepEqual(resolvePromptLimits({ pasteConversionThreshold: 100, maxCharacters: -1 }), {
            pasteConversionThreshold: 100,
            maxCharacters: 16000,
        });
        deepEqual(resolvePromptLimits({ pasteConversionThreshold: 1.5, maxCharacters: 500 }), {
            pasteConversionThreshold: 500,
            maxCharacters: 500,
        });
    });

    test('keeps the threshold within the max', () => {
        deepEqual(resolvePromptLimits({ pasteConversionThreshold: 900, maxCharacters: 500 }), {
            pasteConversionThreshold: 500,
            maxCharacters: 500,
        });
    });
});

test.describe('isConvertibleTextPaste', () => {
    test('converts at the threshold', () => {
        equal(isConvertibleTextPaste('a'.repeat(9), 10), false);
        equal(isConvertibleTextPaste('a'.repeat(10), 10), true);
    });

    test('never converts whitespace only', () => {
        equal(isConvertibleTextPaste(' \n\t'.repeat(10), 10), false);
    });

    test('counts UTF-16 code units', () => {
        equal(isConvertibleTextPaste('😀'.repeat(5), 10), true);
    });
});

test.describe('promptLength', () => {
    test('adds typed text and every paste', () => {
        equal(promptLength('abc', []), 3);
        equal(promptLength('abc', [{ content: '12345' }, { content: '67' }]), 10);
    });
});

test.describe('textPastedSummary', () => {
    test('takes the first line', () => {
        equal(textPastedSummary('  hello\nworld'), 'hello…');
    });

    test('caps long lines', () => {
        equal(textPastedSummary('a'.repeat(100)), `${'a'.repeat(60)}…`);
    });

    test('is empty for whitespace', () => {
        equal(textPastedSummary(' \n '), '');
    });
});
