import ContentFeature from '../content-feature.js';
import { getFaviconList } from './favicon.js';
import { isDuckAi, isBeingFramed, getTabUrl } from '../utils.js';
const MSG_PAGE_CONTEXT_RESPONSE = 'collectionResult';

function checkNodeIsVisible(node) {
    try {
        const style = window.getComputedStyle(node);

        // Check primary visibility properties
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function collapseWhitespace(str) {
    return typeof str === 'string' ? str.replace(/\s+/g, ' ') : '';
}

/**
 * Check if a node is an HTML element
 * @param {Node} node
 * @returns {node is HTMLElement}
 **/
function isHtmlElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}

/**
 * Check if an iframe is same-origin and return its content document
 * @param {HTMLIFrameElement} iframe
 * @returns {Document | null}
 */
function getSameOriginIframeDocument(iframe) {
    try {
        // Try to access the contentDocument - this will throw if cross-origin
        const doc = iframe.contentDocument;
        if (doc && doc.documentElement) {
            return doc;
        }
    } catch (e) {
        // Cross-origin iframe - cannot access content
        return null;
    }
    return null;
}

/**
 * Stringify the children of a node to markdown
 * @param {NodeListOf<ChildNode>} childNodes
 * @param {DomToMarkdownSettings} settings
 * @param {number} depth
 * @returns {string}
 */
function domToMarkdownChildren(childNodes, settings, depth = 0) {
    if (depth > settings.maxDepth) {
        return '';
    }
    let children = '';
    for (const childNode of childNodes) {
        const childContent = domToMarkdown(childNode, settings, depth + 1);
        children += childContent;
        if (children.length > settings.maxLength) {
            children = children.substring(0, settings.maxLength) + '...';
            break;
        }
    }
    return children;
}

/**
 * @typedef {Object} DomToMarkdownSettings
 * @property {number} maxLength - Maximum length of content
 * @property {number} maxDepth - Maximum depth to traverse
 * @property {string} excludeSelectors - CSS selectors to exclude from processing
 * @property {boolean} includeIframes - Whether to include iframe content
 */

/**
 * Convert a DOM node to markdown
 * @param {Node} node
 * @param {DomToMarkdownSettings} settings
 * @param {number} depth
 * @returns {string}
 */
function domToMarkdown(node, settings, depth = 0) {
    if (depth > settings.maxDepth) {
        return '';
    }
    if (node.nodeType === Node.TEXT_NODE) {
        return collapseWhitespace(node.textContent);
    }
    if (!isHtmlElement(node)) {
        return '';
    }
    if (!checkNodeIsVisible(node) || node.matches(settings.excludeSelectors)) {
        return '';
    }

    const tag = node.tagName.toLowerCase();

    // Build children string incrementally to exit early when maxLength is exceeded
    let children = domToMarkdownChildren(node.childNodes, settings, depth + 1);

    if (node.shadowRoot) {
        children += domToMarkdownChildren(node.shadowRoot.childNodes, settings, depth + 1);
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
        case 'iframe': {
            if (!settings.includeIframes) {
                return children;
            }
            // Try to access same-origin iframe content
            const iframeDoc = getSameOriginIframeDocument(/** @type {HTMLIFrameElement} */ (node));
            if (iframeDoc && iframeDoc.body) {
                const iframeContent = domToMarkdown(iframeDoc.body, settings, depth + 1);
                return iframeContent ? `\n\n--- Iframe Content ---\n${iframeContent}\n--- End Iframe ---\n\n` : children;
            }
            // If we can't access the iframe content (cross-origin), return the children or empty string
            return children;
        }
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
    recheckCount = 0;
    recheckLimit = 0;

    init() {
        this.recheckLimit = this.getFeatureSetting('recheckLimit') || 5;
        if (!this.shouldActivate()) {
            return;
        }
        this.setupListeners();
    }

    resetRecheckCount() {
        this.recheckCount = 0;
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
                this.handleContentCollectionRequest();
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
        this.handleContentCollectionRequest();
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

                this.scheduleDelayedRecheck();
            });
        }
    }

    /**
     * Schedule a delayed recheck after navigation events
     */
    scheduleDelayedRecheck() {
        // Clear any existing delayed recheck
        this.clearTimers();
        if (this.recheckLimit > 0 && this.recheckCount >= this.recheckLimit) {
            return;
        }

        const delayMs = this.getFeatureSetting('navigationRecheckDelayMs') || 1500;

        this.log.info('Scheduling delayed recheck', { delayMs });
        this.#delayedRecheckTimer = setTimeout(() => {
            this.log.info('Performing delayed recheck after navigation');
            this.recheckCount++;
            this.invalidateCache();

            this.handleContentCollectionRequest(false);
        }, delayMs);
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

    handleContentCollectionRequest(resetRecheckCount = true) {
        this.log.info('Handling content collection request');
        if (resetRecheckCount) {
            this.resetRecheckCount();
        }
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
        // We should refactor to use iteration but for now this just caps overflow.
        const maxDepth = this.getFeatureSetting('maxDepth') || 5000;
        let excludeSelectors = this.getFeatureSetting('excludeSelectors') || ['.ad', '.sidebar', '.footer', '.nav', '.header'];
        const excludedInertElements = this.getFeatureSetting('excludedInertElements') || [
            'script',
            'style',
            'link',
            'meta',
            'noscript',
            'svg',
            'canvas',
        ];
        excludeSelectors = excludeSelectors.concat(excludedInertElements);
        const excludeSelectorsString = excludeSelectors.join(',');

        let content = '';
        // Get content from main content areas
        const mainContentSelector = this.getFeatureSetting('mainContentSelector') || 'main, article, .content, .main, #content, #main';
        let mainContent = document.querySelector(mainContentSelector);
        const mainContentLength = this.getFeatureSetting('mainContentLength') || 100;
        if (mainContent && mainContent.innerHTML.trim().length <= mainContentLength) {
            mainContent = null;
        }
        const contentRoot = mainContent || document.body;

        if (contentRoot) {
            this.log.info('Getting main content', contentRoot);
            content += domToMarkdown(contentRoot, {
                maxLength: upperLimit,
                maxDepth,
                includeIframes: this.getFeatureSettingEnabled('includeIframes', 'enabled'),
                excludeSelectors: excludeSelectorsString,
            });
            this.log.info('Content markdown', content, contentRoot);
        }
        content = content.trim();

        // Store the full content length before truncation
        this.fullContentLength = content.length;

        // Limit content length
        if (content.length > maxLength) {
            this.log.info('Truncating content', {
                content,
                contentLength: content.length,
                maxLength,
            });
            content = content.substring(0, maxLength) + '...';
        }

        return content;
    }

    getHeadings() {
        const headings = [];
        const headingSelector = this.getFeatureSetting('headingSelector') || 'h1, h2, h3, h4, h5, h6';
        const headingElements = document.querySelectorAll(headingSelector);

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
        const linkSelector = this.getFeatureSetting('linkSelector') || 'a[href]';
        const linkElements = document.querySelectorAll(linkSelector);

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
        const imgSelector = this.getFeatureSetting('imgSelector') || 'img';
        const imgElements = document.querySelectorAll(imgSelector);

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
