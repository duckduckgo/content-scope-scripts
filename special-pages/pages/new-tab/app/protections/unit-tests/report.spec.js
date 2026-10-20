import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    frequencyOf,
    groupByPurpose,
    groupBySurface,
    hasPurposeData,
    namedCompanies,
    purposesFor,
    rankTopSites,
    typicalTopSite,
    googleReach,
    totalCompanies,
} from '../utils/report.js';

/**
 * @import { TrackerCompany } from "../../../types/new-tab"
 */

/** @type {TrackerCompany[]} */
const companies = [
    { displayName: 'Amazon.com', count: 198, sitesCount: 18, categories: ['Advertising', 'Ad Motivated Tracking'], fingerprinting: 1 },
    { displayName: 'Google', count: 812, sitesCount: 51, categories: ['Advertising', 'Analytics'], fingerprinting: 3 },
    {
        displayName: 'Facebook',
        count: 401,
        sitesCount: 29,
        categories: ['Advertising', 'Social Network', 'Action Pixels'],
        fingerprinting: 1,
    },
    { displayName: 'Hotjar', count: 21, sitesCount: 3, categories: ['Session Replay'], fingerprinting: 0 },
    { displayName: 'Cloudflare', count: 5, sitesCount: 4, categories: ['CDN'], fingerprinting: 0 },
    { displayName: '__other__', count: 46 },
];

test('namedCompanies drops the other bucket and sorts by reach, then count', () => {
    deepEqual(
        namedCompanies(companies).map((c) => c.displayName),
        ['Google', 'Facebook', 'Amazon.com', 'Cloudflare', 'Hotjar'],
    );
    /** @type {TrackerCompany[]} */
    const noReach = [
        { displayName: 'A', count: 1 },
        { displayName: 'B', count: 9 },
    ];
    deepEqual(
        namedCompanies(noReach).map((c) => c.displayName),
        ['B', 'A'],
    );
});

test('totalCompanies prefers the native total, which includes the other bucket', () => {
    equal(totalCompanies({ totalCompanies: 47, trackerCompanies: companies }), 47);
    equal(totalCompanies({ trackerCompanies: companies }), 5);
});

test('groupByPurpose sorts groups by number of companies, ties in display order', () => {
    deepEqual(groupByPurpose(companies), [
        { id: 'advertising', companies: ['Google', 'Facebook', 'Amazon'] },
        { id: 'social', companies: ['Facebook'] },
        { id: 'fingerprinting', companies: ['Google'] },
        { id: 'sessionReplay', companies: ['Hotjar'] },
        { id: 'analytics', companies: ['Google'] },
    ]);
    /** @type {TrackerCompany[]} */
    const replayHeavy = [
        { displayName: 'A', count: 1, categories: ['Session Replay', 'Advertising'] },
        { displayName: 'B', count: 1, categories: ['Session Replay', 'Analytics'] },
        { displayName: 'C', count: 1, categories: ['Session Replay', 'Analytics'] },
    ];
    deepEqual(
        groupByPurpose(replayHeavy).map((g) => g.id),
        ['sessionReplay', 'analytics', 'advertising'],
    );
});

test('non-tracking categories never produce a purpose', () => {
    deepEqual(groupByPurpose([{ displayName: 'Cloudflare', count: 5, categories: ['CDN', 'Embedded Content'] }]), []);
});

test('hasPurposeData is true when native data or the built-in table gives a company a purpose', () => {
    equal(hasPurposeData([{ displayName: 'Unknown Co', count: 1, fingerprinting: 3 }]), true);
    // data that maps to no purpose would leave the view empty
    equal(hasPurposeData([{ displayName: 'Unknown Co', count: 1, fingerprinting: 0 }]), false);
    equal(hasPurposeData([{ displayName: 'Unknown Co', count: 1, categories: ['CDN'] }]), false);
    // only the table's own entries match
    equal(hasPurposeData([{ displayName: 'constructor', count: 1 }]), false);
    equal(hasPurposeData([{ displayName: 'Google', count: 1, sitesCount: 1 }]), true);
    equal(hasPurposeData([{ displayName: 'Unknown Co', count: 1, sitesCount: 1 }]), false);
    // the __other__ bucket isn't a company
    equal(hasPurposeData([{ displayName: '__other__', count: 1 }]), false);
});

test('without native data, purposes come from the built-in table', () => {
    // case-insensitive, and matches names like `Amazon.com` as sent
    deepEqual(purposesFor({ displayName: 'GOOGLE', count: 1 }), ['advertising', 'fingerprinting', 'analytics']);
    deepEqual(purposesFor({ displayName: 'Amazon.com', count: 1 }), ['advertising', 'fingerprinting']);
    deepEqual(purposesFor({ displayName: 'Unknown Co', count: 1 }), []);
});

test('native data wins over the built-in table, even when it says less', () => {
    // only the analytics tracker was blocked this week
    deepEqual(purposesFor({ displayName: 'Google', count: 1, categories: ['Analytics'], fingerprinting: 0 }), ['analytics']);
    deepEqual(purposesFor({ displayName: 'Google', count: 1, categories: [] }), []);
});

test('purposesFor lists what one company does, in display order', () => {
    deepEqual(purposesFor(companies[2]), ['advertising', 'social']);
    // Advertising + Ad Motivated Tracking are the same purpose
    deepEqual(purposesFor(companies[0]), ['advertising']);
    deepEqual(purposesFor(companies[1]), ['advertising', 'fingerprinting', 'analytics']);
    deepEqual(purposesFor({ displayName: 'X', count: 1, categories: [] }), []);
});

test('frequencyOf rounds down to a familiar fraction', () => {
    equal(frequencyOf(64, 64).key, 'protections_report_freqNearlyAll');
    equal(frequencyOf(51, 64).key, 'protections_report_freqFourInFive');
    equal(frequencyOf(29, 64).key, 'protections_report_freqAlmostHalf');
    equal(frequencyOf(32, 64).key, 'protections_report_freqHalf');
    equal(frequencyOf(22, 64).key, 'protections_report_freqOneInThree');
    equal(frequencyOf(18, 64).key, 'protections_report_freqMoreThanOneInFour');
    equal(frequencyOf(13, 64).key, 'protections_report_freqOneInFive');
    deepEqual(frequencyOf(5, 64), { key: 'protections_report_freqSitesPlural', count: 5 });
});

test('frequencyOf uses plain counts when there are too few sites or no total', () => {
    deepEqual(frequencyOf(4, 5), { key: 'protections_report_freqSitesPlural', count: 4 });
    deepEqual(frequencyOf(1, undefined), { key: 'protections_report_freqSitesSingular' });
    // bad data from native should never claim "nearly every site"
    deepEqual(frequencyOf(80, 64), { key: 'protections_report_freqSitesPlural', count: 80 });
});

test('groupBySurface counts companies known to read each detail, from the built-in table', () => {
    const result = groupBySurface([
        { displayName: 'Google', count: 1 },
        { displayName: 'Facebook', count: 1 },
        { displayName: 'Unknown Co', count: 1 },
        { displayName: '__other__', count: 9 },
    ]);
    // Google reads all seven, Facebook reads screen + locale
    equal(result.total, 2);
    // most companies first, ties in display order
    deepEqual(result.surfaces, [
        { id: 'screen', count: 2 },
        { id: 'locale', count: 2 },
        { id: 'graphics', count: 1 },
        { id: 'fonts', count: 1 },
        { id: 'audio', count: 1 },
        { id: 'hardware', count: 1 },
        { id: 'voices', count: 1 },
    ]);
    deepEqual(groupBySurface([{ displayName: 'Unknown Co', count: 1 }]), { total: 0, surfaces: [] });
});

test('rankTopSites orders sites by company count and each site’s companies by weekly reach', () => {
    const ranked = rankTopSites({
        trackerCompanies: [
            { displayName: 'Hotjar', count: 5, sitesCount: 2 },
            { displayName: 'Google', count: 9, sitesCount: 10 },
            { displayName: 'Amazon.com', count: 3, sitesCount: 4 },
        ],
        topSites: [
            { etldPlusOne: 'small.com', trackerCompanies: ['Hotjar'] },
            { etldPlusOne: 'empty.com', trackerCompanies: [] },
            { etldPlusOne: 'big.com', trackerCompanies: ['Hotjar', 'Not Ranked', 'Amazon.com', 'Google', 'Google'] },
        ],
    });
    deepEqual(
        ranked.map((r) => r.site.etldPlusOne),
        ['big.com', 'small.com'],
    );
    // deduplicated, most widespread first, unranked last, display names tidied
    deepEqual(ranked[0].companies, ['Google', 'Amazon', 'Hotjar', 'Not Ranked']);
    deepEqual(rankTopSites({ trackerCompanies: [] }), []);
});

test('rankTopSites counts each named company once', () => {
    const ranked = rankTopSites({
        trackerCompanies: [],
        topSites: [
            { etldPlusOne: 'repeats.com', trackerCompanies: ['Google', 'Google', 'Google', '__other__'] },
            { etldPlusOne: 'varied.com', trackerCompanies: ['Google', 'Hotjar'] },
            { etldPlusOne: 'unnamed.com', trackerCompanies: ['__other__'] },
        ],
    });
    deepEqual(
        ranked.map((r) => [r.site.etldPlusOne, r.companies]),
        [
            ['varied.com', ['Google', 'Hotjar']],
            ['repeats.com', ['Google']],
        ],
    );
});

test('typicalTopSite stands for the sites where you were tracked most', () => {
    const trackerCompanies = Array.from({ length: 14 }, (_, i) => ({ displayName: `Co ${i}`, count: 1, sitesCount: 20 - i }));
    // 12 and 9 named companies (each counted once) on the two top sites: 11 on average (10.5, rounded)
    const site = typicalTopSite({
        trackerCompanies,
        topSites: [
            { etldPlusOne: 'a.com', trackerCompanies: [...trackerCompanies.slice(0, 12).map((c) => c.displayName), 'Co 0', '__other__'] },
            { etldPlusOne: 'b.com', trackerCompanies: trackerCompanies.slice(0, 9).map((c) => c.displayName) },
        ],
    });
    equal(site?.count, 11);
    // the top one or two sites, to name as examples
    deepEqual(site?.examples, ['a.com', 'b.com']);
    // the most widespread companies this week, no more than 7
    deepEqual(
        site?.companies,
        trackerCompanies.slice(0, 7).map((c) => c.displayName),
    );
    equal(typicalTopSite({ trackerCompanies }), null);
});

test('googleReach counts the sites Google was on', () => {
    deepEqual(googleReach({ totalSitesVisited: 64, trackerCompanies: [{ displayName: 'Google', count: 812, sitesCount: 51 }] }), {
        sites: 51,
        visited: 64,
    });
    equal(googleReach({ totalSitesVisited: 64, trackerCompanies: [{ displayName: 'Facebook', count: 1, sitesCount: 1 }] }), null);
    equal(googleReach({ trackerCompanies: [{ displayName: 'Google', count: 1, sitesCount: 1 }] }), null);
});
