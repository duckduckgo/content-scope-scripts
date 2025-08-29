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

    /** @type {HTMLButtonElement | null} */
    button = null;

    /** @type {boolean} */
    isPageContextEnabled = true;

    /** @type {string | null} */
    lastInjectedContext = null;

    /**
     * Logging utility for this feature
     */
    log = {
        info: (...args) => {
            if (this.isDebug) {
                console.log('DuckAiListener:', ...args);
            }
        },
        warn: (...args) => {
            if (this.isDebug) {
                console.warn('DuckAiListener:', ...args);
            }
        },
        error: (...args) => {
            if (this.isDebug) {
                console.error('DuckAiListener:', ...args);
            }
        }
    };

    init() {
        // Only activate on duckduckgo.com
        if (!this.shouldActivate()) {
            return;
        }
        this.log.info('Initializing on duckduckgo.com');
        if (document.readyState === 'complete') {
            this.setup();
        } else {
            document.addEventListener('DOMContentLoaded', this.setup.bind(this));
        }
    }

    async setup() {
        this.createButtonUI();
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
     * Create the page context button in the input field
     */
    createButtonUI() {
        // Try to find the input[name="image"] element to position button after it
        const imageInput = document.querySelector('input[name="image"]');
        if (!imageInput) {
            // If not found immediately, set up observer to try again later
            this.setupButtonInsertionObserver();
            return;
        }

        this.insertButton(/** @type {HTMLElement} */ (imageInput));
    }

    /**
     * Set up mutation observer to find input[name="image"] and insert button
     */
    setupButtonInsertionObserver() {
        const observer = new MutationObserver((_, obs) => {
            const imageInput = document.querySelector('input[name="image"]');
            if (imageInput) {
                this.insertButton(/** @type {HTMLElement} */ (imageInput));
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Insert the page context button after the image input
     * @param {HTMLElement} imageInput - The input[name="image"] element to position after
     */
    insertButton(imageInput) {
        // Find the parent container that holds the input controls
        const inputContainer = imageInput.closest('div');
        if (!inputContainer) {
            this.log.warn('Could not find input container');
            return;
        }

        // Create the page context button
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.id = 'duck-ai-context-button';
        this.button.innerHTML = `
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C14.2091 4.27829e-08 16 1.79086 16 4V10C16 12.2091 14.2091 14 12 14H4C1.79086 14 9.6639e-08 12.2091 0 10V4C9.66449e-08 1.79086 1.79086 8.05326e-08 4 0H12ZM4 1.25C2.48122 1.25 1.25 2.48122 1.25 4V10C1.25 11.5188 2.48122 12.75 4 12.75H12C13.5188 12.75 14.75 11.5188 14.75 10V5.3125C14.75 4.7257 14.2743 4.25 13.6875 4.25H10.427C9.1625 4.24998 8.00656 3.53554 7.44104 2.40454C7.08727 1.697 6.36405 1.25002 5.573 1.25H4ZM7.375 9C7.72018 9 8 9.27982 8 9.625C8 9.97018 7.72018 10.25 7.375 10.25H3.625C3.27982 10.25 3 9.97018 3 9.625C3 9.27982 3.27982 9 3.625 9H7.375ZM9.375 6C9.72018 6 10 6.27982 10 6.625C10 6.97018 9.72018 7.25 9.375 7.25H3.625C3.27982 7.25 3 6.97018 3 6.625C3 6.27982 3.27982 6 3.625 6H9.375ZM8.17761 1.25C8.3237 1.43222 8.45191 1.63137 8.55896 1.84546C8.91273 2.553 9.63595 2.99998 10.427 3H13.6875C14.0239 3 14.3435 3.07189 14.6318 3.20105C14.2895 2.07196 13.2409 1.25 12 1.25H8.17761Z" fill="currentColor"/>
            </svg>
        `;
        this.button.title = 'Toggle page context injection';
        
        // Style the button to match existing input field buttons
        this.button.style.cssText = `
            box-sizing: border-box;
            clip-rule: evenodd;
            color: rgb(204, 204, 204);
            color-scheme: light dark;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            fill: rgb(204, 204, 204);
            fill-rule: evenodd;
            font-feature-settings: normal;
            font-kerning: auto;
            font-optical-sizing: auto;
            font-size: 14.4px;
            font-size-adjust: none;
            font-style: normal;
            font-weight: 700;
            font-width: 100%;
            height: 28px;
            letter-spacing: -0.00875px;
            line-height: 14.4px;
            text-align: center;
            text-indent: 0px;
            text-shadow: none;
            text-transform: none;
            transform-box: view-box;
            width: 28px;
            word-spacing: 0px;
            border: none;
            background: transparent;
            padding: 0;
            border-radius: 50%;
        `;

        // Add hover effect
        this.button.addEventListener('mouseenter', () => {
            if (this.button) {
                this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
            }
        });
        this.button.addEventListener('mouseleave', () => {
            if (this.button) {
                // Restore the state-based appearance instead of always transparent
                this.updateButtonAppearance();
            }
        });

        // Add click handler
        this.button.addEventListener('click', this.handleButtonClick.bind(this));

        // Insert button after the image input
        if (imageInput.parentNode) {
            imageInput.parentNode.insertBefore(this.button, imageInput.nextSibling);
        }

        // Set initial appearance based on enabled state
        this.updateButtonAppearance();

        this.log.info('Created page context button');
    }

    /**
     * Handle button click to toggle page context
     */
    handleButtonClick() {
        if (!this.button) return;

        // Toggle the page context enabled state
        this.isPageContextEnabled = !this.isPageContextEnabled;
        
        if (this.isPageContextEnabled) {
            // Page context is now enabled - inject context if available
            if (this.pageData && this.pageData.content) {
                this.insertContextIntoTextBox(this.pageData.content);
            }
        } else {
            // Page context is now disabled - clear input if it matches current context
            this.clearContextFromTextBox();
        }
    }

    /**
     * Update button appearance based on enabled state
     */
    updateButtonAppearance() {
        if (!this.button) return;
        
        if (this.isPageContextEnabled) {
            // Button is selected - show active state
            this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
        } else {
            // Button is not selected - show default state
            this.button.style.backgroundColor = 'transparent';
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
            this.log.info('Clearing injected context from text box');
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
                this.log.warn('navigator.duckduckgo not available');
                return;
            }

            const featureName = 'aiChat';
            // @ts-expect-error - createMessageBridge is injected by the browser
            if (!navigator.duckduckgo.createMessageBridge) {
                this.log.warn('createMessageBridge not available');
                return;
            }

            // @ts-expect-error - createMessageBridge is injected by the browser
            this.bridge = navigator.duckduckgo.createMessageBridge(featureName);
            if (!this.bridge) {
                this.log.warn('Failed to create message bridge');
                return;
            }

            this.log.info('Created message bridge successfully');

            // Try to get initial page context
            try {
                const getPageContext = await this.bridge.request('getPageContext');
                this.log.info('Initial page context:', getPageContext);
                this.handlePageContextData(getPageContext);
            } catch (error) {
                this.log.info('No initial page context available:', error);
            }

            // Subscribe to page context updates (matches fake-duck-ai exactly)
            this.bridge.subscribe('submitPageContext', (event) => {
                this.log.info('Received page context update:', event);
                this.handlePageContextData(event);
            });
        } catch (error) {
            this.log.error('Error setting up message bridge:', error);
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
                this.log.info('Parsed page data:', pageDataParsed);

                if (pageDataParsed.content) {
                    this.pageData = pageDataParsed;
                    this.insertContextIntoTextBox(pageDataParsed.content);
                }
            }
        } catch (error) {
            this.log.error('Error parsing page context data:', error);
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
        const callback = (_, observer) => {
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
                this.log.info('Found AI text box');
            }
        } else if (this.textBox) {
            this.textBox = null;
            this.log.info('AI text box not found');
        }
    }

    /**
     * Insert context into the text box
     * @param {string} context - The context to insert
     */
    insertContextIntoTextBox(context) {
        if (!context || typeof context !== 'string') {
            this.log.warn('Invalid context provided for insertion');
            return;
        }

        // Check if page context is disabled - if so, don't inject
        if (!this.isPageContextEnabled) {
            this.log.info('Context injection disabled');
            return;
        }

        this.findTextBox(); // Refresh text box

        if (!this.textBox) {
            this.log.info('No text box found for context insertion');
            return;
        }

        this.log.info('Inserting context into text box');

        // Set the value using React-compatible approach (limit to 2000 chars like fake-duck-ai)
        const contextValue = context.slice(0, 2000);
        this.setReactTextAreaValue(this.textBox, contextValue);

        // Track the last injected context for clearing later
        this.lastInjectedContext = contextValue;

        // Focus the text box and scroll to top
        this.textBox.focus();
        this.textBox.scrollTop = 0;

        this.log.info('Successfully inserted context', this.textBox.value);
        this.log.info(this.textBox);
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
                this.log.warn('Cannot access original value setter, falling back to direct assignment');
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
            this.log.error('Error setting React textarea value:', error);
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
