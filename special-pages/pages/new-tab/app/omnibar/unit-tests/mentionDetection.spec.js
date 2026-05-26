import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { detectActiveMention, removeMentionFromValue } from '../components/chat-tools/tab-attachment/mentionDetection.js';

test.describe('detectActiveMention', () => {
    test('returns null when there is no @ before the caret', () => {
        equal(detectActiveMention('hello world', 5), null);
    });

    test('detects an @ at the start of the input', () => {
        deepEqual(detectActiveMention('@mac', 4), { start: 0, end: 4, query: 'mac' });
    });

    test('detects an @ after whitespace', () => {
        deepEqual(detectActiveMention('hello @mac', 10), { start: 6, end: 10, query: 'mac' });
    });

    test('detects an @ after a newline', () => {
        deepEqual(detectActiveMention('hello\n@mac', 10), { start: 6, end: 10, query: 'mac' });
    });

    test('ignores an @ that is part of an email-like token', () => {
        equal(detectActiveMention('hello foo@bar', 13), null);
    });

    test('closes the mention once a space is typed', () => {
        equal(detectActiveMention('hello @mac air', 14), null);
    });

    test('detects an empty query immediately after @', () => {
        deepEqual(detectActiveMention('hi @', 4), { start: 3, end: 4, query: '' });
    });

    test('returns null when caret is before the @', () => {
        equal(detectActiveMention('@mac', 0), null);
    });
});

test.describe('removeMentionFromValue', () => {
    test('strips the @… range and returns a caret at the cut point', () => {
        const result = removeMentionFromValue('hello @mac world', { start: 6, end: 10, query: 'mac' });
        deepEqual(result, { value: 'hello  world', caret: 6 });
    });

    test('handles a mention at the start', () => {
        const result = removeMentionFromValue('@mac say hi', { start: 0, end: 4, query: 'mac' });
        deepEqual(result, { value: ' say hi', caret: 0 });
    });

    test('handles a mention with no following text', () => {
        const result = removeMentionFromValue('hi @mac', { start: 3, end: 7, query: 'mac' });
        deepEqual(result, { value: 'hi ', caret: 3 });
    });
});
