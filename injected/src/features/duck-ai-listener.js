import ContentFeature from '../content-feature.js';
import { isBeingFramed, isDuckAiSidebar } from '../utils.js';

/**
 * Duck AI Listener Feature
 *
 * This feature listens for AI context data via bridge communication and shows
 * a context chip below the input field. When the user sends a message, it
 * appends the page context to the end.
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

    /** @type {HTMLElement | null} */
    contextChip = null;

    /** @type {boolean} */
    #_isPageContextEnabled = false;

    /** @type {boolean} */
    hasContextBeenUsed = false;

    /** @type {boolean} */
    userExplicitlyDisabledContext = false;

    /** @type {string | null} */
    lastInjectedContext = null;

    /** @type {string | null} */
    globalPageContext = null;

    /** @type {HTMLButtonElement | null} */
    sendButton = null;

    /** @type {boolean} */
    isRequestInProgress = false;

    /** @type {Function | null} */
    contextPromiseResolve = null;

    /** @type {DuckAiPromptTelemetry | null} */
    promptTelemetry = null;

    /**
     * Get the page context enabled state
     * @returns {boolean}
     */
    get isPageContextEnabled() {
        return this.#_isPageContextEnabled;
    }

    /**
     * Set the page context enabled state and update UI accordingly
     * @param {boolean} enabled - Whether page context should be enabled
     */
    set isPageContextEnabled(enabled) {
        if (this.#_isPageContextEnabled === enabled) {
            return; // No change needed
        }

        this.#_isPageContextEnabled = enabled;

        // Update UI based on new state
        if (enabled) {
            if (this.pageData && this.pageData.content && !this.hasContextBeenUsed) {
                this.createContextChip();
            }
        } else {
            this.removeContextChip();
        }

        this.updateButtonAppearance();
    }

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
        this.setupTelemetry();
        this.cleanupExistingPrompts();
        this.setupPromptCleanupObserver();
    }

    /**
     * Check if this feature should be active on the current domain
     * @returns {boolean}
     */
    shouldActivate() {
        if (isBeingFramed()) {
            return false;
        }
        return isDuckAiSidebar();
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
            subtree: true,
        });
    }

    /**
     * Insert the page context button adjacent to existing button container
     * @param {HTMLElement} imageInput - The input[name="image"] element to position after
     */
    insertButton(imageInput) {
        // Find the parent container that holds the input controls
        const inputContainer = imageInput.closest('div');
        if (!inputContainer) {
            this.log.warn('Could not find input container');
            return;
        }

        // Find the parent of the input container to create wrapper structure
        const parentContainer = inputContainer.parentNode;
        if (!parentContainer) {
            this.log.warn('Could not find parent container');
            return;
        }

        // Check if we've already created the wrapper structure
        let buttonGroupWrapper = /** @type {HTMLElement | null} */ (parentContainer.querySelector('#duck-ai-button-group-wrapper'));
        if (buttonGroupWrapper) {
            this.log.info('Button wrapper already exists, updating button');
            const existingButton = buttonGroupWrapper.querySelector('#duck-ai-context-button');
            if (existingButton) {
                existingButton.remove();
            }
        } else {
            // Create wrapper structure
            buttonGroupWrapper = document.createElement('div');
            buttonGroupWrapper.id = 'duck-ai-button-group-wrapper';
            buttonGroupWrapper.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            // Create wrapper for existing buttons/inputs
            const existingWrapper = document.createElement('div');
            existingWrapper.id = 'duck-ai-existing-controls-wrapper';
            existingWrapper.style.cssText = 'flex: 1;';

            // Move the existing input container into the existing wrapper
            existingWrapper.appendChild(inputContainer);

            // Add both wrappers to the button group wrapper
            buttonGroupWrapper.appendChild(existingWrapper);

            // Insert the button group wrapper where the input container was
            parentContainer.appendChild(buttonGroupWrapper);
        }

        // Create the page context button
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.id = 'duck-ai-context-button';
        this.button.innerHTML = `
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C14.2091 4.27829e-08 16 1.79086 16 4V10C16 12.2091 14.2091 14 12 14H4C1.79086 14 9.6639e-08 12.2091 0 10V4C9.66449e-08 1.79086 1.79086 8.05326e-08 4 0H12ZM4 1.25C2.48122 1.25 1.25 2.48122 1.25 4V10C1.25 11.5188 2.48122 12.75 4 12.75H12C13.5188 12.75 14.75 11.5188 14.75 10V5.3125C14.75 4.7257 14.2743 4.25 13.6875 4.25H10.427C9.1625 4.24998 8.00656 3.53554 7.44104 2.40454C7.08727 1.697 6.36405 1.25002 5.573 1.25H4ZM7.375 9C7.72018 9 8 9.27982 8 9.625C8 9.97018 7.72018 10.25 7.375 10.25H3.625C3.27982 10.25 3 9.97018 3 9.625C3 9.27982 3.27982 9 3.625 9H7.375ZM9.375 6C9.72018 6 10 6.27982 10 6.625C10 6.97018 9.72018 7.25 9.375 7.25H3.625C3.27982 7.25 3 6.97018 3 6.625C3 6.27982 3.27982 6 3.625 6H7.375ZM8.17761 1.25C8.3237 1.43222 8.45191 1.63137 8.55896 1.84546C8.91273 2.553 9.63595 2.99998 10.427 3H13.6875C14.0239 3 14.3435 3.07189 14.6318 3.20105C14.2895 2.07196 13.2409 1.25 12 1.25H8.17761Z" fill="currentColor"/>
            </svg>
        `;
        this.button.title = 'Toggle page context attachment';

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
            fill: currentColor;
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
            flex-shrink: 0;
            color: rgb(102, 102, 102); /* Default light mode color */
        `;

        // Listen for theme changes to update button appearance
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            colorSchemeQuery.addEventListener('change', () => {
                this.updateButtonAppearance();
            });
        }

        // Add hover effect
        this.button.addEventListener('mouseenter', () => {
            if (this.button && !this.hasContextBeenUsed) {
                const isDark = this.isDarkMode();

                if (isDark) {
                    this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                    this.button.style.color = 'rgb(255, 255, 255)';
                } else {
                    this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                    this.button.style.color = 'rgb(51, 51, 51)';
                }
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

        // Insert button as adjacent to the existing control group
        buttonGroupWrapper.appendChild(this.button);

        // Set initial appearance based on enabled state
        this.updateButtonAppearance();

        this.log.info('Created page context button with wrapper structure');
    }

    /**
     * Set up telemetry for prompt tracking
     */
    setupTelemetry() {
        this.promptTelemetry = new DuckAiPromptTelemetry(this.messaging, this.log);
        this.log.info('Set up prompt telemetry');
    }

    removeContextChip() {
        if (this.contextChip) {
            this.contextChip.remove();
            this.contextChip = null;
        }
    }

    /**
     * Create the context chip below the input field
     */
    createContextChip() {
        // Guard clause: only proceed if we have page data and haven't used context yet
        if (!this.pageData) {
            return;
        }

        // Don't create chip if context has already been used
        if (this.hasContextBeenUsed) {
            this.removeContextChip();
            return;
        }

        this.removeContextChip();

        if (!this.pageData.content) {
            return;
        }

        // Find the textarea to position the chip below it
        if (!this.textBox) {
            this.findTextBox();
        }
        if (!this.textBox) {
            return;
        }
        const textarea = this.textBox;

        // Create the context chip
        this.contextChip = document.createElement('div');
        this.contextChip.id = 'duck-ai-context-chip';
        this.contextChip.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            margin-top: 8px;
            font-size: 14px;
            color: rgb(51, 51, 51);
            width: fit-content;
            max-width: 200px;
            box-sizing: border-box;
            overflow: hidden;
            flex-shrink: 0;
        `;

        // Add custom website icon
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const favicon = this.pageData?.favicon?.[0]?.href;

        // Build the inner content based on whether we have a favicon
        let innerContent;
        if (favicon) {
            innerContent = `<image href="${favicon}" x="6" y="5" width="16" height="16" rx="1"/>`;
        } else {
            innerContent = `<rect x="6" y="5" width="16" height="16" rx="1" fill="black"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.6666 8.81775C20.6666 8.869 20.6513 8.91525 20.622 8.95775C20.5915 8.999 20.5599 9.02025 20.5235 9.02025C20.2315 9.05025 19.9911 9.15025 19.8058 9.3215C19.6194 9.4915 19.4282 9.81775 19.2301 10.2978L16.2046 17.5653C16.1846 17.6328 16.1295 17.6665 16.038 17.6665C15.9665 17.6665 15.9114 17.6328 15.8715 17.5653L14.1746 13.7828L12.2233 17.5653C12.1834 17.6328 12.1283 17.6665 12.0568 17.6665C11.97 17.6665 11.9126 17.6328 11.8844 17.5653L8.91167 10.2978C8.72639 9.8465 8.53055 9.5315 8.32416 9.35275C8.11895 9.174 7.83164 9.06275 7.46459 9.02025C7.43293 9.02025 7.40244 9.00275 7.37547 8.9665C7.34732 8.9315 7.33325 8.89025 7.33325 8.844C7.33325 8.72525 7.36491 8.6665 7.42824 8.6665C7.69326 8.6665 7.97002 8.679 8.25967 8.704C8.52821 8.73025 8.78151 8.74275 9.01839 8.74275C9.25996 8.73025 9.54492 8.73025 9.87327 8.704C10.2169 8.679 10.5218 8.6665 10.7868 8.6665C10.8501 8.6665 10.8818 8.72525 10.8818 8.844C10.8818 8.9615 10.8618 9.02025 10.8231 9.02025C10.5581 9.0415 10.3494 9.114 10.1969 9.23525C10.0445 9.35775 9.96826 9.51775 9.96826 9.7165C9.96826 9.81775 9.99992 9.944 10.0632 10.0953L12.52 16.009L13.9143 13.2015L12.615 10.2978C12.3816 9.78025 12.1893 9.44525 12.0392 9.29525C11.8891 9.1465 11.6616 9.054 11.3567 9.02025C11.3286 9.02025 11.3028 9.00275 11.277 8.9665C11.2512 8.9315 11.2383 8.89025 11.2383 8.844C11.2383 8.72525 11.2652 8.6665 11.3215 8.6665C11.5866 8.6665 11.8293 8.679 12.0509 8.704C12.2644 8.73025 12.4919 8.74275 12.7334 8.74275C12.9703 8.74275 13.2213 8.73025 13.4863 8.704C13.7595 8.679 14.0281 8.6665 14.2931 8.6665C14.3564 8.6665 14.3881 8.72525 14.3881 8.844C14.3881 8.9615 14.3693 9.02025 14.3294 9.02025C13.7994 9.059 13.5344 9.219 13.5344 9.5015C13.5344 9.62775 13.5953 9.824 13.7185 10.089L14.578 11.949L15.4329 10.2478C15.5514 10.0078 15.6112 9.80525 15.6112 9.64025C15.6112 9.25275 15.3462 9.0465 14.8161 9.02025C14.768 9.02025 14.7446 8.9615 14.7446 8.844C14.7446 8.8015 14.7563 8.7615 14.7797 8.724C14.8044 8.68525 14.8278 8.6665 14.8513 8.6665C15.0413 8.6665 15.2746 8.679 15.5514 8.704C15.8164 8.73025 16.0345 8.74275 16.2046 8.74275C16.3265 8.74275 16.5071 8.7315 16.744 8.71025C17.0442 8.6815 17.2963 8.6665 17.498 8.6665C17.5449 8.6665 17.5684 8.7165 17.5684 8.81775C17.5684 8.95275 17.525 9.02025 17.4382 9.02025C17.1298 9.054 16.8812 9.14525 16.6936 9.29275C16.5059 9.44025 16.2714 9.77525 15.9911 10.2978L14.8513 12.544L16.3945 15.8953L18.673 10.2478C18.7516 10.0415 18.7915 9.8515 18.7915 9.679C18.7915 9.26525 18.5265 9.0465 17.9964 9.02025C17.9483 9.02025 17.9249 8.9615 17.9249 8.844C17.9249 8.72525 17.96 8.6665 18.0316 8.6665C18.2251 8.6665 18.4549 8.679 18.7199 8.704C18.965 8.73025 19.1714 8.74275 19.3368 8.74275C19.5115 8.74275 19.7132 8.73025 19.9419 8.704C20.1799 8.679 20.3934 8.6665 20.5833 8.6665C20.6384 8.6665 20.6666 8.7165 20.6666 8.81775Z" fill="white"/>`;
        }

        // Common SVG structure - outer parts shared between favicon and fallback
        const svgOuter = `
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_d_2072_7831)">
                    <rect x="2" y="1" width="36" height="36" rx="6" fill="white"/>
                    <rect x="24" y="6" width="10" height="2" rx="1" fill="#D9D9D9"/>
                    <rect x="24" y="12" width="10" height="2" rx="1" fill="#D9D9D9"/>
                    <rect x="24" y="18" width="10" height="2" rx="1" fill="#D9D9D9"/>
                    <rect x="6" y="24" width="28" height="2" rx="1" fill="#D9D9D9"/>
                    <rect x="6" y="30" width="23" height="2" rx="1" fill="#D9D9D9"/>
                    <g clip-path="url(#clip0_2072_7831)">
                        ${innerContent}
                    </g>
                </g>
                <defs>
                    <filter id="filter0_d_2072_7831" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="1"/>
                        <feGaussianBlur stdDeviation="1"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2072_7831"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2072_7831" result="shape"/>
                    </filter>
                    <clipPath id="clip0_2072_7831">
                        <rect x="6" y="5" width="16" height="16" rx="2" fill="white"/>
                    </clipPath>
                </defs>
            </svg>
        `;

        icon.innerHTML = svgOuter;

        // Add title and content info
        const contentInfo = document.createElement('div');
        contentInfo.style.cssText = `
            flex: 1;
            min-width: 0;
            overflow: hidden;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-weight: 600;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        title.textContent = this.pageData.title || 'Page Content';

        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
            font-size: 12px;
            color: rgb(102, 102, 102);
        `;
        subtitle.textContent = this.pageData.truncated ? 'Page Content (Truncated)' : 'Page Content';

        contentInfo.appendChild(title);
        contentInfo.appendChild(subtitle);

        // Add info icon
        const infoIcon = document.createElement('div');
        infoIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 12V8M8 6H8.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
        infoIcon.style.cssText = `
            flex-shrink: 0;
            color: rgb(102, 102, 102);
            cursor: pointer;
        `;
        infoIcon.title = 'Attach page context to the prompt';

        // Add warning icon if content is truncated
        const warningIcon = document.createElement('div');
        if (this.pageData.truncated) {
            warningIcon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1.5L15 14H1L8 1.5Z" stroke="#ff6b35" stroke-width="1.5" fill="none"/>
                    <path d="M8 6V9M8 11H8.01" stroke="#ff6b35" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            `;
            warningIcon.style.cssText = `
                flex-shrink: 0;
                color: #ff6b35;
                cursor: pointer;
                margin-left: 4px;
            `;
            warningIcon.title = 'Content has been truncated due to size limits';
        }

        // Add dark mode support
        if (this.isDarkMode()) {
            this.contextChip.style.background = 'rgba(255, 255, 255, 0.1)';
            this.contextChip.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            this.contextChip.style.color = 'rgb(255, 255, 255)';
            title.style.color = 'rgb(255, 255, 255)';
            subtitle.style.color = 'rgb(204, 204, 204)';
            infoIcon.style.color = 'rgb(204, 204, 204)';
        }

        // Assemble the chip
        this.contextChip.appendChild(icon);
        this.contextChip.appendChild(contentInfo);
        this.contextChip.appendChild(infoIcon);
        if (this.pageData.truncated) {
            this.contextChip.appendChild(warningIcon);
        }

        this.log.info('Context chip assembled, about to insert into DOM');

        // Insert the chip below the textarea
        const textareaParent = textarea.parentNode;
        this.log.info('textareaParent found:', !!textareaParent);
        if (textareaParent) {
            textareaParent.insertBefore(this.contextChip, textarea.nextSibling);
            this.log.info('Context chip inserted into DOM');
        } else {
            this.log.error('No textarea parent found for context chip insertion');
        }

        this.log.info('Created context chip');
    }

    /**
     * Handle button click to toggle page context or fetch context if not available
     */
    async handleButtonClick() {
        if (!this.button || this.hasContextBeenUsed) return;

        const hasContext = this.pageData && this.pageData.content;
        let newState;

        // If no context is available, try to fetch it first
        if (!hasContext) {
            this.log.info('No context available, attempting to fetch...');
            const success = await this.requestPageContext(true);

            // If we successfully got context, enable it
            if (success && this.pageData && this.pageData.content) {
                newState = true;
            } else {
                // No context was fetched, keep current state unchanged
                newState = this.isPageContextEnabled;
            }
        } else {
            // Toggle the page context enabled state (existing behavior when context is available)
            newState = !this.isPageContextEnabled;
        }

        // Track when user explicitly disables context
        if (!newState) {
            this.userExplicitlyDisabledContext = true;
        } else {
            // Reset the flag when user re-enables
            this.userExplicitlyDisabledContext = false;
        }

        // Set the new state (setter will handle UI updates and no-change cases)
        this.isPageContextEnabled = newState;

        // Send telemetry and trigger events
        this.sendToggleTelemetry();
        this.triggerInputEvents();

        this.log.info('Page context state:', this.isPageContextEnabled);
    }

    /**
     * Send toggle telemetry if bridge is available
     * @private
     */
    sendToggleTelemetry() {
        if (this.bridge) {
            this.bridge.notify('togglePageContextTelemetry', { enabled: this.isPageContextEnabled });
        }
    }

    /**
     * Determine if dark mode is preferred
     * @returns {boolean}
     */
    isDarkMode() {
        return window?.matchMedia('(prefers-color-scheme: dark)')?.matches;
    }

    /**
     * Update button appearance based on enabled state, context availability, and theme
     */
    updateButtonAppearance() {
        if (!this.button) return;

        const isDark = this.isDarkMode();
        const hasContext = this.pageData && this.pageData.content;

        if (this.hasContextBeenUsed) {
            // Button is disabled after context has been used
            this.button.style.backgroundColor = 'transparent';
            this.button.style.cursor = 'not-allowed';
            if (isDark) {
                this.button.style.color = 'rgb(102, 102, 102)';
            } else {
                this.button.style.color = 'rgb(204, 204, 204)';
            }
        } else if (this.isPageContextEnabled && hasContext) {
            // Button is selected and context is available - show active state
            if (isDark) {
                this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                this.button.style.color = 'rgb(255, 255, 255)';
            } else {
                this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
                this.button.style.color = 'rgb(51, 51, 51)';
            }
            this.button.style.cursor = 'pointer';
        } else {
            // Button is not selected or no context available - show default state
            this.button.style.backgroundColor = 'transparent';
            this.button.style.cursor = 'pointer';
            if (isDark) {
                this.button.style.color = 'rgb(204, 204, 204)';
            } else {
                this.button.style.color = 'rgb(102, 102, 102)';
            }
        }
    }

    /**
     * Request page context from the bridge with explicit consent tracking
     * @param {boolean} explicitConsent - Whether this request has explicit user consent
     * @returns {Promise<boolean>} - Whether context was successfully retrieved
     */
    async requestPageContext(explicitConsent = false) {
        if (!this.bridge) {
            this.log.warn('No bridge available to fetch context');
            return false;
        }

        // Prevent concurrent requests
        if (this.isRequestInProgress) {
            this.log.info('Request already in progress, ignoring duplicate request');
            return false;
        }

        this.isRequestInProgress = true;
        try {
            // Make the bridge request
            const getPageContext = await this.bridge.request('getPageContext', { explicitConsent });
            const logMessage = explicitConsent ? 'Fetched page context on demand:' : 'Initial page context:';
            this.log.info(logMessage, getPageContext);

            // Try to process the direct response
            this.handlePageContextData(getPageContext);

            // For initial requests (no explicit consent), don't wait for subscription since it may not be set up yet
            if (!explicitConsent) {
                return !!(this.pageData && this.pageData.content);
            }

            // For explicit user requests, create a promise that the subscription callback can resolve
            const contextPromise = new Promise((resolve) => {
                this.contextPromiseResolve = resolve;

                // Timeout after 3 seconds
                setTimeout(() => {
                    if (this.contextPromiseResolve === resolve) {
                        this.contextPromiseResolve = null;
                        resolve(false);
                    }
                }, 3000);
            });

            // If direct response had valid content, promise would be resolved already
            if (!this.contextPromiseResolve) {
                return true;
            }

            // Otherwise wait for the data to arrive via subscription (or timeout)
            const success = await contextPromise;
            this.log.info('Context promise resolved:', success);

            return success;
        } catch (error) {
            // Clean up promise resolver on error
            this.contextPromiseResolve = null;
            const logMessage = explicitConsent ? 'Failed to fetch page context:' : 'No initial page context available:';
            this.log.info(logMessage, error);
            return false;
        } finally {
            this.isRequestInProgress = false;
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
            await this.requestPageContext(false);

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
            if (data?.serializedPageData) {
                const pageDataParsed = JSON.parse(data.serializedPageData);
                this.log.info('Parsed page data:', pageDataParsed);

                if (pageDataParsed.content) {
                    this.pageData = pageDataParsed;

                    // Resolve any pending context promise
                    if (this.contextPromiseResolve) {
                        this.contextPromiseResolve(true);
                        this.contextPromiseResolve = null;
                    }

                    // Auto-enable context when it becomes available (only if not used yet and user hasn't explicitly disabled it)
                    if (!this.hasContextBeenUsed && !this.isPageContextEnabled && !this.userExplicitlyDisabledContext) {
                        this.isPageContextEnabled = true;
                        // Note: setter will call createContextChip(), so no need to call it explicitly here
                    } else {
                        // Always update button appearance when context data changes
                        this.updateButtonAppearance();

                        // Only call createContextChip if not auto-enabled (setter didn't run)
                        if (this.isPageContextEnabled && !this.hasContextBeenUsed) {
                            this.createContextChip();
                        }
                    }

                    // Check for truncated content and warn user
                    if (pageDataParsed.truncated) {
                        this.log.warn('Page content has been truncated due to size limits');
                    }

                    this.setupMessageInterception();
                }
            } else {
                this.log.info('No page data parsed');
                this.pageData = null;
                this.updateButtonAppearance();
                this.removeContextChip();
            }
        } catch (error) {
            this.log.error('Error parsing page context data:', error);
        }
    }

    findSendButton() {
        return document.querySelector('main button[type="submit"], main button[aria-label*="send"], main button[aria-label*="Send"]');
    }

    /**
     * Set up interception of the send button to append context
     */
    setupMessageInterception() {
        if (this.sendButton) {
            return;
        }
        const sendButton = this.findSendButton();
        if (sendButton && sendButton instanceof HTMLButtonElement) {
            this.sendButton = sendButton;

            // Use multiple event listeners to catch React's event handling
            const handleClick = this.handleSendMessage.bind(this);

            sendButton.addEventListener('click', handleClick, true); // Capture phase
            // sendButton.addEventListener('click', handleClick, false); // Bubble phase

            this.log.info('Set up message interception with multiple event listeners', sendButton);
        }
    }

    /**
     * Handle send message to append context if enabled
     */
    handleSendMessage() {
        this.log.info('handleSendMessage called');

        // Capture prompt text for telemetry before any modifications
        if (this.textBox && this.promptTelemetry) {
            const rawPromptText = this.getRawPromptText();
            const totalPromptText = this.textBox.value; // This includes context if enabled
            const contextSize = this.pageData?.content?.length || 0;
            const contextData = this.isPageContextEnabled && this.pageData?.content ? this.pageData : null;
            this.promptTelemetry.onPromptSent(
                rawPromptText,
                totalPromptText,
                this.isPageContextEnabled && this.pageData?.content ? contextSize : 0,
                contextData,
            );
        }

        this.hasContextBeenUsed = true;

        // Trigger input events since the value getter behavior just changed
        this.triggerInputEvents();

        // Remove the context chip
        this.removeContextChip();

        // Update button appearance
        this.updateButtonAppearance();
    }

    /**
     * Clean up a paragraph element if it contains a prompt structure
     * @param {HTMLElement} paragraph - The paragraph element to check and clean
     * @returns {boolean} - True if paragraph was cleaned up
     */
    cleanupPromptParagraph(paragraph) {
        const text = paragraph.textContent || '';

        // Use regex to match any prompt structure with any random number
        const promptRegex = /<prompt-([^>]+)>\s*([\s\S]*?)\s*<\/prompt-\1>/;
        const match = text.match(promptRegex);

        if (match) {
            const extractedPrompt = match[2].trim();

            // Create cleaned content
            let cleanedContent = '';
            if (extractedPrompt) {
                cleanedContent = `${extractedPrompt}\n📄 Page context attached`;
            }

            // Replace the paragraph content
            paragraph.textContent = cleanedContent;

            this.log.info('Cleaned up prompt paragraph');
            return true;
        }

        return false;
    }

    /**
     * Set up observer to continuously clean up prompt displays in conversation
     */
    setupPromptCleanupObserver() {
        // Create observer to watch for new prompts appearing in the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node instanceof Element) {
                        // Look for paragraph tags that might contain our prompt
                        const paragraphs = node.querySelectorAll('p');
                        const allParagraphs = node.tagName === 'P' ? [node, ...paragraphs] : [...paragraphs];

                        allParagraphs.forEach((p) => {
                            // Try to clean up this paragraph
                            this.cleanupPromptParagraph(/** @type {HTMLElement} */ (p));
                        });
                    }
                });
            });
        });

        // Start observing continuously
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        this.log.info('Set up continuous observer for prompt cleanup');
    }

    /**
     * Clean up any existing prompt structures in the conversation
     * This runs once on script initialization to handle prompts already displayed
     */
    cleanupExistingPrompts() {
        // Find all paragraphs in the conversation that might contain prompt structures
        const allParagraphs = document.querySelectorAll('p');
        let cleanedCount = 0;

        allParagraphs.forEach((p) => {
            // Use shared cleanup function for existing prompts (no specific prompt text to match)
            if (this.cleanupPromptParagraph(/** @type {HTMLElement} */ (p))) {
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            this.log.info(`Cleaned up ${cleanedCount} existing prompt(s) on page load`);
        }
    }

    /**
     * Get the raw prompt text without context appended
     * @returns {string} The raw user prompt text
     */
    getRawPromptText() {
        if (!this.textBox) return '';

        // Get the original value descriptor to access raw value
        const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
        if (originalDescriptor && originalDescriptor.get) {
            return originalDescriptor.get.call(this.textBox) || '';
        }
        return this.textBox.value || '';
    }

    /**
     * Set up detection of the text box on the page
     */
    setupTextBoxDetection() {
        this.findTextBox();
        if (this.textBox && this.pageData && !this.hasContextBeenUsed) {
            this.createContextChip();
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
            this.setupMessageInterception();
            if (this.textBox && this.pageData && this.sendButton) {
                this.createContextChip();
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

                // Add enter key handler to call handleSendMessage
                element.addEventListener('keyup', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        this.log.info('Enter key pressed');
                        this.handleSendMessage();
                    }
                });

                // Set up property descriptor to intercept value reads for context appending
                this.setupValuePropertyDescriptor(element);
            }
        } else if (this.textBox) {
            this.textBox = null;
            this.log.info('AI text box not found');
        }
    }

    /**
     * Trigger keyboard and input events on the textbox to simulate user input
     */
    triggerInputEvents() {
        if (!this.textBox) return;

        // Create and dispatch keydown event
        const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Unidentified',
            code: 'Unidentified',
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        this.textBox.dispatchEvent(keydownEvent);

        // Create and dispatch input event for immediate updates
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        this.textBox.dispatchEvent(inputEvent);

        // Create and dispatch keyup event
        const keyupEvent = new KeyboardEvent('keyup', {
            key: 'Unidentified',
            code: 'Unidentified',
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        this.textBox.dispatchEvent(keyupEvent);

        this.log.info('Triggered keyboard events for input simulation');
    }

    /**
     * Set up property descriptor to intercept value reads for context appending
     * @param {HTMLTextAreaElement} textarea - The textarea element
     */
    setupValuePropertyDescriptor(textarea) {
        // Store the original value property descriptor
        const originalDescriptor = Object.getOwnPropertyDescriptor(textarea, 'value');
        this.randomNumber = window.crypto?.randomUUID?.() || Math.floor(Math.random() * 1000);
        const instructions =
            this.getFeatureSetting('instructions') ||
            `
You are a helpful assistant that can answer questions and help with tasks.
Do not include prompt, page-title, page-context, or instructions tags in your response.
Answer the prompt using the page-title, and page-context ONLY if it's relevant to answering the prompt.`;

        // Override the value property using arrow functions to capture this context
        Object.defineProperty(textarea, 'value', {
            get: () => {
                // Always append context when the value is read
                if (originalDescriptor && originalDescriptor.get) {
                    const currentValue = originalDescriptor.get.call(textarea) || '';

                    // If context has been used, always return the raw current value (including empty string)
                    if (this.hasContextBeenUsed) {
                        return currentValue;
                    }

                    const pageContext = this.pageData?.content || '';
                    const randomNumber = this.randomNumber;
                    const shouldAddContext = pageContext && this.isPageContextEnabled && currentValue;

                    if (shouldAddContext) {
                        const truncatedWarning = this.pageData?.truncated ? ' (Content was truncated due to size limits)\n' : '\n';
                        return `Prompt:
<prompt-${randomNumber}>
${currentValue}
</prompt-${randomNumber}>

Instructions:
<instructions-${randomNumber}>
${instructions}
</instructions-${randomNumber}>

Page Title:
<page-title-${randomNumber}>
${this.pageData.title}
</page-title-${randomNumber}>

Page Context:
<page-context-${randomNumber}>
${pageContext}
${truncatedWarning}
</page-context-${randomNumber}>`;
                    }

                    return currentValue;
                }
                return '';
            },
            set: (val) => {
                if (originalDescriptor && originalDescriptor.set) {
                    const oldValue = originalDescriptor.get?.call(textarea) || '';
                    originalDescriptor.set.call(textarea, val);

                    // Trigger keyboard events if value actually changed
                    if (oldValue !== val) {
                        this.triggerInputEvents();
                    }
                }
            },
            configurable: true,
        });
    }
}

/**
 * Duck AI Prompt Telemetry Helper
 *
 * Handles daily aggregation and reporting of prompt usage telemetry.
 * Stores prompt sizes and sends daily aggregated reports.
 */
class DuckAiPromptTelemetry {
    static STORAGE_KEY = 'aiChatPageContextTelemetry';
    static CONTEXT_PIXEL_NAME = 'dc_contextInfo';
    static DAILY_PIXEL_NAME = 'dc_pageContextDailyTelemetry';
    static ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    constructor(messaging, log) {
        this.messaging = messaging;
        this.log = log;
        this.setupPixelConfig();
        this.checkShouldFireDailyTelemetry();
    }

    /**
     * Get current telemetry data from localStorage
     * @returns {Object|null} Stored telemetry data or null if none exists
     */
    getTelemetryData() {
        try {
            const stored = localStorage.getItem(DuckAiPromptTelemetry.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            this.log.error('Error reading telemetry data:', error);
            return null;
        }
    }

    /**
     * Save telemetry data to localStorage
     * @param {Object} data - Data to store
     */
    saveTelemetryData(data) {
        try {
            localStorage.setItem(DuckAiPromptTelemetry.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            this.log.error('Error saving telemetry data:', error);
        }
    }

    /**
     * Clear stored telemetry data
     */
    clearTelemetryData() {
        try {
            localStorage.removeItem(DuckAiPromptTelemetry.STORAGE_KEY);
            this.log.info('Telemetry data cleared');
        } catch (error) {
            this.log.error('Error clearing telemetry data:', error);
        }
    }

    /**
     * Store prompt telemetry when user sends a prompt
     * @param {Object} promptData - Prompt size data
     * @param {number} promptData.rawSize - Size of raw user prompt
     * @param {number} promptData.totalSize - Total size including context
     * @param {number} [promptData.contextSize] - Size of page context added
     */
    storePromptTelemetry(promptData) {
        const now = Date.now();
        let data = this.getTelemetryData();

        if (!data) {
            // First prompt - initialize storage
            data = {
                firstPromptDate: now,
                promptData: [],
            };
            this.log.info('Initialized telemetry storage for first prompt');
        }

        // Add the prompt data to our collection
        data.promptData.push(promptData);
        this.saveTelemetryData(data);

        this.log.info(
            `Stored prompt telemetry: raw=${promptData.rawSize}, total=${promptData.totalSize}, context=${promptData.contextSize || 0}, total_prompts=${data.promptData.length}`,
        );
    }

    /**
     * Check if daily telemetry should be fired and send if needed
     * @returns {boolean} True if telemetry was sent, false otherwise
     */
    checkShouldFireDailyTelemetry() {
        const data = this.getTelemetryData();

        if (!data || !data.firstPromptDate || (data.promptData || data.promptSizes || []).length === 0) {
            // No data stored or no prompts to report
            return false;
        }

        const now = Date.now();
        const timeSinceFirstPrompt = now - data.firstPromptDate;

        if (timeSinceFirstPrompt >= DuckAiPromptTelemetry.ONE_DAY_MS) {
            // Over a day has passed - send telemetry
            this.sendDailyTelemetry(data);
            this.clearTelemetryData();
            return true;
        }

        return false;
    }

    /**
     * Send daily telemetry with aggregated prompt data
     * @param {Object} data - Stored telemetry data
     */
    sendDailyTelemetry(data) {
        // Support both old format (promptSizes array) and new format (promptData array)
        const promptData = data.promptData || data.promptSizes?.map((size) => ({ rawSize: size, totalSize: size })) || [];
        const totalPrompts = promptData.length;

        if (totalPrompts === 0) {
            this.log.info('No prompts to report in daily telemetry');
            return;
        }

        // Extract raw and total sizes
        const rawSizes = promptData.map((p) => p.rawSize || p.totalSize || p);
        const totalSizes = promptData.map((p) => p.totalSize || p.rawSize || p);
        const contextSizes = promptData.map((p) => p.contextSize || 0).filter((size) => size > 0);

        // Calculate aggregate statistics for raw prompts
        const totalRawCharacters = rawSizes.reduce((sum, size) => sum + size, 0);
        const avgRawPromptSize = Math.round(totalRawCharacters / totalPrompts);

        // Calculate aggregate statistics for total prompts (including context)
        const totalAllCharacters = totalSizes.reduce((sum, size) => sum + size, 0);
        const avgTotalPromptSize = Math.round(totalAllCharacters / totalPrompts);

        // Calculate context statistics
        const avgContextSize =
            contextSizes.length > 0 ? Math.round(contextSizes.reduce((sum, size) => sum + size, 0) / contextSizes.length) : 0;
        const contextUsageRate = contextSizes.length / totalPrompts;

        // Create size buckets for privacy-friendly reporting
        const rawSizeBuckets = this.categorizeSizes(rawSizes);
        const totalSizeBuckets = this.categorizeSizes(totalSizes);

        const createSizeFields = (prefix, buckets) => {
            const sizeNames = ['xxxsmall', 'xxsmall', 'xsmall', 'small', 'medium', 'large', 'xlarge', 'xxlarge', 'xxxlarge'];
            const capitalizeSize = (size) =>
                size.replace(/(x*)(.*)/, (_, xs, rest) => xs.toUpperCase() + rest.charAt(0).toUpperCase() + rest.slice(1));

            return Object.fromEntries(sizeNames.map((size) => [`${prefix}Size${capitalizeSize(size)}`, String(buckets[size] || 0)]));
        };

        const telemetryData = {
            totalPrompts: String(totalPrompts),
            avgRawPromptSize: this.bucketSizeByThousands(avgRawPromptSize),
            ...createSizeFields('raw', rawSizeBuckets),
            avgTotalPromptSize: this.bucketSizeByThousands(avgTotalPromptSize),
            ...createSizeFields('total', totalSizeBuckets),
            avgContextSize: this.bucketSizeByThousands(avgContextSize),
            contextUsageRate: String(Math.round(contextUsageRate * 100)),
        };

        this.log.info('Sending daily telemetry pixel:', telemetryData);

        // Send telemetry as pixel
        this.sendPixel(DuckAiPromptTelemetry.DAILY_PIXEL_NAME, telemetryData);
    }

    /**
     * Categorize prompt sizes into privacy-friendly buckets using 1k intervals
     * @param {number[]} promptSizes - Array of prompt sizes
     * @returns {Object} Bucket counts
     */
    categorizeSizes(promptSizes) {
        const sizeCategories = [
            { name: 'xxxsmall', maxSize: 999 },
            { name: 'xxsmall', maxSize: 1999 },
            { name: 'xsmall', maxSize: 2999 },
            { name: 'small', maxSize: 3999 },
            { name: 'medium', maxSize: 4999 },
            { name: 'large', maxSize: 5999 },
            { name: 'xlarge', maxSize: 6999 },
            { name: 'xxlarge', maxSize: 7999 },
            { name: 'xxxlarge', maxSize: Infinity },
        ];

        const buckets = Object.fromEntries(sizeCategories.map((category) => [category.name, 0]));

        promptSizes.forEach((size) => {
            const category = sizeCategories.find((cat) => size <= cat.maxSize);
            if (category) {
                buckets[category.name]++;
            }
        });

        return buckets;
    }

    /**
     * Setup pixel configuration for telemetry
     */
    setupPixelConfig() {
        if (!globalThis?.DDG?.pixel) {
            return;
        }
        globalThis.DDG.pixel._pixels[DuckAiPromptTelemetry.CONTEXT_PIXEL_NAME] = {};
        globalThis.DDG.pixel._pixels[DuckAiPromptTelemetry.DAILY_PIXEL_NAME] = {};
    }

    /**
     * Send pixel with telemetry data
     * @param {string} pixelName - Name of pixel to fire
     * @param {Object} params - Parameters to send with pixel
     */
    sendPixel(pixelName, params) {
        if (!globalThis?.DDG?.pixel) {
            return;
        }
        globalThis.DDG.pixel.fire(pixelName, params);
    }

    /**
     * Bucket numbers by thousands for privacy-friendly reporting
     * @param {number} number - Number to bucket
     * @returns {string} Bucket lower bound (e.g., '0', '1000', '2000')
     */
    bucketSizeByThousands(number) {
        if (number <= 0) {
            return '0';
        }
        const bucketIndex = Math.floor(number / 1000);
        return String(bucketIndex * 1000);
    }

    /**
     * Send context pixel info when context is used
     * @param {Object} contextData - Context data object
     */
    sendContextPixelInfo(contextData) {
        if (!contextData?.content) {
            this.log.warn('sendContextPixelInfo: No content available for pixel tracking');
            return;
        }

        this.sendPixel(DuckAiPromptTelemetry.CONTEXT_PIXEL_NAME, {
            contextLength: this.bucketSizeByThousands(contextData.content.length),
        });
    }

    /**
     * Handle prompt sent event - store telemetry and check daily firing
     * @param {string} rawPromptText - The raw user prompt text
     * @param {string} totalPromptText - The full prompt including context
     * @param {number} [contextSize] - Size of page context added
     * @param {Object} [contextData] - Context data for pixel tracking
     */
    onPromptSent(rawPromptText, totalPromptText, contextSize = 0, contextData = null) {
        if (!rawPromptText || typeof rawPromptText !== 'string') {
            this.log.warn('Invalid raw prompt text provided to telemetry');
            return;
        }
        if (!totalPromptText || typeof totalPromptText !== 'string') {
            this.log.warn('Invalid total prompt text provided to telemetry');
            return;
        }

        const promptData = {
            rawSize: rawPromptText.length,
            totalSize: totalPromptText.length,
            contextSize,
        };

        // Send context pixel info if context was used
        if (contextData && contextSize > 0) {
            this.sendContextPixelInfo(contextData);
        }
        // Check if we should fire daily telemetry
        this.checkShouldFireDailyTelemetry();

        // Store the prompt telemetry
        this.storePromptTelemetry(promptData);
    }
}
