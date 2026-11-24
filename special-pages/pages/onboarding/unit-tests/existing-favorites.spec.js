import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostKey, withoutExistingFavorites } from '../app/v4/data/existing-favorites.js';

/** @type {import('../types/onboarding.ts').PickerSite} */
const gmail = { id: 'gmail', url: 'https://mail.google.com', title: 'Gmail', section: 'email' };
/** @type {import('../types/onboarding.ts').PickerSite} */
const youtube = { id: 'youtube', url: 'https://www.youtube.com', title: 'YouTube', section: 'popular' };

test('hostKey drops one leading www.', () => {
    assert.equal(hostKey('https://www.youtube.com/feed'), 'youtube.com');
    assert.equal(hostKey('https://YouTube.com'), 'youtube.com');
    assert.equal(hostKey('https://mail.google.com'), 'mail.google.com');
});

test('hostKey returns null for unparseable input', () => {
    assert.equal(hostKey('not a url'), null);
    assert.equal(hostKey(''), null);
});

test('withoutExistingFavorites hides matching sites only', () => {
    assert.deepEqual(withoutExistingFavorites([gmail, youtube], ['https://youtube.com/feed']), [gmail]);
    assert.deepEqual(withoutExistingFavorites([gmail, youtube], ['https://google.com']), [gmail, youtube]);
});

test('withoutExistingFavorites skips malformed favorites', () => {
    assert.deepEqual(withoutExistingFavorites([gmail, youtube], ['::', '', 'https://www.youtube.com']), [gmail]);
});

test('m. hosts are a known miss', () => {
    assert.deepEqual(withoutExistingFavorites([youtube], ['https://m.youtube.com']), [youtube]);
});
