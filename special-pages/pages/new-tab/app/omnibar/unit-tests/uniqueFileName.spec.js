import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { uniqueFileName } from '../components/chat-tools/image-attachment/uniqueFileName.js';

test('uniqueFileName', async (t) => {
    await t.test('uses the base name when it is free', () => {
        equal(uniqueFileName('Screenshot', '.png', new Set()), 'Screenshot.png');
    });

    await t.test('numbers repeats from 2', () => {
        equal(uniqueFileName('Screenshot', '.png', new Set(['Screenshot.png'])), 'Screenshot 2.png');
        equal(uniqueFileName('Screenshot', '.png', new Set(['Screenshot.png', 'Screenshot 2.png'])), 'Screenshot 3.png');
    });

    await t.test('fills the first gap', () => {
        equal(uniqueFileName('Pasted image', '.png', new Set(['Pasted image.png', 'Pasted image 3.png'])), 'Pasted image 2.png');
    });

    await t.test('treats extensions as part of the name', () => {
        equal(uniqueFileName('Screenshot', '.jpg', new Set(['Screenshot.png'])), 'Screenshot.jpg');
    });
});
