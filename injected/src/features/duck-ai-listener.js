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
    isPageContextEnabled = false;

    /** @type {boolean} */
    hasContextBeenUsed = false;

    /** @type {string | null} */
    lastInjectedContext = null;

    /** @type {string | null} */
    globalPageContext = null;

    /** @type {HTMLButtonElement | null} */
    sendButton = null;

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
     * Create the context chip below the input field
     */
    createContextChip() {
        // Guard clause: only proceed if we have page data and haven't used context yet
        if (!this.pageData) {
            this.log.info('createContextChip: No page data available, skipping');
            return;
        }

        // Don't create chip if context has already been used
        if (this.hasContextBeenUsed) {
            this.log.info('createContextChip: Context already used, skipping');
            return;
        }

        if (this.contextChip) {
            this.contextChip.remove();
        }

        if (!this.pageData.content) {
            return;
        }

        // Find the textarea to position the chip below it
        const textarea = document.querySelector('textarea[name="user-prompt"]');
        if (!textarea) {
            return;
        }

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

        // Debug logging to see what's happening
        this.log.info('createContextChip called, this.pageData:', this.pageData);
        this.log.info('this.pageData?.favicon:', this.pageData?.favicon);

        const favicon = this.pageData?.favicon?.[0]?.href;
        this.log.info('favicon extracted:', favicon);

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

        // If no context is available, try to fetch it
        if (!hasContext) {
            this.log.info('No context available, attempting to fetch...');
            const success = await this.requestPageContext(true);

            // If we successfully got context, enable it
            if (success && this.pageData && this.pageData.content) {
                this.isPageContextEnabled = true;
                this.createContextChip();
            }
            this.updateButtonAppearance();
            return;
        }

        // Toggle the page context enabled state (existing behavior when context is available)
        this.isPageContextEnabled = !this.isPageContextEnabled;

        // Show/hide context chip based on state
        if (this.isPageContextEnabled) {
            if (this.pageData && this.pageData.content) {
                this.createContextChip();
            }
        } else {
            // Remove the context chip when disabled
            if (this.contextChip) {
                this.contextChip.remove();
                this.contextChip = null;
            }
        }

        // Update button appearance
        this.updateButtonAppearance();

        this.log.info('Page context toggled:', this.isPageContextEnabled);
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

        try {
            const getPageContext = await this.bridge.request('getPageContext', { explicitConsent });
            const logMessage = explicitConsent ? 'Fetched page context on demand:' : 'Initial page context:';
            this.log.info(logMessage, getPageContext);
            this.handlePageContextData(getPageContext);
            return true;
        } catch (error) {
            const logMessage = explicitConsent ? 'Failed to fetch page context:' : 'No initial page context available:';
            this.log.info(logMessage, error);
            return false;
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
            if (data.serializedPageData) {
                const pageDataParsed = JSON.parse(data.serializedPageData);
                this.log.info('Parsed page data:', pageDataParsed);

                if (pageDataParsed.content) {
                    this.pageData = pageDataParsed;
                    this.globalPageContext = pageDataParsed.content;

                    // Auto-enable context when it becomes available (only if not used yet)
                    if (!this.hasContextBeenUsed && !this.isPageContextEnabled) {
                        this.isPageContextEnabled = true;
                        this.updateButtonAppearance();
                    }
                    // Check for truncated content and warn user
                    if (pageDataParsed.truncated) {
                        this.log.warn('Page content has been truncated due to size limits');
                    }

                    this.createContextChip();
                    this.setupMessageInterception();
                }
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

            // Add event listeners with different capture phases
            sendButton.addEventListener('click', handleClick, true); // Capture phase
            sendButton.addEventListener('click', handleClick, false); // Bubble phase

            // Also listen for mousedown as a fallback
            sendButton.addEventListener('mousedown', () => {
                // Small delay to let React handle the event first
                setTimeout(() => {
                    this.handleSendMessage();
                }, 10);
            });

            this.log.info('Set up message interception with multiple event listeners', sendButton);
        }
    }

    /**
     * Handle send message to append context if enabled
     */
    handleSendMessage() {
        this.log.info('handleSendMessage called');

        if (!this.isPageContextEnabled || this.hasContextBeenUsed || !this.pageData?.content) {
            this.log.info('Context attachment blocked:', {
                isPageContextEnabled: this.isPageContextEnabled,
                hasContextBeenUsed: this.hasContextBeenUsed,
                hasPageData: !!this.pageData,
                hasContent: !!this.pageData?.content,
            });
            return;
        }

        // Mark context as used first to prevent multiple calls
        this.hasContextBeenUsed = true;

        // Remove the context chip
        if (this.contextChip) {
            this.contextChip.remove();
            this.contextChip = null;
        }

        // Update button appearance
        this.updateButtonAppearance();

        this.log.info('Successfully appended context to message');
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
     * Set up property descriptor to intercept value reads for context appending
     * @param {HTMLTextAreaElement} textarea - The textarea element
     */
    setupValuePropertyDescriptor(textarea) {
        // Store the original value property descriptor
        const originalDescriptor = Object.getOwnPropertyDescriptor(textarea, 'value');
        this.randomNumber = window.crypto?.randomUUID?.() || Math.floor(Math.random() * 1000);

        // Override the value property using arrow functions to capture this context
        Object.defineProperty(textarea, 'value', {
            get: () => {
                // Always append context when the value is read
                if (originalDescriptor && originalDescriptor.get) {
                    const currentValue = originalDescriptor.get.call(textarea) || '';
                    const pageContext = this.globalPageContext || '';
                    const randomNumber = this.randomNumber;
                    const instructions =
                        this.getFeatureSetting('instructions') ||
                        `
You are a helpful assistant that can answer questions and help with tasks.
Do not include prompt, page-title, page-context, or instructions tags in your response.
Answer the prompt using the page-title, and page-context ONLY if it's relevant to answering the prompt.`;

                    if (pageContext && currentValue) {
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
                    originalDescriptor.set.call(textarea, val);
                }
            },
            configurable: true,
        });
    }
}
