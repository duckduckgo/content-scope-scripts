import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

/**
 * Duck AI Listener Feature
 *
 * This feature listens for AI context data via bridge communication and automatically
 * enters it into text boxes on duckduckgo.com, particularly for AI chat functionality.
 */
export default class DuckAiListener extends ContentFeature {
    /** @type {HTMLInputElement | HTMLTextAreaElement | null} */
    textBox = null;

    /** @type {Object | null} */
    pageData = null;

    /** @type {any} */
    bridge = null;

    init() {
        // Only activate on duckduckgo.com
        if (!this.shouldActivate()) {
            return;
        }
        console.log('DuckAiListener: Initializing on duckduckgo.com');
        if (document.readyState === 'complete') {
            this.setup();
        } else {
            document.addEventListener('DOMContentLoaded', this.setup.bind(this));
        }
    }

    async setup() {
        this.setupMessageBridge();
        this.setupTextBoxDetection();
    }

    /**
     * Check if this feature should be active on the current domain
     * @returns {boolean}
     */
    shouldActivate() {
        if (isBeingFramed()) {
            return false;
        }
        const hostname = window.location.hostname;
        return hostname === 'duckduckgo.com' || hostname.endsWith('.duckduckgo.com');
    }

    /**
     * Set up message bridge using the same pattern as fake-duck-ai
     */
    async setupMessageBridge() {
        try {
            // @ts-expect-error - navigator.duckduckgo is injected by the browser
            if (!navigator.duckduckgo) {
                console.warn('DuckAiListener: navigator.duckduckgo not available');
                return;
            }

            const featureName = 'aiChat';
            // @ts-expect-error - createMessageBridge is injected by the browser
            if (!navigator.duckduckgo.createMessageBridge) {
                console.warn('DuckAiListener: createMessageBridge not available');
                return;
            }

            // @ts-expect-error - createMessageBridge is injected by the browser
            this.bridge = navigator.duckduckgo.createMessageBridge(featureName);
            if (!this.bridge) {
                console.warn('DuckAiListener: Failed to create message bridge');
                return;
            }

            console.log('DuckAiListener: Created message bridge successfully');

            // Try to get initial page context
            try {
                const getPageContext = await this.bridge.request('getPageContext');
                console.log('DuckAiListener: Initial page context:', getPageContext);
                this.handlePageContextData(getPageContext);
            } catch (error) {
                console.log('DuckAiListener: No initial page context available:', error);
            }

            // Subscribe to page context updates (matches fake-duck-ai exactly)
            this.bridge.subscribe('submitPageContext', (event) => {
                console.log('DuckAiListener: Received page context update:', event);
                this.handlePageContextData(event);
            });
        } catch (error) {
            console.error('DuckAiListener: Error setting up message bridge:', error);
        }
    }

    /**
     * Handle page context data from bridge communication (matches fake-duck-ai exactly)
     * @param {Object} data - The received page context data
     */
    handlePageContextData(data) {
        try {
            if (data.serializedPageData) {
                const pageDataParsed = JSON.parse(data.serializedPageData);
                console.log('DuckAiListener: Parsed page data:', pageDataParsed);

                if (pageDataParsed.content) {
                    this.pageData = pageDataParsed;
                    this.insertContextIntoTextBox(pageDataParsed.content);
                }
            }
        } catch (error) {
            console.error('DuckAiListener: Error parsing page context data:', error);
        }
    }

    /**
     * Set up detection of the text box on the page
     */
    setupTextBoxDetection() {
        this.findTextBox();
        if (this.textBox && this.pageData) {
            this.insertContextIntoTextBox(this.pageData.content);
        }
    }

    /**
     * Find the AI chat text box
     */
    findTextBox() {
        const element = document.querySelector('textarea[name="user-prompt"]');

        if (element && element instanceof HTMLTextAreaElement) {
            if (this.textBox !== element) {
                this.textBox = element;
                console.log('DuckAiListener: Found AI text box');
            }
        } else if (this.textBox) {
            this.textBox = null;
            console.log('DuckAiListener: AI text box not found');
        }
    }

    /**
     * Insert context into the text box
     * @param {string} context - The context to insert
     */
    insertContextIntoTextBox(context) {
        if (!context || typeof context !== 'string') {
            console.warn('DuckAiListener: Invalid context provided for insertion');
            return;
        }

        this.findTextBox(); // Refresh text box

        if (!this.textBox) {
            console.log('DuckAiListener: No text box found for context insertion');
            return;
        }

        console.log('DuckAiListener: Inserting context into text box');

        // Set the value (limit to 2000 chars like fake-duck-ai)
        this.textBox.value = context.slice(0, 2000);

        // Trigger events to ensure the input is properly processed
        this.textBox.dispatchEvent(new Event('input', { bubbles: true }));
        this.textBox.dispatchEvent(new Event('change', { bubbles: true }));

        // Focus the text box
        this.textBox.focus();

        // Auto-resize if it's a textarea
        if (this.textBox instanceof HTMLTextAreaElement) {
            this.autoResizeTextArea(this.textBox);
        }

        console.log('DuckAiListener: Successfully inserted context');
    }

    /**
     * Auto-resize a textarea based on content
     * @param {HTMLTextAreaElement} textarea
     */
    autoResizeTextArea(textarea) {
        // Calculate number of lines
        const lines = Math.ceil(textarea.value.length / 50) || 1;
        textarea.style.height = lines * 24 + 'px'; // Approximate line height
    }
}
