import ContentFeature from '../content-feature.js';
import { getFaviconList } from './favicon.js';
import { isDuckAi, isBeingFramed, getTabUrl } from '../utils.js';
const MSG_PAGE_CONTEXT_RESPONSE = 'collectionResult';

function collapseWhitespace(str) {
    return typeof str === 'string' ? str.replace(/\s+/g, ' ') : '';
}

function checkNodeIsVisible(node) {
    // Fast path: check if node is connected to document
    // if (!node.isConnected) {
    //    return false;
    // }

    try {
        const style = window.getComputedStyle(node);

        // Check primary visibility properties
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return false;
        }
        /*
        // Check if element has zero dimensions
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            return false;
        }
        
        // Check for common hiding techniques
        if (style.position === 'absolute' || style.position === 'fixed') {
            const left = parseFloat(style.left);
            const top = parseFloat(style.top);
            // Elements positioned far off-screen
            if (left < -9000 || top < -9000) {
                return false;
            }
        }
        
        // Check for clipping
        if (style.clip && style.clip !== 'auto' && style.clip.includes('rect(0')) {
            return false;
        }
        */
        return true;
    } catch (e) {
        return false;
    }
}

function domToMarkdown(node, maxLength = Infinity) {
    if (node.nodeType === Node.TEXT_NODE) {
        return collapseWhitespace(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const tag = node.tagName.toLowerCase();
    if (!checkNodeIsVisible(node)) {
        return '';
    }

    // Build children string incrementally to exit early when maxLength is exceeded
    let children = '';
    for (const childNode of node.childNodes) {
        const childContent = domToMarkdown(childNode, maxLength - children.length);
        children += childContent;

        if (children.length > maxLength) {
            children = children.substring(0, maxLength) + '...';
            break;
        }
    }

    switch (tag) {
        case 'strong':
        case 'b':
            return `**${children}**`;
        case 'em':
        case 'i':
            return `*${children}*`;
        case 'h1':
            return `\n# ${children}\n`;
        case 'h2':
            return `\n## ${children}\n`;
        case 'h3':
            return `\n### ${children}\n`;
        case 'p':
            return `${children}\n`;
        case 'br':
            return `\n`;
        case 'ul':
            return `\n${children}\n`;
        case 'li':
            return `\n- ${children.trim()}\n`;
        case 'a':
            return getLinkText(node);
        default:
            return children;
    }
}

function collapseAndTrim(str) {
    return collapseWhitespace(str).trim();
}

function getLinkText(node) {
    const href = node.getAttribute('href');
    return href ? `[${collapseAndTrim(node.textContent)}](${href})` : collapseWhitespace(node.textContent);
}

export default class PageContext extends ContentFeature {
    /** @type {any} */
    #cachedContent = undefined;
    #cachedTimestamp = 0;
    /** @type {MutationObserver | null} */
    mutationObserver = null;
    lastSentContent = null;
    listenForUrlChanges = true;
    /** @type {ReturnType<typeof setTimeout> | null} */
    #delayedRecheckTimer = null;

    init() {
        if (!this.shouldActivate()) {
            return;
        }
        this.setupListeners();
    }

    setupListeners() {
        this.observeContentChanges();
        if (this.getFeatureSettingEnabled('subscribeToCollect', 'enabled')) {
            this.messaging.subscribe('collect', () => {
                this.invalidateCache();
                this.handleContentCollectionRequest();
            });
        }
        window.addEventListener('load', () => {
            this.handleContentCollectionRequest();
        });
        if (this.getFeatureSettingEnabled('subscribeToHashChange', 'enabled')) {
            window.addEventListener('hashchange', () => {
                // Immediate collection
                this.handleContentCollectionRequest();

                // Schedule delayed recheck after DOM settles
                this.scheduleDelayedRecheck();
            });
        }
        if (this.getFeatureSettingEnabled('subscribeToPageShow', 'enabled')) {
            window.addEventListener('pageshow', () => {
                this.handleContentCollectionRequest();
            });
        }
        if (this.getFeatureSettingEnabled('subscribeToVisibilityChange', 'enabled')) {
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    return;
                }
                this.handleContentCollectionRequest();
            });
        }

        // Set up content collection infrastructure
        if (document.body) {
            this.setup();
        } else {
            window.addEventListener(
                'DOMContentLoaded',
                () => {
                    this.setup();
                },
                { once: true },
            );
        }
    }

    shouldActivate() {
        if (isBeingFramed() || isDuckAi()) {
            return false;
        }
        const tabUrl = getTabUrl();
        // Ignore duck:// urls for now
        if (tabUrl?.protocol === 'duck:') {
            return false;
        }
        return true;
    }

    /**
     * @param {NavigationType} _navigationType
     */
    urlChanged(_navigationType) {
        if (!this.shouldActivate()) {
            return;
        }
        // Immediate collection
        this.handleContentCollectionRequest();

        // Schedule delayed recheck after DOM settles
        this.scheduleDelayedRecheck();
    }

    setup() {
        this.handleContentCollectionRequest();
        this.startObserving();
    }

    get cachedContent() {
        if (!this.#cachedContent || this.isCacheExpired()) {
            // Clean up if we had content but it's expired
            if (this.#cachedContent) {
                this.invalidateCache();
            }
            return undefined;
        }
        return this.#cachedContent;
    }

    invalidateCache() {
        this.log.info('Invalidating cache');
        this.#cachedContent = undefined;
        this.#cachedTimestamp = 0;
        this.stopObserving();
        this.clearTimers();
    }

    /**
     * Clear all pending timers
     */
    clearTimers() {
        if (this.#delayedRecheckTimer) {
            clearTimeout(this.#delayedRecheckTimer);
            this.#delayedRecheckTimer = null;
        }
    }

    set cachedContent(content) {
        if (content === undefined) {
            this.invalidateCache();
            return;
        }

        this.#cachedContent = /** @type {any} */ (content);
        this.#cachedTimestamp = Date.now();
        this.startObserving();
    }

    isCacheExpired() {
        const cacheExpiration = this.getFeatureSetting('cacheExpiration') || 30000;
        return Date.now() - this.#cachedTimestamp > cacheExpiration;
    }

    observeContentChanges() {
        // Use MutationObserver to detect content changes
        if (window.MutationObserver) {
            this.mutationObserver = new MutationObserver((_mutations) => {
                this.log.info('MutationObserver', _mutations);
                // Invalidate cache when content changes
                this.cachedContent = undefined;
            });
        }
    }

    /**
     * Schedule a delayed recheck after navigation events
     */
    scheduleDelayedRecheck() {
        // Clear any existing delayed recheck
        if (this.#delayedRecheckTimer) {
            clearTimeout(this.#delayedRecheckTimer);
        }

        const delayMs = this.getFeatureSetting('navigationRecheckDelayMs') || 1500;

        this.log.info('Scheduling delayed recheck', { delayMs });
        this.#delayedRecheckTimer = setTimeout(() => {
            this.log.info('Performing delayed recheck after navigation');

            // Store the previous content for comparison
            const previousContent = this.cachedContent;

            // Force fresh collection by invalidating cache
            this.invalidateCache();

            // Collect fresh content
            const freshContent = this.collectPageContent();

            // Only send if content has meaningfully changed
            if (this.hasContentChanged(previousContent, freshContent)) {
                this.log.info('Content changed after navigation delay - sending update');
                this.sendContentResponse(freshContent);
            } else {
                this.log.info('No significant content change after navigation delay');
            }

            this.#delayedRecheckTimer = null;
        }, delayMs);
    }

    /**
     * Check if content has meaningfully changed
     * @param {any} oldContent
     * @param {any} newContent
     * @returns {boolean}
     */
    hasContentChanged(oldContent, newContent) {
        if (!oldContent || !newContent) {
            return true;
        }

        // Compare key content fields
        const fieldsToCompare = ['title', 'content', 'headings'];

        for (const field of fieldsToCompare) {
            const oldValue = JSON.stringify(oldContent[field] || '');
            const newValue = JSON.stringify(newContent[field] || '');

            if (oldValue !== newValue) {
                this.log.info('Content changed in field', field);
                return true;
            }
        }

        return false;
    }

    startObserving() {
        this.log.info('Starting observing', this.mutationObserver, this.#cachedContent);
        if (this.mutationObserver && this.#cachedContent && !this.isObserving) {
            this.isObserving = true;
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }
    }

    stopObserving() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.isObserving = false;
        }
    }

    handleContentCollectionRequest() {
        this.log.info('Handling content collection request');
        try {
            const content = this.collectPageContent();
            this.sendContentResponse(content);
        } catch (error) {
            this.sendErrorResponse(error);
        }
    }

    collectPageContent() {
        // Check cache first - getter handles expiry and cleanup
        if (this.cachedContent) {
            this.log.info('Returning cached content', this.cachedContent);
            return this.cachedContent;
        }

        const mainContent = this.getMainContent();
        const truncated = mainContent.endsWith('...');

        const content = {
            favicon: getFaviconList(),
            title: this.getPageTitle(),
            metaDescription: this.getMetaDescription(),
            content: mainContent,
            truncated,
            fullContentLength: this.fullContentLength, // Include full content length before truncation
            headings: this.getHeadings(),
            links: this.getLinks(),
            images: this.getImages(),
            timestamp: Date.now(),
            url: window.location.href,
        };

        // Cache the result - setter handles timestamp and observer
        this.cachedContent = content;
        return content;
    }

    getPageTitle() {
        const title = document.title || '';
        const maxTitleLength = this.getFeatureSetting('maxTitleLength') || 100;

        if (title.length > maxTitleLength) {
            return title.substring(0, maxTitleLength).trim() + '...';
        }

        return title;
    }

    getMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') || '' : '';
    }

    getMainContent() {
        const maxLength = this.getFeatureSetting('maxContentLength') || 9500;
        // Used to avoid large content serialization
        const upperLimit = this.getFeatureSetting('upperLimit') || 500000;
        let excludeSelectors = this.getFeatureSetting('excludeSelectors') || ['.ad', '.sidebar', '.footer', '.nav', '.header'];
        excludeSelectors = excludeSelectors.concat(['script', 'style', 'link', 'meta', 'noscript', 'svg', 'canvas']);

        let content = '';
        // Get content from main content areas
        let mainContent = document.querySelector('main, article, .content, .main, #content, #main');
        if (mainContent && mainContent.innerHTML.trim().length <= 100) {
            mainContent = null;
        }
        const contentRoot = mainContent || document.body;

        if (contentRoot) {
            this.log.info('Getting main content', contentRoot);
            // Create a clone to work with
            const clone = /** @type {Element} */ (contentRoot.cloneNode(true));

            // Remove excluded elements
            excludeSelectors.forEach((selector) => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach((el) => el.remove());
            });

            this.log.info('Calling domToMarkdown', clone.innerHTML);
            content += domToMarkdown(clone, upperLimit);
            this.log.info('Content markdown', content, clone, contentRoot);
        }
        content = content.trim();

        // Store the full content length before truncation
        this.fullContentLength = content.length;

        // Limit content length
        if (content.length > maxLength) {
            this.log.info('Truncating content', content);
            content = content.substring(0, maxLength) + '...';
        }

        return content;
    }

    getHeadings() {
        const headings = [];
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

        headingElements.forEach((heading) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent?.trim();
            if (text) {
                headings.push({ level, text });
            }
        });

        return headings;
    }

    getLinks() {
        const links = [];
        const linkElements = document.querySelectorAll('a[href]');

        linkElements.forEach((link) => {
            const text = link.textContent?.trim();
            const href = link.getAttribute('href');
            if (text && href && text.length > 0) {
                links.push({ text, href });
            }
        });

        return links;
    }

    getImages() {
        const images = [];
        const imgElements = document.querySelectorAll('img');

        imgElements.forEach((img) => {
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            if (src) {
                images.push({ alt, src });
            }
        });

        return images;
    }

    sendContentResponse(content) {
        if (this.lastSentContent && this.lastSentContent === content) {
            this.log.info('Content already sent');
            return;
        }
        this.lastSentContent = content;
        this.log.info('Sending content response', content);
        this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
            // TODO: This is a hack to get the data to the browser. We should probably not be paying this cost.
            serializedPageData: JSON.stringify(content),
        });
    }

    sendErrorResponse(error) {
        this.log.error('Error sending content response', error);
        this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
            success: false,
            error: error.message || 'Unknown error occurred',
            timestamp: Date.now(),
        });
    }
}
