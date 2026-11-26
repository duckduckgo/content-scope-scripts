import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostKey, existingSiteIds } from '../app/v4/data/existing-favorites.js';

/** @type {import('../types/onboarding.ts').TopSitesPickerSite} */
const gmail = { id: 'gmail', url: 'https://mail.google.com', title: 'Gmail', section: 'email' };
/** @type {import('../types/onboarding.ts').TopSitesPickerSite} */
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

test('existingSiteIds returns the ids of matching sites only', () => {
    assert.deepEqual(existingSiteIds([gmail, youtube], ['https://youtube.com/feed']), ['youtube']);
    assert.deepEqual(existingSiteIds([gmail, youtube], ['https://google.com']), []);
});

test('existingSiteIds skips malformed favorites', () => {
    assert.deepEqual(existingSiteIds([gmail, youtube], ['::', '', 'https://www.youtube.com']), ['youtube']);
});

test('m. hosts are a known miss', () => {
    assert.deepEqual(existingSiteIds([youtube], ['https://m.youtube.com']), []);
});

test('a site with a path needs the favorite under that path', () => {
    /** @type {import('../types/onboarding.ts').TopSitesPickerSite} */
    const bbcNews = { id: 'bbcNews', url: 'https://www.bbc.com/news', title: 'BBC News', section: 'popular' };
    assert.deepEqual(existingSiteIds([bbcNews], ['https://www.bbc.com']), []);
    assert.deepEqual(existingSiteIds([bbcNews], ['https://www.bbc.com/sport']), []);
    assert.deepEqual(existingSiteIds([bbcNews], ['https://www.bbc.com/newsround']), []);
    assert.deepEqual(existingSiteIds([bbcNews], ['https://bbc.com/news/']), ['bbcNews']);
    assert.deepEqual(existingSiteIds([bbcNews], ['https://www.bbc.com/news/world']), ['bbcNews']);
});
