/**
 * Tracker resolution logic extracted from Apple's contentblocker.js/surrogates.js
 * Provides tracker matching against TDS (Tracker Data Set)
 */

/**
 * @typedef {object} TrackerData
 * @property {Record<string, Tracker>} trackers
 * @property {Record<string, Entity>} entities
 * @property {Record<string, string>} domains
 */

/**
 * @typedef {object} TrackerMatch
 * @property {'block' | 'ignore' | 'redirect'} action
 * @property {string} reason
 * @property {boolean} firstParty
 * @property {string} [redirectUrl]
 * @property {object} [matchedRule]
 * @property {boolean} [matchedRuleException]
 * @property {object} tracker
 * @property {string} fullTrackerDomain
 */

export class TrackerResolver {
    /**
     * @param {object} config
     * @param {TrackerData} config.trackerData
     * @param {Record<string, () => void>} config.surrogates
     * @param {Record<string, object[]>} [config.allowlist]
     * @param {string[]} [config.unprotectedDomains]
     */
    constructor(config) {
        /** @type {TrackerData | null} */
        this._trackerData = null;
        /** @type {Record<string, string>} */
        this._surrogateList = {};
        /** @type {Record<string, object[]>} */
        this._allowlist = {};
        /** @type {string[]} */
        this._unprotectedDomains = [];

        if (config.trackerData) {
            this._trackerData = this._processTrackerData(config.trackerData);
        }
        if (config.surrogates) {
            this._surrogateList = config.surrogates;
        }
        if (config.allowlist) {
            this._allowlist = config.allowlist;
        }
        if (config.unprotectedDomains) {
            this._unprotectedDomains = config.unprotectedDomains;
        }
    }

    /**
     * Pre-process tracker rules into RegExp objects
     * @param {TrackerData} data
     */
    _processTrackerData(data) {
        for (const name in data.trackers) {
            const tracker = data.trackers[name];
            if (tracker.rules) {
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

        const tracker = this._findTracker(requestData);
        if (!tracker) {
            return null;
        }

        const matchedRule = this._findRule(tracker, requestData);
        const redirectUrl = matchedRule?.surrogate ? this._surrogateList[matchedRule.surrogate] : undefined;
        const matchedRuleException = matchedRule ? this._matchesRuleDefinition(matchedRule, 'exceptions', requestData) : false;
        const trackerOwner = this._findTrackerOwner(requestData.urlToCheckDomain);
        const websiteOwner = this._findWebsiteOwner(requestData);
        const firstParty = trackerOwner && websiteOwner ? trackerOwner === websiteOwner : false;
        const fullTrackerDomain = requestData.urlToCheckSplit.join('.');

        const { action, reason } = this._getAction({
            firstParty,
            matchedRule,
            matchedRuleException,
            defaultAction: tracker.default,
            redirectUrl: Boolean(redirectUrl),
        });

        return {
            action,
            reason,
            firstParty,
            redirectUrl,
            matchedRule,
            matchedRuleException,
            tracker,
            fullTrackerDomain,
        };
    }

    /**
     * Find a tracker definition by walking up the domain hierarchy
     */
    _findTracker(requestData) {
        const urlList = [...requestData.urlToCheckSplit];

        while (urlList.length > 1) {
            const trackerDomain = urlList.join('.');
            urlList.shift();

            const matchedTracker = this._trackerData?.trackers[trackerDomain];
            if (matchedTracker) {
                return matchedTracker;
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
     */
    _findRule(tracker, requestData) {
        if (!tracker.rules?.length) return null;

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
     */
    _matchesRuleDefinition(rule, type, requestData) {
        if (!rule[type]) return false;

        const def = rule[type];
        const matchTypes = def.types?.length ? def.types.includes(requestData.request?.type) : true;
        const matchDomains = def.domains?.length ? def.domains.some((d) => d.match(requestData.siteDomain)) : true;

        return matchTypes && matchDomains;
    }

    /**
     * Determine blocking action and reason
     */
    _getAction({ firstParty, matchedRule, matchedRuleException, defaultAction, redirectUrl }) {
        let action, reason;

        if (firstParty) {
            action = 'ignore';
            reason = 'first party';
        } else if (matchedRuleException) {
            action = 'ignore';
            reason = 'matched rule - exception';
        } else if (!matchedRule && defaultAction === 'ignore') {
            action = 'ignore';
            reason = 'default ignore';
        } else if (matchedRule?.action === 'ignore') {
            action = 'ignore';
            reason = 'matched rule - ignore';
        } else if (!matchedRule && defaultAction === 'block') {
            action = 'block';
            reason = 'default block';
        } else if (matchedRule) {
            if (redirectUrl) {
                action = 'redirect';
                reason = 'matched rule - surrogate';
            } else {
                action = 'block';
                reason = 'matched rule - block';
            }
        }

        return { action, reason };
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
                    const siteHost = new URL(siteUrl).host;
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
     * Check if domain is unprotected
     * @param {string} domain
     */
    isUnprotectedDomain(domain) {
        const parts = domain.split('.');
        while (parts.length > 1) {
            if (this._unprotectedDomains.includes(parts.join('.'))) {
                return true;
            }
            parts.shift();
        }
        return false;
    }

    /**
     * Get surrogate code for a pattern
     * @param {string} pattern
     */
    getSurrogate(pattern) {
        return this._surrogateList[pattern];
    }
}
