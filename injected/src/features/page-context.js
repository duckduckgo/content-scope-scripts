import ContentFeature from '../content-feature.js';

const MSG_PAGE_CONTEXT_COLLECT = 'collect';
const MSG_PAGE_CONTEXT_RESPONSE = 'collectionResult';
const MSG_PAGE_CONTEXT_ERROR = 'collectionError';

export default class PageContext extends ContentFeature {
    collectionCache = new Map();

    init() {
        console.log('PageContextFeature init');
        this.setupMessageHandlers();
        this.setupContentCollection();
        /*
        window.addEventListener('DOMContentLoaded', () => {
            this.handleContentCollectionRequest({});
        });
        */
    }

    setupMessageHandlers() {
        // Listen for content collection requests from macOS browser
        this.messaging.subscribe(MSG_PAGE_CONTEXT_COLLECT, (data) => {
            this.handleContentCollectionRequest(data);
        });
    }

    setupContentCollection() {
        // Set up content collection infrastructure
        if (document.body) {
            this.setup();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                this.setup();
            }, { once: true });
        }
    }

    setup() {
        // Initialize content collection when DOM is ready
        this.observeContentChanges();
    }

    observeContentChanges() {
        // Use MutationObserver to detect content changes
        if (window.MutationObserver) {
            const observer = new MutationObserver((mutations) => {
                // Invalidate cache when content changes
                this.invalidateCache();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    handleContentCollectionRequest(data) {
        try {
            const options = data?.options || {};
            const content = this.collectPageContent(options);
            this.sendContentResponse(content);
        } catch (error) {
            this.sendErrorResponse(error);
        }
    }

    collectPageContent(options = {}) {
        const cacheKey = this.getCacheKey(options);
        
        // Check cache first
        if (this.collectionCache.has(cacheKey)) {
            const cached = this.collectionCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 30000) { // 30 second cache
                return cached.data;
            }
        }

        const content = {
            title: this.getPageTitle(),
            metaDescription: this.getMetaDescription(),
            content: this.getMainContent(options),
            headings: this.getHeadings(),
            links: this.getLinks(),
            images: options.includeImages !== false ? this.getImages() : undefined,
            timestamp: Date.now(),
            url: window.location.href
        };

        // Cache the result
        this.collectionCache.set(cacheKey, {
            data: content,
            timestamp: Date.now()
        });

        return content;
    }

    getPageTitle() {
        return document.title || '';
    }

    getMetaDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') || '' : '';
    }

    getMainContent(options = {}) {
        const maxLength = options.maxContentLength || this.getFeatureSetting('maxContentLength') || 10000;
        const selectors = options.contentSelectors || this.getFeatureSetting('contentSelectors') || ['p', 'h1', 'h2', 'h3', 'article', 'section'];
        const excludeSelectors = options.excludeSelectors || this.getFeatureSetting('excludeSelectors') || ['.ad', '.sidebar', '.footer', '.nav', '.header'];

        let content = '';

        // Get content from main content areas
        const mainContent = document.querySelector('main, article, .content, .main, #content, #main');
        const contentRoot = mainContent || document.body;

        if (contentRoot) {
            // Create a clone to work with
            const clone = contentRoot.cloneNode(true);
            
            // Remove excluded elements
            excludeSelectors.forEach(selector => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            });

            // Extract text from selected elements
            selectors.forEach(selector => {
                const elements = clone.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 10) { // Only include substantial text
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
        
        headingElements.forEach(heading => {
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
        
        linkElements.forEach(link => {
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
        
        imgElements.forEach(img => {
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            if (src) {
                images.push({ alt, src });
            }
        });

        return images;
    }

    getCacheKey(options) {
        return JSON.stringify({
            url: window.location.href,
            options: options
        });
    }

    invalidateCache() {
        this.collectionCache.clear();
    }

    sendContentResponse(content) {
        this.messaging.notify(MSG_PAGE_CONTEXT_RESPONSE, {
            // TODO: This is a hack to get the data to the browser. We should probably not be paying this cost.
            serializedPageData: JSON.stringify(content)
        });
    }

    sendErrorResponse(error) {
        this.messaging.notify(MSG_PAGE_CONTEXT_ERROR, {
            success: false,
            error: error.message || 'Unknown error occurred',
            timestamp: Date.now()
        });
    }
}
