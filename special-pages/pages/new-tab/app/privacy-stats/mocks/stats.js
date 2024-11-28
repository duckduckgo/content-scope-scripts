import { DDG_STATS_OTHER_COMPANY_IDENTIFIER } from '../constants.js';

/**
 * @import { PrivacyStatsData } from "../../../../../types/new-tab";
 * @type {Record<string, PrivacyStatsData>}
 */
export const stats = {
    few: {
        totalCount: 481_113,
        trackerCompanies: [
            {
                displayName: 'Facebook',
                count: 310,
            },
            {
                displayName: 'Google',
                count: 279,
            },
            {
                displayName: DDG_STATS_OTHER_COMPANY_IDENTIFIER,
                count: 210,
            },
            {
                displayName: 'Amazon.com',
                count: 67,
            },
            {
                displayName: 'Google Ads',
                count: 2,
            },
        ],
    },
    single: {
        totalCount: 481_113,
        trackerCompanies: [
            {
                displayName: 'Google',
                count: 1,
            },
        ],
    },
    norecent: {
        totalCount: 481_113,
        trackerCompanies: [],
    },
    none: {
        totalCount: 0,
        trackerCompanies: [],
    },
    willUpdate: {
        totalCount: 481_113,
        trackerCompanies: [
            {
                displayName: 'Facebook',
                count: 1,
            },
            {
                displayName: 'Google',
                count: 1,
            },
            {
                displayName: DDG_STATS_OTHER_COMPANY_IDENTIFIER,
                count: 1,
            },
            {
                displayName: 'Amazon.com',
                count: 1,
            },
            {
                displayName: 'Google Ads',
                count: 1,
            },
        ],
    },
    growing: {
        totalCount: 0,
        trackerCompanies: [],
    },
    many: {
        totalCount: 890,
        trackerCompanies: [
            { displayName: 'Google', count: 153 },
            { displayName: 'Microsoft', count: 69 },
            { displayName: 'Cloudflare', count: 65 },
            { displayName: 'Facebook', count: 61 },
            { displayName: 'ByteDance', count: 58 },
            { displayName: 'Adobe', count: 38 },
            { displayName: 'Magnite', count: 12 },
            { displayName: 'PubMatic', count: 10 },
            { displayName: 'Index Exchange', count: 10 },
            { displayName: 'OpenX', count: 10 },
            { displayName: 'Taboola', count: 9 },
            { displayName: 'comScore', count: 9 },
            { displayName: 'Akamai', count: 8 },
            { displayName: 'LiveIntent', count: 7 },
            { displayName: 'Criteo', count: 6 },
            { displayName: 'Verizon Media', count: 6 },
            { displayName: 'TripleLift', count: 5 },
            { displayName: 'YieldMo', count: 4 },
            { displayName: 'Neustar', count: 4 },
            { displayName: 'Oracle', count: 4 },
            { displayName: 'WPP', count: 3 },
            { displayName: 'Adform', count: 3 },
            { displayName: 'The Nielsen Company', count: 3 },
            { displayName: 'IPONWEB', count: 3 },
            { displayName: 'Kargo', count: 2 },
            { displayName: '__other__', count: 143 },
            { displayName: 'Sharethrough', count: 2 },
            { displayName: 'GumGum', count: 2 },
            { displayName: 'Media.net Advertising', count: 2 },
            { displayName: 'Amobee', count: 2 },
            { displayName: 'Improve Digital', count: 1 },
            { displayName: 'Smartadserver', count: 1 },
            { displayName: 'LoopMe', count: 1 },
            { displayName: 'Hotjar', count: 1 },
            { displayName: 'Amazon.com', count: 1 },
            { displayName: 'RTB House', count: 1 },
            { displayName: 'Sovrn Holdings', count: 1 },
            { displayName: 'Outbrain', count: 1 },
            { displayName: 'Conversant', count: 1 },
            { displayName: 'The Trade Desk', count: 1 },
            { displayName: 'RhythmOne', count: 1 },
            { displayName: 'Sonobi', count: 1 },
            { displayName: 'New Relic', count: 1 },
        ],
    },
};
