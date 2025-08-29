import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';

/**
 * Duck AI Listener Feature
 *
 * This feature listens for AI context data via bridge communication and automatically
 * enters it into text boxes on duckduckgo.com, particularly for AI chat functionality.
 */
export default class DuckAiListener extends ContentFeature {
    /** @type {HTMLTextAreaElement | null} */
    textBox = null;

    /** @type {Object | null} */
    pageData = null;

    /** @type {any} */
    bridge = null;

    /** @type {HTMLInputElement | null} */
    checkbox = null;

    /** @type {HTMLDivElement | null} */
    checkboxContainer = null;

    /** @type {string | null} */
    lastInjectedContext = null;

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
        this.createCheckboxUI();
        await this.setupMessageBridge();
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
        if (window.location.hostname === 'duckduckgo.com') {
            const url = new URL(window.location.href);
            return url.searchParams.has('duckai');
        }
        return false;
    }

    /**
     * Create the floating checkbox UI element
     */
    createCheckboxUI() {
        // Create container div
        this.checkboxContainer = document.createElement('div');
        this.checkboxContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px 12px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        // Create checkbox
        this.checkbox = document.createElement('input');
        this.checkbox.type = 'checkbox';
        this.checkbox.id = 'duck-ai-context-inject';
        this.checkbox.checked = true; // Default to checked for auto-injection
        this.checkbox.style.cssText = `
            margin: 0;
            cursor: pointer;
        `;

        // Create label
        const label = document.createElement('label');
        label.htmlFor = 'duck-ai-context-inject';
        label.textContent = 'Auto-inject page context';
        label.style.cssText = `
            cursor: pointer;
            user-select: none;
        `;

        // Add event listener for checkbox changes
        this.checkbox.addEventListener('change', this.handleCheckboxChange.bind(this));

        // Assemble UI
        this.checkboxContainer.appendChild(this.checkbox);
        this.checkboxContainer.appendChild(label);
        document.body.appendChild(this.checkboxContainer);

        console.log('DuckAiListener: Created checkbox UI');
    }

    /**
     * Handle checkbox state changes
     */
    handleCheckboxChange() {
        if (!this.checkbox) return;

        if (this.checkbox.checked) {
            // Checkbox is now checked - inject context if available
            if (this.pageData && this.pageData.content) {
                this.insertContextIntoTextBox(this.pageData.content);
            }
        } else {
            // Checkbox is now unchecked - clear input if it matches current context
            this.clearContextFromTextBox();
        }
    }

    /**
     * Clear context from text box if it matches the current context
     */
    clearContextFromTextBox() {
        this.findTextBox(); // Refresh text box reference

        if (!this.textBox || !this.lastInjectedContext) {
            return;
        }

        // Check if current value matches the last injected context
        const currentValue = this.textBox.value.trim();
        const lastContext = this.lastInjectedContext.trim();

        if (currentValue === lastContext) {
            console.log('DuckAiListener: Clearing injected context from text box');
            this.setReactTextAreaValue(this.textBox, '');
        }
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
        if (!this.textBox) {
            this.setupTextBoxMutationObserver();
        }
    }
    /**
     * Set up mutation observer for text box detection
     */
    setupTextBoxMutationObserver() {
        const config = { childList: true, subtree: true };
        this.mutationObserver = null;

        // Callback function to execute when mutations are observed
        const callback = (mutationList, observer) => {
            this.findTextBox();
            if (this.textBox && this.pageData) {
                this.insertContextIntoTextBox(this.pageData.content);
                // No longer needed, we've found the text box.
                observer.disconnect();
            }
        };

        // Create an observer instance linked to the callback function
        this.mutationObserver = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        this.mutationObserver.observe(document.body, config);
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

        // Check if checkbox is unchecked - if so, don't inject
        if (!this.checkbox || !this.checkbox.checked) {
            console.log('DuckAiListener: Context injection disabled via checkbox');
            return;
        }

        this.findTextBox(); // Refresh text box

        if (!this.textBox) {
            console.log('DuckAiListener: No text box found for context insertion');
            return;
        }

        console.log('DuckAiListener: Inserting context into text box');

        // Set the value using React-compatible approach (limit to 2000 chars like fake-duck-ai)
        const contextValue = context.slice(0, 2000);
        this.setReactTextAreaValue(this.textBox, contextValue);

        // Track the last injected context for clearing later
        this.lastInjectedContext = contextValue;

        // Focus the text box
        this.textBox.focus();

        console.log('DuckAiListener: Successfully inserted context', this.textBox.value);
        console.log(this.textBox);
    }

    /**
     * Set textarea value in a React-compatible way
     * Based on the approach from broker-protection/actions/fill-form.js
     * @param {HTMLTextAreaElement} textarea - The textarea element
     * @param {string} value - The value to set
     */
    setReactTextAreaValue(textarea, value) {
        try {
            // Access the original setter to bypass React's controlled component behavior
            const originalSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

            if (!originalSet || typeof originalSet.call !== 'function') {
                console.warn('DuckAiListener: Cannot access original value setter, falling back to direct assignment');
                textarea.value = value;
                return;
            }

            // Set the textarea value using the original setter and trigger React events
            textarea.dispatchEvent(new Event('keydown', { bubbles: true }));
            originalSet.call(textarea, value);

            const events = [
                new Event('input', { bubbles: true }),
                new Event('keyup', { bubbles: true }),
                new Event('change', { bubbles: true }),
            ];

            // Dispatch events twice to ensure React picks up the change
            events.forEach((ev) => textarea.dispatchEvent(ev));
            originalSet.call(textarea, value);
            events.forEach((ev) => textarea.dispatchEvent(ev));
        } catch (error) {
            console.error('DuckAiListener: Error setting React textarea value:', error);
            // Fallback to direct assignment
            textarea.value = value;
        }
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
