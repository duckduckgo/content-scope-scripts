import { html } from '../../../dom-utils'
import css from '../assets/ctl-placeholder-block.css'
import { logoImg as daxImg } from '../ctl-assets'

export class DDGCtlPlaceholderBlocked extends HTMLElement {
    static CUSTOM_TAG_NAME = 'ddg-ctl-placeholder-blocked'

    /**
     *
     * @param {{
     *   fontFaceStyle: string, // DDG font-face styles
     *   devMode: boolean,
     *   title: string, // Card title text
     *   body?: string, // Card body text
     *   unblockBtnText: string, // Unblock button text
     *   useSlimCard?: boolean, // Flag for using less padding on card (ie YT CTL on mobile)
     *   originalElement: HTMLElement, // The original element this placeholder is replacing.
     *   sharedStrings: {readAbout: string, learnMore: string}, // Shared localized string
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
        const { fontFaceStyle } = this.params
        style.innerText = (fontFaceStyle ?? '\n') + css

        /**
         * Creates the placeholder for blocked content
         * @type {HTMLDivElement}
         */
        const placeholderBlocked = this.createPlaceholder()

        /**
         * Append both to the shadow root
         */
        shadow.appendChild(placeholderBlocked)
        shadow.appendChild(style)
    }

    /**
     * Creates a placeholder for content blocked by Click to Load.
     * @returns {HTMLDivElement}
     */
    createPlaceholder () {
        const { title, body, unblockBtnText, useSlimCard, originalElement, onButtonClick } = this.params

        const container = document.createElement('div')
        container.classList.add('ddg-ctl-placeholder-container')

        const learnMoreLink = this.createLearnMoreLink()

        container.innerHTML = html`<div
            class="DuckDuckGoSocialContainer ddg-ctl-placeholder-card ${useSlimCard ? 'slim-card' : ''}"
        >
            <div class="ddg-ctl-placeholder-card-header">
                <img class="ddg-ctl-placeholder-card-header-dax" src=${daxImg} />
                <div class="ddg-ctl-placeholder-card-title">${title}. ${learnMoreLink}</div>
            </div>
            ${body ? html`<div class="ddg-ctl-placeholder-card-body">${body} ${learnMoreLink}</div>` : ''}
            <button class="DuckDuckGoButton tertiary ddg-ctl-unblock-btn"><div>${unblockBtnText}</div></button>
        </div>`.toString()

        container
            .querySelector('button.ddg-ctl-unblock-btn')
            ?.addEventListener('click', onButtonClick(originalElement, this))

        return container
    }

    /**
     * Creates a template string for Learn More link.
     */
    createLearnMoreLink () {
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
}

customElements.define(DDGCtlPlaceholderBlocked.CUSTOM_TAG_NAME, DDGCtlPlaceholderBlocked)
