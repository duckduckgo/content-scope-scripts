/**
 * Tracker resolution logic extracted from Apple's contentblocker.js/surrogates.js
 * Provides tracker matching against TDS (Tracker Data Set)
 */

/** @module TrackerReasons */
export const REASON_FIRST_PARTY = 'first party';
export const REASON_RULE_EXCEPTION = 'matched rule - exception';
export const REASON_DEFAULT_IGNORE = 'default ignore';
export const REASON_MATCHED_RULE_IGNORE = 'matched rule - ignore';
export const REASON_DEFAULT_BLOCK = 'default block';
export const REASON_SURROGATE = 'matched rule - surrogate';
export const REASON_MATCHED_RULE_BLOCK = 'matched rule - block';
export const REASON_NO_MATCH = 'no match';

/**
 * @typedef {object} RuleOptions
 * @property {string[]} [types] - Resource types (e.g., 'script', 'image')
 * @property {string[]} [domains] - Domains where rule applies
 */

/**
 * @typedef {object} TrackerRule
 * @property {string | RegExp} rule
 * @property {string} [surrogate] - Name of surrogate to load
 * @property {string} [action] - Rule action (e.g., 'block', 'ignore', 'block-ctl-fb')
 * @property {RuleOptions} [options] - Conditions for rule to match
 * @property {RuleOptions} [exceptions] - Exceptions to the rule
 */

/**
 * @typedef {object} TrackerOwner
 * @property {string} [name]
 * @property {string} [displayName]
 */

/**
 * @typedef {object} Tracker
 * @property {string} domain
 * @property {TrackerOwner} [owner]
 * @property {string} [default] - Default action ('block' or 'ignore')
 * @property {TrackerRule[]} [rules]
 * @property {string[]} [categories] - Tracker categories
 */

/**
 * @typedef {object} Entity
 * @property {string[]} [domains]
 * @property {string} [displayName]
 * @property {number} [prevalence]
 */

/**
 * @typedef {object} TrackerData
 * @property {Record<string, Tracker>} trackers
 * @property {Record<string, Entity>} entities
 * @property {Record<string, string>} domains
 * @property {Record<string, string>} [cnames]
 */

/**
 * @typedef {object} AllowlistEntry
 * @property {string | RegExp} rule - Pattern to match
 * @property {string[]} domains - Domains where tracker is allowed
 */

/**
 * @typedef {object} RequestData
 * @property {{ type?: string }} request
 * @property {string} siteUrl
 * @property {string} siteDomain
 * @property {string[]} siteUrlSplit
 * @property {string} urlToCheck
 * @property {string} urlToCheckDomain
 * @property {string[]} urlToCheckSplit
 */

/**
 * @typedef {object} TrackerMatch
 * @property {'block' | 'ignore' | 'redirect'} action
 * @property {string} reason
 * @property {boolean} firstParty
 * @property {TrackerRule} [matchedRule]
 * @property {boolean} [matchedRuleException]
 * @property {Tracker} tracker
 * @property {Entity | null} [entity]
 * @property {string} fullTrackerDomain
 */

export class TrackerResolver {
    /**
     * @param {object} config
     * @param {TrackerData} config.trackerData
     * @param {Record<string, () => void>} config.surrogates
     * @param {Record<string, AllowlistEntry[]>} [config.allowlist]
     * @param {string[]} [config.unprotectedDomains] - Legacy: all treated as wildcard. Use userUnprotectedDomains + wildcardUnprotectedDomains instead.
     * @param {string[]} [config.userUnprotectedDomains] - Exact-match only (user-toggled)
     * @param {string[]} [config.wildcardUnprotectedDomains] - Wildcard domain-walk (temp + contentBlocking exceptions)
     */
    constructor(config) {
        /** @type {TrackerData | null} */
        this._trackerData = null;
        /** @type {Record<string, () => void>} */
        this._surrogateList = {};
        /** @type {Record<string, AllowlistEntry[]>} */
        this._allowlist = {};
        /** @type {string[]} */
        this._userUnprotectedDomains = [];
        /** @type {string[]} */
        this._wildcardUnprotectedDomains = [];

        if (config.trackerData) {
            this._trackerData = this._processTrackerData(config.trackerData);
        }
        if (config.surrogates) {
            this._surrogateList = config.surrogates;
        }
        if (config.allowlist) {
            this._allowlist = config.allowlist;
        }
        if (config.userUnprotectedDomains) {
            this._userUnprotectedDomains = config.userUnprotectedDomains;
        }
        if (config.wildcardUnprotectedDomains) {
            this._wildcardUnprotectedDomains = config.wildcardUnprotectedDomains;
        }
        if (config.unprotectedDomains) {
            this._wildcardUnprotectedDomains = this._wildcardUnprotectedDomains.concat(config.unprotectedDomains);
        }
    }

    /**
     * Pre-process tracker rules into RegExp objects
     * @param {TrackerData} data
     */
    _processTrackerData(data) {
        for (const name in data.trackers) {
            const tracker = data.trackers[name];
            if (tracker?.rules) {
                for (const rule of tracker.rules) {
                    if (typeof rule.rule === 'string') {
                        rule.rule = new RegExp(rule.rule, 'ig');
                    }
                }
            }
        }
        return data;
    }

    /**
     * Extract hostname from URL
     * @param {string} url
     * @param {boolean} [keepWWW]
     */
    _extractHost(url, keepWWW = false) {
        try {
            let hostname = new URL(url.startsWith('//') ? 'http:' + url : url).hostname;
            if (!keepWWW) {
                hostname = hostname.replace(/^www\./, '');
            }
            return hostname;
        } catch {
            return '';
        }
    }

    /**
     * Parse URL and extract domain info
     * @param {string} url
     */
    _parseUrl(url) {
        if (url.startsWith('//')) {
            url = 'http:' + url;
        }
        try {
            const parsed = new URL(url);
            return { domain: parsed.hostname, hostname: parsed.hostname };
        } catch {
            return { domain: '', hostname: '' };
        }
    }

    /**
     * Get tracker data for a URL
     * @param {string} urlToCheck - The resource URL being checked
     * @param {string} siteUrl - The page URL
     * @param {{ type?: string }} [request] - Request metadata
     * @returns {TrackerMatch | null}
     */
    getTrackerData(urlToCheck, siteUrl, request = {}) {
        if (!this._trackerData) {
            return null;
        }

        const requestData = {
            request,
            siteUrl,
            siteDomain: this._parseUrl(siteUrl).domain,
            siteUrlSplit: this._extractHost(siteUrl).split('.'),
            urlToCheck,
            urlToCheckDomain: this._parseUrl(urlToCheck).domain,
            urlToCheckSplit: this._extractHost(urlToCheck).split('.'),
        };

        const trackerResult = this._findTracker(requestData);
        if (!trackerResult) {
            return null;
        }
        const { tracker, resolvedDomain } = trackerResult;

        if (resolvedDomain) {
            try {
                const originalUrl = new URL(urlToCheck);
                requestData.urlToCheck = `${originalUrl.protocol}//${resolvedDomain}${originalUrl.pathname}${originalUrl.search}`;
            } catch {
                // keep original URL if parsing fails
            }
        }

        const matchedRule = this._findRule(tracker, requestData);
        const hasSurrogate = matchedRule?.surrogate ? Boolean(this._surrogateList[matchedRule.surrogate]) : false;
        const matchedRuleException = matchedRule ? this._matchesRuleDefinition(matchedRule, 'exceptions', requestData) : false;
        const ownerLookupDomain = resolvedDomain || requestData.urlToCheckDomain;
        const trackerOwnerName = this._findTrackerOwner(ownerLookupDomain);
        const websiteOwner = this._findWebsiteOwner(requestData);
        const firstParty = trackerOwnerName && websiteOwner ? trackerOwnerName === websiteOwner : false;
        const fullTrackerDomain = requestData.urlToCheckSplit.join('.');
        const entity = trackerOwnerName ? this._trackerData?.entities?.[trackerOwnerName] : null;

        const { action, reason } = this._getAction({
            firstParty,
            matchedRule,
            matchedRuleException,
            defaultAction: tracker.default,
            redirectUrl: hasSurrogate,
        });

        return {
            action,
            reason,
            firstParty,
            matchedRule,
            matchedRuleException,
            tracker,
            entity,
            fullTrackerDomain,
        };
    }

    /**
     * Find a tracker definition by walking up the domain hierarchy,
     * falling back to CNAME resolution if available.
     * @param {RequestData} requestData
     * @returns {{ tracker: Tracker, resolvedDomain?: string } | null}
     */
    _findTracker(requestData) {
        const urlList = [...requestData.urlToCheckSplit];

        while (urlList.length > 1) {
            const trackerDomain = urlList.join('.');
            urlList.shift();

            const matchedTracker = this._trackerData?.trackers[trackerDomain];
            if (matchedTracker) {
                return { tracker: matchedTracker };
            }
        }

        if (this._trackerData?.cnames) {
            const requestHost = requestData.urlToCheckSplit.join('.');
            const resolved = this._trackerData.cnames[requestHost];
            if (resolved) {
                const resolvedParts = resolved.split('.');
                while (resolvedParts.length > 1) {
                    const resolvedDomain = resolvedParts.join('.');
                    const matchedTracker = this._trackerData.trackers[resolvedDomain];
                    if (matchedTracker) {
                        return { tracker: matchedTracker, resolvedDomain };
                    }
                    resolvedParts.shift();
                }
            }
        }

        return null;
    }

    /**
     * Find tracker entity owner
     * @param {string} domain
     */
    _findTrackerOwner(domain) {
        if (!this._trackerData?.domains) return null;

        const parts = domain.split('.');
        while (parts.length > 1) {
            const entityName = this._trackerData.domains[parts.join('.')];
            if (entityName) {
                return entityName;
            }
            parts.shift();
        }
        return null;
    }

    /**
     * Find the entity owning the website
     * @param {RequestData} requestData
     */
    _findWebsiteOwner(requestData) {
        if (!this._trackerData?.domains) return null;

        const siteUrlList = [...requestData.siteUrlSplit];
        while (siteUrlList.length > 1) {
            const siteToCheck = siteUrlList.join('.');
            siteUrlList.shift();

            const entityName = this._trackerData.domains[siteToCheck];
            if (entityName) {
                return entityName;
            }
        }
        return null;
    }

    /**
     * Find matching rule for a tracker
     * @param {Tracker} tracker
     * @param {RequestData} requestData
     * @returns {TrackerRule | undefined}
     */
    _findRule(tracker, requestData) {
        if (!tracker.rules?.length) return undefined;

        return tracker.rules.find((ruleObj) => {
            if (requestData.urlToCheck.match(ruleObj.rule)) {
                if (ruleObj.options) {
                    return this._matchesRuleDefinition(ruleObj, 'options', requestData);
                }
                return true;
            }
            return false;
        });
    }

    /**
     * Check if rule options/exceptions match request
     * @param {TrackerRule} rule
     * @param {'options' | 'exceptions'} type
     * @param {RequestData} requestData
     * @returns {boolean}
     */
    _matchesRuleDefinition(rule, type, requestData) {
        const def = rule[type];
        if (!def) return false;

        const matchTypes = def.types?.length ? def.types.includes(requestData.request?.type || '') : true;
        const matchDomains = def.domains?.length
            ? def.domains.some((d) => {
                  const siteParts = requestData.siteDomain.split('.');
                  while (siteParts.length > 1) {
                      if (siteParts.join('.') === d) return true;
                      siteParts.shift();
                  }
                  return false;
              })
            : true;

        return matchTypes && matchDomains;
    }

    /**
     * Determine blocking action and reason
     * @param {object} params
     * @param {boolean} params.firstParty
     * @param {TrackerRule} [params.matchedRule]
     * @param {boolean} params.matchedRuleException
     * @param {string} [params.defaultAction]
     * @param {boolean} params.redirectUrl - whether a surrogate redirect is available
     * @returns {{ action: 'block' | 'ignore' | 'redirect', reason: string }}
     */
    _getAction({ firstParty, matchedRule, matchedRuleException, defaultAction, redirectUrl }) {
        if (firstParty) {
            return { action: 'ignore', reason: REASON_FIRST_PARTY };
        }
        if (matchedRuleException) {
            return { action: 'ignore', reason: REASON_RULE_EXCEPTION };
        }
        if (!matchedRule && defaultAction === 'ignore') {
            return { action: 'ignore', reason: REASON_DEFAULT_IGNORE };
        }
        if (matchedRule?.action === 'ignore') {
            return { action: 'ignore', reason: REASON_MATCHED_RULE_IGNORE };
        }
        if (!matchedRule && defaultAction === 'block') {
            return { action: 'block', reason: REASON_DEFAULT_BLOCK };
        }
        if (matchedRule) {
            const ruleAction = matchedRule.action;
            if (ruleAction && ruleAction !== 'block' && !ruleAction.startsWith('block-ctl-')) {
                // Unknown/unsupported rule action — fall through to default
            } else if (redirectUrl) {
                return { action: 'redirect', reason: REASON_SURROGATE };
            } else {
                return { action: 'block', reason: REASON_MATCHED_RULE_BLOCK };
            }
        }
        if (defaultAction === 'block') {
            return { action: 'block', reason: REASON_DEFAULT_BLOCK };
        }
        return { action: 'ignore', reason: REASON_NO_MATCH };
    }

    /**
     * Check if URL is in tracker allowlist
     * @param {string} siteUrl - The page URL
     * @param {string} requestUrl - The tracker URL
     */
    isAllowlisted(siteUrl, requestUrl) {
        if (!Object.keys(this._allowlist).length) {
            return false;
        }

        const parsedRequest = this._parseUrl(requestUrl);
        const requestDomainParts = parsedRequest.domain.split('.');

        let allowListEntry = null;
        while (requestDomainParts.length > 1) {
            const requestDomain = requestDomainParts.join('.');
            allowListEntry = this._allowlist[requestDomain];
            if (allowListEntry) break;
            requestDomainParts.shift();
        }

        if (!allowListEntry) return false;

        // Check if site matches allowlist entry
        for (const entry of allowListEntry) {
            if (requestUrl.match(entry.rule)) {
                if (entry.domains.includes('<all>')) return true;

                try {
                    const siteHost = new URL(siteUrl).hostname;
                    const siteDomainParts = siteHost.split('.');
                    while (siteDomainParts.length > 1) {
                        if (entry.domains.includes(siteDomainParts.join('.'))) {
                            return true;
                        }
                        siteDomainParts.shift();
                    }
                } catch {
                    // Invalid URL
                }
            }
        }

        return false;
    }

    /**
     * Check if domain is unprotected (user-toggled, exact match only)
     * @param {string} domain
     */
    isUserUnprotectedDomain(domain) {
        return this._userUnprotectedDomains.includes(domain);
    }

    /**
     * Check if domain is unprotected via wildcard matching (temp + contentBlocking exceptions).
     * Walks up subdomains.
     * @param {string} domain
     */
    isWildcardUnprotectedDomain(domain) {
        if (this._wildcardUnprotectedDomains.includes(domain)) {
            return true;
        }
        const parts = domain.split('.');
        while (parts.length > 1) {
            parts.shift();
            if (this._wildcardUnprotectedDomains.includes(parts.join('.'))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if domain is unprotected by any source
     * @param {string} domain
     */
    isUnprotectedDomain(domain) {
        return this.isUserUnprotectedDomain(domain) || this.isWildcardUnprotectedDomain(domain);
    }

    /**
     * Check entity affiliation between a request and page domain.
     * Used for non-tracker requests to determine "owned by first party" classification.
     * @param {string} requestHost
     * @param {string} pageHost
     * @returns {{ affiliated: boolean, entityName: string | null, ownerName: string | null, prevalence: number | null }}
     */
    getEntityAffiliation(requestHost, pageHost) {
        const requestOwner = this._findTrackerOwner(requestHost);
        const normalizedPageHost = pageHost.replace(/^www\./, '');
        const pageOwner = this._findTrackerOwner(normalizedPageHost);

        if (requestOwner && pageOwner && requestOwner === pageOwner) {
            const entity = this._trackerData?.entities?.[requestOwner];
            return {
                affiliated: true,
                entityName: entity?.displayName || requestOwner,
                ownerName: requestOwner,
                prevalence: entity?.prevalence ?? null,
            };
        }
        return { affiliated: false, entityName: null, ownerName: null, prevalence: null };
    }

    /**
     * Get surrogate function for a pattern
     * @param {string} pattern
     * @returns {(() => void) | undefined}
     */
    getSurrogate(pattern) {
        return this._surrogateList[pattern];
    }
}
