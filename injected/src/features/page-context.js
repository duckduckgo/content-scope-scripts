import ContentFeature from '../content-feature.js';
import { getFaviconList } from './favicon.js';
import { isDuckAi, isBeingFramed, getTabUrl } from '../utils.js';
const MSG_PAGE_CONTEXT_RESPONSE = 'collectionResult';

export default class PageContext extends ContentFeature {
    /** @type {any} */
    #cachedContent = undefined;
    #cachedTimestamp = 0;
    /** @type {MutationObserver | null} */
    mutationObserver = null;
    lastSentContent = null;
    listenForUrlChanges = true;

    init() {
        if (!this.shouldActivate()) {
            return;
        }
        this.setupContentCollection();
        window.addEventListener('DOMContentLoaded', () => {
            this.handleContentCollectionRequest();
        });
        window.addEventListener('hashchange', () => {
            this.handleContentCollectionRequest();
        });
        window.addEventListener('pageshow', () => {
            this.handleContentCollectionRequest();
        });
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                return;
            }
            this.handleContentCollectionRequest();
        });
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

    setupContentCollection() {
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

    setup() {
        // Initialize content collection when DOM is ready
        this.observeContentChanges();
    }

    get cachedContent() {
        if (!this.#cachedContent || this.isCacheExpired()) {
            // Clean up if we had content but it's expired
            if (this.#cachedContent) {
                this.#cachedContent = undefined;
                this.#cachedTimestamp = 0;
                this.stopObserving();
            }
            return undefined;
        }
        return this.#cachedContent;
    }

    set cachedContent(content) {
        if (content === undefined) {
            this.log.info('Invalidating cache');
            this.#cachedContent = undefined;
            this.#cachedTimestamp = 0;
            this.stopObserving();
            return;
        }

        this.#cachedContent = /** @type {any} */ (content);
        this.#cachedTimestamp = Date.now();
        this.startObserving();
    }

    isCacheExpired() {
        return Date.now() - this.#cachedTimestamp > 30000;
    }

    observeContentChanges() {
        // Use MutationObserver to detect content changes
        if (window.MutationObserver) {
            this.mutationObserver = new MutationObserver((_mutations) => {
                // Invalidate cache when content changes
                this.cachedContent = undefined;
            });
        }
    }

    startObserving() {
        if (this.mutationObserver && this.#cachedContent) {
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
            return this.cachedContent;
        }

        const content = {
            favicon: getFaviconList(),
            title: this.getPageTitle(),
            metaDescription: this.getMetaDescription(),
            content: this.getMainContent(),
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
        return document.title || '';
    }

    getMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') || '' : '';
    }

    getMainContent() {
        const maxLength = this.getFeatureSetting('maxContentLength') || 100000;
        const selectors = this.getFeatureSetting('contentSelectors') || ['p', 'h1', 'h2', 'h3', 'article', 'section'];
        const excludeSelectors = this.getFeatureSetting('excludeSelectors') || [
            '.ad',
            '.sidebar',
            '.footer',
            '.nav',
            '.header',
            'script',
            'style',
            'link',
            'meta',
            'noscript',
            'svg',
            'canvas',
        ];

        let content = '';
        // Get content from main content areas
        let mainContent = document.querySelector('main, article, .content, .main, #content, #main');
        if (mainContent && mainContent.innerHTML.trim().length <= 100) {
            mainContent = null;
        }
        const contentRoot = mainContent || document.body;

        if (contentRoot) {
            // Create a clone to work with
            const clone = /** @type {Element} */ (contentRoot.cloneNode(true));

            // Remove excluded elements
            excludeSelectors.forEach((selector) => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach((el) => el.remove());
            });

            // Extract text from selected elements
            selectors.forEach((selector) => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach((el) => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 10) {
                        // Only include substantial text
                        content += text + '\n\n';
                    }
                });
            });
        }

        // Limit content length
        if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '...';
        }

        return content.trim();
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
        this.log.info('Sending content response');
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
