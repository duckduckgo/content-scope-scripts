import { deepEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { appendSubmittedId, chunk, orderPrompts } from '../components/suggested-prompts/suggestedPromptsOrder.js';

const prompts = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
const ids = (/** @type {{ id: string }[]} */ list) => list.map((prompt) => prompt.id);

test.describe('orderPrompts', () => {
    test('keeps the original order when nothing was submitted', () => {
        deepEqual(ids(orderPrompts(prompts, [])), ['a', 'b', 'c', 'd']);
    });

    test('moves submitted prompts to the end, oldest submission first', () => {
        deepEqual(ids(orderPrompts(prompts, ['c', 'a'])), ['b', 'd', 'c', 'a']);
    });

    test('ignores unknown IDs', () => {
        deepEqual(ids(orderPrompts(prompts, ['removed', 'b'])), ['a', 'c', 'd', 'b']);
    });
});

test.describe('appendSubmittedId', () => {
    test('appends a new ID', () => {
        deepEqual(appendSubmittedId(['a'], 'b'), ['a', 'b']);
    });

    test('moves a resubmitted ID to the end without duplicating it', () => {
        deepEqual(appendSubmittedId(['a', 'b', 'c'], 'a'), ['b', 'c', 'a']);
    });
});

test.describe('chunk', () => {
    test('splits into pages of the given size', () => {
        deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    });
});
