import { TrackerResolver } from '../src/features/tracker-stats/tracker-resolver.js';

/**
 * Sample tracker data for testing
 */
const sampleTrackerData = {
    trackers: {
        'tracker.com': {
            domain: 'tracker.com',
            default: 'block',
            owner: {
                name: 'Fake Tracking Inc',
                displayName: 'FT Inc',
            },
            rules: [
                {
                    rule: 'tracker\\.com/scripts/script\\.js',
                    surrogate: 'script.js',
                },
            ],
        },
        'facebook.net': {
            domain: 'facebook.net',
            default: 'ignore',
            owner: {
                name: 'Facebook, Inc.',
                displayName: 'Facebook',
            },
            rules: [
                {
                    rule: 'facebook\\.net/.*/sdk\\.js',
                    surrogate: 'fb-sdk.js',
                    action: 'block-ctl-fb',
                },
                {
                    rule: 'facebook\\.net/',
                    action: 'block-ctl-fb',
                },
            ],
        },
        'allowed-tracker.com': {
            domain: 'allowed-tracker.com',
            default: 'ignore',
            owner: {
                name: 'Allowed Inc',
            },
        },
    },
    entities: {
        'Fake Tracking Inc': {
            domains: ['tracker.com'],
            displayName: 'Fake Tracking Inc',
            prevalence: 0.1,
        },
        'Facebook, Inc.': {
            domains: ['facebook.net', 'facebook.com'],
            displayName: 'Facebook',
            prevalence: 0.5,
        },
    },
    domains: {
        'tracker.com': 'Fake Tracking Inc',
        'facebook.net': 'Facebook, Inc.',
        'facebook.com': 'Facebook, Inc.',
    },
};

const sampleSurrogates = {
    'script.js': () => {
        globalThis.trackerReplaced = true;
    },
    'fb-sdk.js': () => {
        globalThis.FB = { init: () => {} };
    },
};

describe('TrackerResolver', () => {
    let resolver;

    beforeEach(() => {
        resolver = new TrackerResolver({
            trackerData: sampleTrackerData,
            surrogates: sampleSurrogates,
            allowlist: {},
            unprotectedDomains: [],
        });
    });

    describe('getTrackerData', () => {
        it('should find a known tracker', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.tracker.domain).toBe('tracker.com');
        });

        it('should find tracker on subdomain', () => {
            const result = resolver.getTrackerData('https://sub.tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.tracker.domain).toBe('tracker.com');
        });

        it('should return null for non-tracker', () => {
            const result = resolver.getTrackerData('https://example.com/image.png', 'https://othersite.com');
            expect(result).toBeNull();
        });

        it('should mark first-party request with action ignore', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://tracker.com');
            expect(result).not.toBeNull();
            expect(result.firstParty).toBe(true);
            expect(result.action).toBe('ignore');
        });

        it('should match surrogate rule', () => {
            const result = resolver.getTrackerData('https://tracker.com/scripts/script.js', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.matchedRule).not.toBeNull();
            expect(result.matchedRule.surrogate).toBe('script.js');
            expect(result.action).toBe('redirect');
        });

        it('should match CTL rule for Facebook SDK', () => {
            const result = resolver.getTrackerData('https://connect.facebook.net/en_US/sdk.js', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.matchedRule).not.toBeNull();
            expect(result.matchedRule.action).toBe('block-ctl-fb');
            expect(result.matchedRule.surrogate).toBe('fb-sdk.js');
        });

        it('should return block action for default block tracker', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.action).toBe('block');
        });

        it('should return ignore action for default ignore tracker without matching rule', () => {
            const result = resolver.getTrackerData('https://allowed-tracker.com/something.js', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.action).toBe('ignore');
        });

        it('should detect same-entity requests (first-party)', () => {
            // facebook.net is same entity as facebook.com
            const result = resolver.getTrackerData('https://connect.facebook.net/en_US/sdk.js', 'https://facebook.com');
            expect(result).not.toBeNull();
            expect(result.firstParty).toBe(true);
            expect(result.action).toBe('ignore');
            expect(result.reason).toBe('first party');
        });

        it('should return reason for blocked tracker', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.reason).toBe('default block');
        });

        it('should return fullTrackerDomain', () => {
            const result = resolver.getTrackerData('https://sub.tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.fullTrackerDomain).toBe('sub.tracker.com');
        });
    });

    describe('isUnprotectedDomain', () => {
        it('should return false for protected domain', () => {
            expect(resolver.isUnprotectedDomain('example.com')).toBe(false);
        });

        it('should return true for unprotected domain', () => {
            const resolverWithUnprotected = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: ['unprotected.com'],
            });
            expect(resolverWithUnprotected.isUnprotectedDomain('unprotected.com')).toBe(true);
        });

        it('should match subdomain of unprotected domain', () => {
            const resolverWithUnprotected = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: ['unprotected.com'],
            });
            expect(resolverWithUnprotected.isUnprotectedDomain('sub.unprotected.com')).toBe(true);
        });
    });

    describe('isAllowlisted', () => {
        it('should return false when no allowlist', () => {
            expect(resolver.isAllowlisted('https://example.com', 'https://tracker.com/pixel.gif')).toBe(false);
        });

        it('should return true when tracker is allowlisted for site', () => {
            const resolverWithAllowlist = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {
                    'tracker.com': [{ rule: 'tracker\\.com', domains: ['example.com'] }],
                },
                unprotectedDomains: [],
            });
            expect(resolverWithAllowlist.isAllowlisted('https://example.com', 'https://tracker.com/pixel.gif')).toBe(true);
        });

        it('should return false when tracker is allowlisted for different site', () => {
            const resolverWithAllowlist = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {
                    'tracker.com': [{ rule: 'tracker\\.com', domains: ['othersite.com'] }],
                },
                unprotectedDomains: [],
            });
            expect(resolverWithAllowlist.isAllowlisted('https://example.com', 'https://tracker.com/pixel.gif')).toBe(false);
        });

        it('should return true when tracker is allowlisted for <all> domains', () => {
            const resolverWithAllowlist = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {
                    'tracker.com': [{ rule: 'tracker\\.com', domains: ['<all>'] }],
                },
                unprotectedDomains: [],
            });
            expect(resolverWithAllowlist.isAllowlisted('https://anysite.com', 'https://tracker.com/pixel.gif')).toBe(true);
        });

        it('should match subdomain of allowlisted site', () => {
            const resolverWithAllowlist = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {
                    'tracker.com': [{ rule: 'tracker\\.com', domains: ['example.com'] }],
                },
                unprotectedDomains: [],
            });
            expect(resolverWithAllowlist.isAllowlisted('https://sub.example.com', 'https://tracker.com/pixel.gif')).toBe(true);
        });
    });

    describe('getSurrogate', () => {
        it('should return surrogate function', () => {
            const surrogate = resolver.getSurrogate('script.js');
            expect(typeof surrogate).toBe('function');
        });

        it('should return undefined for unknown surrogate', () => {
            const surrogate = resolver.getSurrogate('unknown.js');
            expect(surrogate).toBeUndefined();
        });
    });

    describe('rule matching with options', () => {
        it('should respect rule options with types', () => {
            const resolverWithOptions = new TrackerResolver({
                trackerData: {
                    ...sampleTrackerData,
                    trackers: {
                        ...sampleTrackerData.trackers,
                        'option-tracker.com': {
                            domain: 'option-tracker.com',
                            default: 'ignore',
                            rules: [
                                {
                                    rule: 'option-tracker\\.com/script\\.js',
                                    action: 'block',
                                    options: {
                                        types: ['script'],
                                    },
                                },
                            ],
                        },
                    },
                },
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: [],
            });

            // Should match script type
            const scriptResult = resolverWithOptions.getTrackerData('https://option-tracker.com/script.js', 'https://example.com', {
                type: 'script',
            });
            expect(scriptResult).not.toBeNull();
            expect(scriptResult?.matchedRule).not.toBeNull();
            expect(scriptResult?.action).toBe('block');

            // Should not match image type (defaults to default action)
            const imageResult = resolverWithOptions.getTrackerData('https://option-tracker.com/script.js', 'https://example.com', {
                type: 'image',
            });
            expect(imageResult).not.toBeNull();
            expect(imageResult?.matchedRule).toBeFalsy(); // undefined when no rule matches
            expect(imageResult?.action).toBe('ignore'); // default action
        });
    });

    describe('rule exceptions', () => {
        it('should respect rule exceptions with domains', () => {
            const resolverWithExceptions = new TrackerResolver({
                trackerData: {
                    ...sampleTrackerData,
                    trackers: {
                        ...sampleTrackerData.trackers,
                        'exception-tracker.com': {
                            domain: 'exception-tracker.com',
                            default: 'block',
                            rules: [
                                {
                                    rule: 'exception-tracker\\.com/script\\.js',
                                    exceptions: {
                                        domains: ['allowed.com'],
                                    },
                                },
                            ],
                        },
                    },
                },
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: [],
            });

            // Should be blocked on normal site
            const blockedResult = resolverWithExceptions.getTrackerData('https://exception-tracker.com/script.js', 'https://example.com');
            expect(blockedResult).not.toBeNull();
            expect(blockedResult?.action).toBe('block');
            expect(blockedResult?.matchedRuleException).toBe(false);

            // Should be allowed on exception domain
            const allowedResult = resolverWithExceptions.getTrackerData('https://exception-tracker.com/script.js', 'https://allowed.com');
            expect(allowedResult).not.toBeNull();
            expect(allowedResult?.action).toBe('ignore');
            expect(allowedResult?.matchedRuleException).toBe(true);
            expect(allowedResult?.reason).toBe('matched rule - exception');
        });
    });
});

// Note: TrackerStats feature tests that require browser APIs (MutationObserver, document, window)
// are better suited for integration tests with jsdom or in-browser testing.
// The TrackerResolver class tests above cover the core logic that was previously
// tested in the Swift SurrogatesUserScriptsTests and ContentBlockerRulesUserScriptsTests.
