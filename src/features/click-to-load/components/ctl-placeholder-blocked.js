import { html } from '../../../dom-utils'
import css from '../assets/ctl-placeholder-block.css'
import { logoImg as daxImg } from '../ctl-assets'

/**
 * The custom HTML element (Web Component) template with the placeholder for blocked
 * embedded content. The constructor gets a list of parameters with the
 * content and event handlers for this template.
 * This is currently only used in our Mobile Apps, but can be expanded in the future.
 */
export class DDGCtlPlaceholderBlockedElement extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-ctl-placeholder-blocked'

    /**
     * Set observed attributes that will trigger attributeChangedCallback()
     */
    static get observedAttributes () {
        return ['style']
    }

    /**
     * Placeholder element for blocked content
     * @type {HTMLDivElement | null}
     */
    placeholderBlocked = null

    /**
     *
     * @param {{
     *   devMode: boolean,
     *   isMobileApp: boolean, // Flag if element is running on our mobile platforms
     *   title: string, // Card title text
     *   body: string, // Card body text
     *   unblockBtnText: string, // Unblock button text
     *   useSlimCard?: boolean, // Flag for using less padding on card (ie YT CTL on mobile)
     *   originalElement: HTMLElement, // The original element this placeholder is replacing.
     *   sharedStrings: {readAbout: string, learnMore: string, shareFeedback: string}, // Shared localized string
     *   withToggle?: { // Toggle config to be displayed in the bottom of the placeholder
     *      isActive: boolean,  // Toggle state
     *      dataKey: string,    // data-key attribute for button
     *      label: string,      // Text to be presented with toggle
     *      onClick: () => void // Toggle click callback
     *   },
     *   withFeedback?: {
     *      onClick: () => void // Share Feedback link click callback
     *   }, // Shows feedback link on tablet and desktop sizes,
     *   onButtonClick: (originalElement: HTMLIFrameElement | HTMLElement, replacementElement: HTMLElement) => (e: any) => void,
     * }} params
     */
    constructor (params) {
        super()
        this.params = params
        /**
         * Create the shadow root, closed to prevent any outside observers
         * @type {ShadowRoot}
         */
        const shadow = this.attachShadow({
            mode: this.params.devMode ? 'open' : 'closed'
        })

        /**
         * Add our styles
         * @type {HTMLStyleElement}
         */
        const style = document.createElement('style')
        style.innerText = css

        /**
         * Creates the placeholder for blocked content
         * @type {HTMLDivElement}
         */
        this.placeholderBlocked = this.createPlaceholder()
        /**
         * Creates the Share Feedback element
         * @type {HTMLDivElement | null}
         */
        const feedbackLink = this.params.withFeedback ? this.createShareFeedbackLink() : null
        /**
         * Setup the click handlers
         */
        this.setupEventListeners(this.placeholderBlocked, feedbackLink)

        /**
         * Append both to the shadow root
         */
        feedbackLink && this.placeholderBlocked.appendChild(feedbackLink)
        shadow.appendChild(this.placeholderBlocked)
        shadow.appendChild(style)
    }

    /**
     * Creates a placeholder for content blocked by Click to Load.
     * @returns {HTMLDivElement}
     */
    createPlaceholder = () => {
        const { title, body, unblockBtnText, useSlimCard, withToggle, withFeedback } = this.params

        const container = document.createElement('div')
        container.classList.add('DuckDuckGoSocialContainer')

        const learnMoreLink = this.createLearnMoreLink()

        container.innerHTML = html`
            <div
                class="ddg-ctl-placeholder-card${useSlimCard ? ' slim-card' : ''}${withFeedback ? ' with-feedback-link' : ''}"
            >
                <div class="ddg-ctl-placeholder-card-header">
                    <img class="ddg-ctl-placeholder-card-header-dax" src=${daxImg} alt="DuckDuckGo Dax" />
                    <div class="ddg-ctl-placeholder-card-title">${title}. ${learnMoreLink}</div>
                </div>
                <div class="ddg-ctl-placeholder-card-body">
                    <div class="ddg-ctl-placeholder-card-body-text">${body} ${learnMoreLink}</div>
                    <button class="DuckDuckGoButton tertiary ddg-ctl-unblock-btn" type="button">
                        <div>${unblockBtnText}</div>
                    </button>
                </div>
                ${withToggle
        ? html`<div class="ddg-ctl-placeholder-card-footer">${this.createToggleButton()}</div> `
        : ''}
            </div>
        `.toString()

        return container
    }

    /**
     * Creates a template string for Learn More link.
     */
    createLearnMoreLink = () => {
        const { sharedStrings } = this.params

        return html`<a
            class="ddg-text-link ddg-learn-more"
            aria-label="${sharedStrings.readAbout}"
            href="https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/"
            target="_blank"
        >
            ${sharedStrings.learnMore}
        </a>`
    }

    /**
     * Creates a Feedback Link container row
     * @returns {HTMLDivElement}
     */
    createShareFeedbackLink = () => {
        const { sharedStrings } = this.params

        const container = document.createElement('div')
        container.classList.add('ddg-ctl-feedback-row')

        container.innerHTML = html`
            <button class="ddg-ctl-feedback-link" type="button">${sharedStrings.shareFeedback}</button>
        `.toString()

        return container
    }

    /**
     * Creates a template string for a toggle button with text.
     */
    createToggleButton = () => {
        const { withToggle, isMobileApp } = this.params
        if (!withToggle) return

        const { isActive, dataKey, label } = withToggle

        const toggleButton = html`
            <div class="ddg-toggle-button-container">
                <button
                    class="ddg-toggle-button ${isActive ? 'active' : 'inactive'} ${isMobileApp ? 'mobile' : ''}"
                    type="button"
                    aria-pressed=${!!isActive}
                    data-key=${dataKey}
                >
                    <div class="ddg-toggle-button-bg"></div>
                    <div class="ddg-toggle-button-knob"></div>
                </button>
                <div class="ddg-toggle-button-label">${label}</div>
            </div>
        `
        return toggleButton
    }

    /**
     *
     * @param {HTMLElement} containerElement
     * @param {HTMLElement?} feedbackLink
     */
    setupEventListeners = (containerElement, feedbackLink) => {
        const { withToggle, withFeedback, originalElement, onButtonClick } = this.params

        containerElement
            .querySelector('button.ddg-ctl-unblock-btn')
            ?.addEventListener('click', onButtonClick(originalElement, this))

        if (withToggle) {
            containerElement
                .querySelector('.ddg-toggle-button-container')
                ?.addEventListener('click', withToggle.onClick)
        }
        if (withFeedback && feedbackLink) {
            feedbackLink.querySelector('.ddg-ctl-feedback-link')?.addEventListener('click', withFeedback.onClick)
        }
    }

    /**
     * Use JS to calculate the width of the root element placeholder. We could use a CSS Container Query, but full
     * support to it was only added recently, so we're not using it for now.
     * https://caniuse.com/css-container-queries
     * @returns {'size-sm' | 'size-md' | 'size-lg' | null} Returns a string for the width calculated for the root element
     */
    calculatePlaceholderWidthSize = () => {
        const { width } = this.getBoundingClientRect()
        if (width) {
            const size = width < 480 ? 'size-sm' : width < 720 ? 'size-md' : 'size-lg'
            return size
        }
        return null
    }

    /**
     * Web Component lifecycle function.
     * When element is first added to the DOM, trigger this callback and
     * update the element CSS size class.
     */
    connectedCallback () {
        const size = this.calculatePlaceholderWidthSize()
        if (size) {
            this.placeholderBlocked?.classList.add(size)
        }
    }

    /**
     * Web Component lifecycle function.
     * When the root element gets the 'style' attribute updated, reflect that in the container
     * element inside the shadow root. This way, we can copy the size and other styles from the root
     * element and have the inner context be able to use the same sizes to adapt the template layout.
     * @param {string} attr Observed attribute key
     * @param {*} _ Attribute old value, ignored
     * @param {*} newValue Attribute new value
     */
    attributeChangedCallback (attr, _, newValue) {
        if (this.placeholderBlocked && attr === 'style') {
            this.placeholderBlocked[attr].cssText = newValue
        }
    }
}

customElements.define(DDGCtlPlaceholderBlockedElement.CUSTOM_TAG_NAME, DDGCtlPlaceholderBlockedElement)
