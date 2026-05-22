/**
 * TrackerData fixture factories for tracker-protection integration tests.
 * Each function returns a fresh object to avoid mutation bleed between tests.
 */

/** Basic tracker with surrogate rule (Tracker Inc) - used by most tests */
export function makeTrackerDataBasic() {
    return {
        trackers: {
            'tracker.example': {
                domain: 'tracker.example',
                owner: { name: 'Tracker Inc', displayName: 'Tracker Inc' },
                default: 'block',
                rules: [{ rule: 'tracker\\.example/scripts/analytics\\.js', surrogate: 'analytics.js' }],
            },
            'allowed.example': {
                domain: 'allowed.example',
                owner: { name: 'Allowed Inc' },
                default: 'ignore',
                rules: [],
            },
        },
        entities: {
            'Tracker Inc': { domains: ['tracker.example'], displayName: 'Tracker Inc', prevalence: 0.1 },
            'Test Site Inc': { domains: ['localhost', 'affiliated-cdn.example'], displayName: 'Test Site Inc', prevalence: 0.05 },
        },
        domains: {
            'tracker.example': 'Tracker Inc',
            localhost: 'Test Site Inc',
            'affiliated-cdn.example': 'Test Site Inc',
        },
    };
}

/** Facebook CTL surrogate (Facebook Inc) - for CTL enabled/disabled tests */
export function makeTrackerDataFacebook() {
    return {
        trackers: {
            'facebook.example': {
                domain: 'facebook.example',
                owner: { name: 'Facebook Inc', displayName: 'Facebook' },
                default: 'ignore',
                rules: [{ rule: 'facebook\\.example/sdk\\.js', surrogate: 'fb-sdk.js', action: 'block-ctl-fb' }],
            },
        },
        entities: {
            'Facebook Inc': { domains: ['facebook.example'], displayName: 'Facebook' },
        },
        domains: { 'facebook.example': 'Facebook Inc' },
    };
}

/** Real Google surrogates (Google LLC) - for real-surrogate E2E tests */
export function makeTrackerDataGoogle() {
    return {
        trackers: {
            'google-analytics.com': {
                domain: 'google-analytics.com',
                owner: { name: 'Google LLC', displayName: 'Google' },
                default: 'block',
                rules: [{ rule: 'google-analytics\\.com/analytics\\.js', surrogate: 'analytics.js' }],
            },
            'googletagmanager.com': {
                domain: 'googletagmanager.com',
                owner: { name: 'Google LLC', displayName: 'Google' },
                default: 'block',
                rules: [{ rule: 'googletagmanager\\.com/gtm\\.js', surrogate: 'gtm.js' }],
            },
            'googletagservices.com': {
                domain: 'googletagservices.com',
                owner: { name: 'Google LLC', displayName: 'Google' },
                default: 'block',
                rules: [{ rule: 'googletagservices\\.com/tag/js/gpt\\.js', surrogate: 'gpt.js' }],
            },
        },
        entities: {
            'Google LLC': {
                domains: ['google-analytics.com', 'googletagmanager.com', 'googletagservices.com'],
                displayName: 'Google',
                prevalence: 0.8,
            },
        },
        domains: {
            'google-analytics.com': 'Google LLC',
            'googletagmanager.com': 'Google LLC',
            'googletagservices.com': 'Google LLC',
        },
    };
}

/** CTL action prefix test (basic with block-ctl-* action) */
export function makeTrackerDataCtlActionPrefix() {
    return {
        trackers: {
            'tracker.example': {
                domain: 'tracker.example',
                owner: { name: 'Tracker Inc', displayName: 'Tracker Inc' },
                default: 'block',
                rules: [{ rule: 'tracker\\.example/scripts/analytics\\.js', surrogate: 'analytics.js', action: 'block-ctl-other' }],
            },
        },
        entities: {
            'Tracker Inc': { domains: ['tracker.example'], displayName: 'Tracker Inc', prevalence: 0.1 },
        },
        domains: { 'tracker.example': 'Tracker Inc' },
    };
}
