import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amazonUrl, wikipediaUrl, regionalSites } from '../app/v4/data/regional-sites.js';

test('amazonUrl picks the store for the region, in any case', () => {
    assert.equal(amazonUrl('GB'), 'https://www.amazon.co.uk');
    assert.equal(amazonUrl('gb'), 'https://www.amazon.co.uk');
    assert.equal(amazonUrl('AT'), 'https://www.amazon.de');
    assert.equal(amazonUrl('NZ'), 'https://www.amazon.com.au');
});

test('amazonUrl falls back to amazon.com', () => {
    assert.equal(amazonUrl('KE'), 'https://www.amazon.com');
    assert.equal(amazonUrl(''), 'https://www.amazon.com');
    assert.equal(amazonUrl(null), 'https://www.amazon.com');
    assert.equal(amazonUrl(undefined), 'https://www.amazon.com');
    assert.equal(amazonUrl('constructor'), 'https://www.amazon.com');
});

test('wikipediaUrl uses the language, falling back to en', () => {
    assert.equal(wikipediaUrl('de'), 'https://de.wikipedia.org');
    assert.equal(wikipediaUrl('en'), 'https://en.wikipedia.org');
    assert.equal(wikipediaUrl(null), 'https://en.wikipedia.org');
    assert.equal(wikipediaUrl('../evil'), 'https://en.wikipedia.org');
});

test('regionalSites rewrites only Amazon and Wikipedia', () => {
    /** @type {import('../types/onboarding.ts').PickerSite[]} */
    const sites = [
        { id: 'youtube', url: 'https://www.youtube.com', title: 'YouTube', section: 'popular' },
        { id: 'wikipedia', url: 'https://en.wikipedia.org', title: 'Wikipedia', section: 'popular' },
        { id: 'amazon', url: 'https://www.amazon.com', title: 'Amazon', section: 'popular' },
    ];
    assert.deepEqual(
        regionalSites(sites, { locale: 'fr', region: 'FR' }).map((site) => site.url),
        ['https://www.youtube.com', 'https://fr.wikipedia.org', 'https://www.amazon.fr'],
    );
    assert.equal(sites[2]?.url, 'https://www.amazon.com', 'input is not mutated');
});
