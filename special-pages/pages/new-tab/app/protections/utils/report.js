import { DDG_STATS_OTHER_COMPANY_IDENTIFIER } from '../../privacy-stats/constants.js';
import { displayNameForCompany } from '../../privacy-stats/privacy-stats.utils.js';
import { FINGERPRINTING_THRESHOLD, PURPOSES } from './purposes.js';
import { PURPOSE_ORDER, SURFACE_ORDER, TRACKER_PURPOSES, TRACKER_SURFACES } from '../data/tracker-purposes.js';

export { FINGERPRINTING_THRESHOLD, PURPOSES };

/**
 * @import { TrackerCompany, PrivacyStatsData, SiteTrackers } from "../../../types/new-tab"
 * @typedef {import('./purposes.js').PurposeId} PurposeId
 * @typedef {import('./purposes.js').SurfaceId} SurfaceId
 */

/** Rows shown in the "Who we blocked the most" view */
export const TOP_COMPANIES_LIMIT = 4;

/** Logos in the "N more companies" row that closes the "Who we blocked the most" view */
export const MORE_COMPANIES_AVATAR_LIMIT = 3;

/** Names listed under the "N more companies" row, eg: "Including Criteo, Oracle, and The Trade Desk" */
export const MORE_COMPANIES_NAME_LIMIT = 3;

/** Company avatars shown per row in the "Why we blocked them" view */
export const PURPOSE_AVATAR_LIMIT = 3;

/** Sites shown in "Which sites had the most trackers": the top one, then a short list */
export const TOP_SITES_LIMIT = 5;

/** Company logos circling the top site */
export const TOP_SITE_ORBIT_LIMIT = 12;

/** Company logos next to each of the other sites */
export const SITE_AVATAR_LIMIT = 3;

/**
 * Below this many visited sites, ratios like "1 in 3" are misleading, so we
 * show the plain site count instead.
 */
export const MIN_SITES_FOR_RATIO = 10;

/**
 * @param {TrackerCompany} company
 */
export function isFingerprinting(company) {
    return (company.fingerprinting ?? 0) >= FINGERPRINTING_THRESHOLD;
}

/**
 * Named companies only (drops the `__other__` bucket), most widespread first.
 * Sorted by `sitesCount` when present, then by blocked `count`.
 *
 * @param {TrackerCompany[]} companies
 * @return {TrackerCompany[]}
 */
export function namedCompanies(companies) {
    return companies
        .filter((c) => c.displayName !== DDG_STATS_OTHER_COMPANY_IDENTIFIER)
        .sort((a, b) => (b.sitesCount ?? 0) - (a.sitesCount ?? 0) || b.count - a.count);
}

/**
 * @param {PrivacyStatsData} data
 * @return {number}
 */
export function totalCompanies(data) {
    return data.totalCompanies ?? namedCompanies(data.trackerCompanies).length;
}

/**
 * True when native sent this company's own Tracker Radar data. That's exact
 * (it covers the trackers actually blocked), so it wins over the built-in table.
 *
 * @param {TrackerCompany} company
 */
function hasNativePurposeData(company) {
    return company.categories !== undefined || company.fingerprinting !== undefined;
}

/**
 * What the company's trackers generally do, from the table built from Tracker
 * Radar (see `special-pages/tracker-purposes.mjs`). `null` when it isn't listed.
 *
 * @param {TrackerCompany} company
 * @return {Set<PurposeId> | null}
 */
function builtInPurposes(company) {
    const mask = TRACKER_PURPOSES[company.displayName.toLowerCase()];
    if (mask === undefined) return null;
    return new Set(PURPOSE_ORDER.filter((_, bit) => mask & (1 << bit)));
}

/**
 * True when we can say what at least one company was trying to do, from
 * native data or the built-in table.
 *
 * @param {TrackerCompany[]} companies
 */
export function hasPurposeData(companies) {
    return namedCompanies(companies).some((c) => hasNativePurposeData(c) || builtInPurposes(c) !== null);
}

/**
 * @typedef {object} PurposeGroup
 * @property {PurposeId} id
 * @property {string[]} companies - display names, most widespread first
 */

/**
 * @param {TrackerCompany} company
 * @param {(typeof PURPOSES)[number]} purpose
 */
function hasPurpose(company, purpose) {
    if (!hasNativePurposeData(company)) return builtInPurposes(company)?.has(purpose.id) ?? false;
    if (purpose.id === 'fingerprinting') return isFingerprinting(company);
    return company.categories?.some((cat) => purpose.categories.includes(cat)) ?? false;
}

/**
 * Groups companies by what their trackers were trying to do, most companies
 * first. A company can appear in several groups. Empty groups are dropped.
 *
 * @param {TrackerCompany[]} companies
 * @return {PurposeGroup[]}
 */
export function groupByPurpose(companies) {
    const named = namedCompanies(companies);
    return PURPOSES.map((purpose) => ({
        id: purpose.id,
        companies: named.filter((c) => hasPurpose(c, purpose)).map((c) => displayNameForCompany(c.displayName)),
    }))
        .filter((group) => group.companies.length > 0)
        .sort((a, b) => b.companies.length - a.companies.length);
}

/**
 * What a single company's trackers were trying to do, in `PURPOSES` order.
 *
 * @param {TrackerCompany} company
 * @return {PurposeId[]}
 */
export function purposesFor(company) {
    return PURPOSES.filter((purpose) => hasPurpose(company, purpose)).map((p) => p.id);
}

/**
 * How widespread a company was, as a translation key + replacements.
 * Ratios are rounded down to a familiar fraction so we never overstate.
 *
 * @param {number} sitesCount - sites this company was on
 * @param {number | undefined} totalSitesVisited - all sites visited
 * @return {{key: FrequencyKey, count?: number}}
 *
 * @typedef {'protections_report_freqNearlyAll'
 *   | 'protections_report_freqFourInFive'
 *   | 'protections_report_freqTwoInThree'
 *   | 'protections_report_freqMoreThanHalf'
 *   | 'protections_report_freqHalf'
 *   | 'protections_report_freqAlmostHalf'
 *   | 'protections_report_freqOneInThree'
 *   | 'protections_report_freqMoreThanOneInFour'
 *   | 'protections_report_freqOneInFive'
 *   | 'protections_report_freqSitesSingular'
 *   | 'protections_report_freqSitesPlural'} FrequencyKey
 */
export function frequencyOf(sitesCount, totalSitesVisited) {
    if (totalSitesVisited && totalSitesVisited >= MIN_SITES_FOR_RATIO && sitesCount <= totalSitesVisited) {
        const r = sitesCount / totalSitesVisited;
        if (r >= 0.9) return { key: 'protections_report_freqNearlyAll' };
        if (r >= 0.78) return { key: 'protections_report_freqFourInFive' };
        if (r >= 0.65) return { key: 'protections_report_freqTwoInThree' };
        if (r >= 0.55) return { key: 'protections_report_freqMoreThanHalf' };
        if (r >= 0.5) return { key: 'protections_report_freqHalf' };
        if (r >= 0.4) return { key: 'protections_report_freqAlmostHalf' };
        if (r >= 0.3) return { key: 'protections_report_freqOneInThree' };
        if (r >= 0.25) return { key: 'protections_report_freqMoreThanOneInFour' };
        if (r >= 0.19) return { key: 'protections_report_freqOneInFive' };
    }
    if (sitesCount === 1) return { key: 'protections_report_freqSitesSingular' };
    return { key: 'protections_report_freqSitesPlural', count: sitesCount };
}

/**
 * @typedef {object} SurfaceGroup
 * @property {SurfaceId} id
 * @property {number} count - companies blocked this week that are known to read it
 */

/**
 * What the companies blocked this week are known to read to recognize a
 * device, from the table built from Tracker Radar. This is what their scripts
 * read in general, not something observed here: blocked scripts never run.
 *
 * @param {TrackerCompany[]} companies
 * @return {{total: number, surfaces: SurfaceGroup[]}} `total` is how many companies read at least one
 */
export function groupBySurface(companies) {
    const counts = new Map(SURFACE_ORDER.map((id) => [id, 0]));
    let total = 0;
    for (const company of namedCompanies(companies)) {
        const mask = TRACKER_SURFACES[company.displayName.toLowerCase()];
        if (!mask) continue;
        total += 1;
        SURFACE_ORDER.forEach((id, bit) => {
            if (mask & (1 << bit)) counts.set(id, (counts.get(id) ?? 0) + 1);
        });
    }
    return {
        total,
        // most companies first; ties keep SURFACE_ORDER
        surfaces: SURFACE_ORDER.map((id) => ({ id, count: counts.get(id) ?? 0 }))
            .filter((s) => s.count > 0)
            .sort((a, b) => b.count - a.count),
    };
}

/**
 * @typedef {object} RankedSite
 * @property {SiteTrackers} site
 * @property {string[]} companies - display names, most widespread this week first
 */

/**
 * The sites with the most tracking companies, most first. Each site's
 * companies are ordered by how widespread they were across the whole week,
 * since we don't know how active each one was on that site.
 *
 * @param {PrivacyStatsData} stats
 * @return {RankedSite[]}
 */
export function rankTopSites(stats) {
    const rank = new Map(namedCompanies(stats.trackerCompanies).map((c, i) => [c.displayName, i]));
    const byRank = (/** @type {string} */ a, /** @type {string} */ b) =>
        (rank.get(a) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b) ?? Number.MAX_SAFE_INTEGER);
    return (stats.topSites ?? [])
        .filter((site) => site.trackerCompanies.length > 0)
        .sort((a, b) => b.trackerCompanies.length - a.trackerCompanies.length)
        .slice(0, TOP_SITES_LIMIT)
        .map((site) => ({
            site,
            companies: [...new Set(site.trackerCompanies)].sort(byRank).map(displayNameForCompany),
        }));
}
