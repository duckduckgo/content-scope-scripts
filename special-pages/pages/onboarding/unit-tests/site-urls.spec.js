import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiteUrl, resolveSiteUrls } from '../app/v4/data/site-urls.js';

/** @typedef {import('../types/onboarding.ts').TopSitesPickerSite} TopSitesPickerSite */

/** @type {TopSitesPickerSite} */
const store = {
    id: 'store',
    url: 'https://store.example',
    urlByRegion: { GB: 'https://store.example.co.uk' },
    urlTemplate: 'https://{locale}.store.example',
    title: 'Store',
    section: 'popular',
};

/** @type {TopSitesPickerSite} */
const plain = { id: 'plain', url: 'https://plain.example', title: 'Plain', section: 'popular' };

test('resolveSiteUrl picks the region entry, in any case', () => {
    assert.equal(resolveSiteUrl(store, { region: 'GB' }), 'https://store.example.co.uk');
    assert.equal(resolveSiteUrl(store, { region: 'gb' }), 'https://store.example.co.uk');
});

test('resolveSiteUrl prefers the region entry over the template', () => {
    assert.equal(resolveSiteUrl(store, { region: 'GB', locale: 'de' }), 'https://store.example.co.uk');
});

test('resolveSiteUrl fills the template with the locale, in any case', () => {
    assert.equal(resolveSiteUrl(store, { region: 'KE', locale: 'sv' }), 'https://sv.store.example');
    assert.equal(resolveSiteUrl(store, { locale: 'DE' }), 'https://de.store.example');
});

test('resolveSiteUrl keeps url when the locale is not a two-letter code', () => {
    assert.equal(resolveSiteUrl(store, { locale: '../x' }), 'https://store.example');
    assert.equal(resolveSiteUrl(store, { locale: 'deu' }), 'https://store.example');
    assert.equal(resolveSiteUrl(store, { region: null, locale: null }), 'https://store.example');
    assert.equal(resolveSiteUrl(store, { region: '', locale: '' }), 'https://store.example');
});

test('resolveSiteUrl ignores keys inherited from Object.prototype', () => {
    assert.equal(resolveSiteUrl(store, { region: '__proto__' }), 'https://store.example');
});

test('resolveSiteUrl keeps url for a site without variants', () => {
    assert.equal(resolveSiteUrl(plain, { region: 'GB', locale: 'de' }), 'https://plain.example');
});

test('resolveSiteUrls resolves every site and does not mutate the input', () => {
    const sites = [plain, store];
    assert.deepEqual(
        resolveSiteUrls(sites, { locale: 'fr' }).map((site) => site.url),
        ['https://plain.example', 'https://fr.store.example'],
    );
    assert.equal(sites[1]?.url, 'https://store.example', 'input is not mutated');
});
