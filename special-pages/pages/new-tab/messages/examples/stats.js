/**
 * @type {import("../../types/new-tab.js").PrivacyStatsData}
 */
const privacyStatsData = {
    totalCount: 12345,
    trackerCompanies: [
        { displayName: 'Tracker Co. C', count: 91011 },
        { displayName: 'Tracker Co. A', count: 1234 },
        { displayName: '__other__', count: 89901 },
        { displayName: 'Tracker Co. B', count: 5678 },
    ],
};

/**
 * @type {import("../../types/new-tab.js").StatsConfig}
 */
const minimumConfig = {
    expansion: 'expanded',
    animation: { kind: 'none' },
};

/**
 * @type {import("../../types/new-tab.js").StatsConfig}
 */
const withAnimation = {
    expansion: 'expanded',
    animation: { kind: 'view-transitions' },
};

export {};
