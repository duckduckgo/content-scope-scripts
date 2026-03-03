import { TrackerResolver } from '../src/features/tracker-protection/tracker-resolver.js';

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

        it('should return true for wildcard-unprotected domain (legacy config)', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: ['unprotected.com'],
            });
            expect(r.isUnprotectedDomain('unprotected.com')).toBe(true);
        });

        it('should match subdomain via wildcard (legacy config)', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                allowlist: {},
                unprotectedDomains: ['unprotected.com'],
            });
            expect(r.isUnprotectedDomain('sub.unprotected.com')).toBe(true);
        });

        it('should match user-unprotected domain exactly', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                userUnprotectedDomains: ['exact.com'],
                wildcardUnprotectedDomains: [],
            });
            expect(r.isUnprotectedDomain('exact.com')).toBe(true);
            expect(r.isUserUnprotectedDomain('exact.com')).toBe(true);
        });

        it('should NOT match subdomain of user-unprotected domain', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                userUnprotectedDomains: ['exact.com'],
                wildcardUnprotectedDomains: [],
            });
            expect(r.isUnprotectedDomain('sub.exact.com')).toBe(false);
            expect(r.isUserUnprotectedDomain('sub.exact.com')).toBe(false);
        });

        it('should match subdomain of wildcard-unprotected domain', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                userUnprotectedDomains: [],
                wildcardUnprotectedDomains: ['wildcard.com'],
            });
            expect(r.isUnprotectedDomain('sub.wildcard.com')).toBe(true);
            expect(r.isWildcardUnprotectedDomain('sub.wildcard.com')).toBe(true);
        });

        it('should match wildcard-unprotected domain exactly too', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                userUnprotectedDomains: [],
                wildcardUnprotectedDomains: ['wildcard.com'],
            });
            expect(r.isUnprotectedDomain('wildcard.com')).toBe(true);
        });

        it('should combine user and wildcard lists', () => {
            const r = new TrackerResolver({
                trackerData: sampleTrackerData,
                surrogates: sampleSurrogates,
                userUnprotectedDomains: ['user.com'],
                wildcardUnprotectedDomains: ['temp.com'],
            });
            expect(r.isUnprotectedDomain('user.com')).toBe(true);
            expect(r.isUnprotectedDomain('sub.user.com')).toBe(false);
            expect(r.isUnprotectedDomain('temp.com')).toBe(true);
            expect(r.isUnprotectedDomain('sub.temp.com')).toBe(true);
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

    describe('CNAME resolution', () => {
        it('should resolve CNAME to tracker domain', () => {
            const dataWithCnames = {
                ...sampleTrackerData,
                cnames: {
                    'cdn.somesite.com': 'tracker.com',
                },
            };

            const resolver = new TrackerResolver({
                trackerData: dataWithCnames,
                surrogates: sampleSurrogates,
            });

            const result = resolver.getTrackerData('https://cdn.somesite.com/pixel.gif', 'https://example.com');

            expect(result).not.toBeNull();
            expect(result?.tracker.domain).toBe('tracker.com');
            expect(result?.action).toBe('block');
            expect(result?.reason).toBe('default block');
        });

        it('should handle CNAME with subdomain walking', () => {
            const dataWithCnames = {
                ...sampleTrackerData,
                cnames: {
                    'sub.cdn.example.com': 'sub.tracker.com',
                },
            };

            const resolver = new TrackerResolver({
                trackerData: dataWithCnames,
                surrogates: sampleSurrogates,
            });

            const result = resolver.getTrackerData('https://sub.cdn.example.com/pixel.gif', 'https://example.com');

            expect(result).not.toBeNull();
            // Should walk up from sub.tracker.com to tracker.com
            expect(result?.tracker.domain).toBe('tracker.com');
            expect(result?.action).toBe('block');
        });

        it('should return null when CNAME resolves to non-tracker', () => {
            const dataWithCnames = {
                ...sampleTrackerData,
                cnames: {
                    'cdn.example.com': 'safe-cdn.com',
                },
            };

            const resolver = new TrackerResolver({
                trackerData: dataWithCnames,
                surrogates: sampleSurrogates,
            });

            const result = resolver.getTrackerData('https://cdn.example.com/script.js', 'https://example.com');

            expect(result).toBeNull();
        });

        it('should match rules after CNAME resolution', () => {
            const dataWithCnames = {
                ...sampleTrackerData,
                cnames: {
                    'masked-tracker.cdn.com': 'tracker.com',
                },
            };

            const resolver = new TrackerResolver({
                trackerData: dataWithCnames,
                surrogates: sampleSurrogates,
            });

            // Should resolve CNAME and match surrogate rule
            const result = resolver.getTrackerData('https://masked-tracker.cdn.com/scripts/script.js', 'https://example.com');

            expect(result).not.toBeNull();
            expect(result?.tracker.domain).toBe('tracker.com');
            expect(result?.matchedRule).toBeDefined();
            expect(result?.matchedRule?.surrogate).toBe('script.js');
            expect(result?.action).toBe('redirect');
            expect(result?.reason).toBe('matched rule - surrogate');
        });

        it('should prefer direct domain match over CNAME', () => {
            // If a domain is both directly in trackers AND has a CNAME,
            // the direct match should take precedence
            const dataWithCnames = {
                trackers: {
                    'direct.com': {
                        domain: 'direct.com',
                        default: 'ignore',
                        owner: { name: 'Direct Inc', displayName: 'Direct' },
                    },
                    'tracker.com': {
                        domain: 'tracker.com',
                        default: 'block',
                        owner: { name: 'Tracker Inc', displayName: 'Tracker' },
                    },
                },
                entities: {
                    'Direct Inc': { domains: ['direct.com'] },
                    'Tracker Inc': { domains: ['tracker.com'] },
                },
                domains: {
                    'direct.com': 'Direct Inc',
                    'tracker.com': 'Tracker Inc',
                },
                cnames: {
                    'direct.com': 'tracker.com',
                },
            };

            const resolver = new TrackerResolver({
                trackerData: dataWithCnames,
                surrogates: sampleSurrogates,
            });

            const result = resolver.getTrackerData('https://direct.com/pixel.gif', 'https://example.com');

            expect(result).not.toBeNull();
            // Should use direct match, not CNAME
            expect(result?.tracker.domain).toBe('direct.com');
            expect(result?.action).toBe('ignore');
            expect(result?.reason).toBe('default ignore');
        });
    });

    describe('getEntityAffiliation (P0-5)', () => {
        it('should detect affiliated domains (same entity)', () => {
            const result = resolver.getEntityAffiliation('facebook.net', 'facebook.com');
            expect(result.affiliated).toBe(true);
            expect(result.ownerName).toBe('Facebook, Inc.');
            expect(result.entityName).toBe('Facebook');
            expect(result.prevalence).toBe(0.5);
        });

        it('should detect affiliated subdomains', () => {
            const result = resolver.getEntityAffiliation('cdn.facebook.net', 'www.facebook.com');
            expect(result.affiliated).toBe(true);
            expect(result.ownerName).toBe('Facebook, Inc.');
        });

        it('should return not affiliated for different entities', () => {
            const result = resolver.getEntityAffiliation('tracker.com', 'facebook.com');
            expect(result.affiliated).toBe(false);
            expect(result.ownerName).toBeNull();
            expect(result.entityName).toBeNull();
            expect(result.prevalence).toBeNull();
        });

        it('should return not affiliated when request domain has no entity', () => {
            const result = resolver.getEntityAffiliation('unknown-cdn.com', 'facebook.com');
            expect(result.affiliated).toBe(false);
        });

        it('should return not affiliated when page domain has no entity', () => {
            const result = resolver.getEntityAffiliation('tracker.com', 'random-page.com');
            expect(result.affiliated).toBe(false);
        });

        it('should return not affiliated when neither domain has entity', () => {
            const result = resolver.getEntityAffiliation('unknown.com', 'random.com');
            expect(result.affiliated).toBe(false);
        });
    });

    describe('P0-2: affiliated third-party tracker reporting', () => {
        it('should mark entity-affiliated tracker as first party with ignore action', () => {
            const result = resolver.getTrackerData('https://connect.facebook.net/en_US/sdk.js', 'https://facebook.com');
            expect(result).not.toBeNull();
            expect(result.firstParty).toBe(true);
            expect(result.action).toBe('ignore');
            expect(result.reason).toBe('first party');
        });
    });

    describe('P0-3: unaffiliated third-party tracker reporting', () => {
        it('should block unaffiliated tracker with default block action', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.firstParty).toBe(false);
            expect(result.action).toBe('block');
            expect(result.reason).toBe('default block');
        });

        it('should allow unaffiliated tracker with default ignore action', () => {
            const result = resolver.getTrackerData('https://allowed-tracker.com/script.js', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.firstParty).toBe(false);
            expect(result.action).toBe('ignore');
            expect(result.reason).toBe('default ignore');
        });
    });

    describe('P0-4: non-tracker same-hostname suppression', () => {
        it('should return null for non-tracker domain (native handles eTLD+1 filtering)', () => {
            const result = resolver.getTrackerData('https://cdn.example.com/image.png', 'https://example.com');
            expect(result).toBeNull();
        });
    });

    describe('P0-6: entity/metadata fidelity in tracker results', () => {
        it('should include entity displayName and prevalence', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.entity).not.toBeNull();
            expect(result.entity.displayName).toBe('Fake Tracking Inc');
            expect(result.entity.prevalence).toBe(0.1);
        });

        it('should include tracker owner info', () => {
            const result = resolver.getTrackerData('https://tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result.tracker.owner.name).toBe('Fake Tracking Inc');
            expect(result.tracker.owner.displayName).toBe('FT Inc');
        });

        it('should include tracker category data', () => {
            const dataWithCategory = {
                ...sampleTrackerData,
                trackers: {
                    ...sampleTrackerData.trackers,
                    'analytics-tracker.com': {
                        domain: 'analytics-tracker.com',
                        default: 'block',
                        owner: { name: 'Analytics Corp' },
                        categories: ['Analytics'],
                    },
                },
            };
            const r = new TrackerResolver({ trackerData: dataWithCategory, surrogates: sampleSurrogates });
            const result = r.getTrackerData('https://analytics-tracker.com/pixel.gif', 'https://example.com');
            expect(result).not.toBeNull();
            expect(result?.tracker.categories).toEqual(['Analytics']);
        });
    });
});
