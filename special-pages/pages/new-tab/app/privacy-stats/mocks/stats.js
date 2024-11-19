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
                displayName: 'Amazon',
                count: 67,
            },
            {
                displayName: 'Google Ads',
                count: 2,
            },
            {
                displayName: 'Other',
                count: 210,
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
};
