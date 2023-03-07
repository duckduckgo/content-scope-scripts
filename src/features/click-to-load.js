// @ts-nocheck
import { createCustomEvent, sendMessage, OriginalCustomEvent, originalWindowDispatchEvent } from '../utils.js'
import { logoImg, loadingImages, closeIcon } from './click-to-load/ctl-assets.js'
import { styles, getConfig } from './click-to-load/ctl-config.js'

let devMode = false
let isYoutubePreviewsEnabled = false
let appID

const titleID = 'DuckDuckGoPrivacyEssentialsCTLElementTitle'

// Configuration for how the placeholder elements should look and behave.
// @see {getConfig}
let config = null
let sharedStrings = null

// TODO: Remove these redundant data structures and refactor the related code.
//       There should be no need to have the entity configuration stored in two
//       places.
const entities = []
const entityData = {}

let readyResolver
const ready = new Promise(resolve => { readyResolver = resolve })

/*********************************************************
 *  Widget Replacement logic
 *********************************************************/
class DuckWidget {
    constructor (widgetData, originalElement, entity) {
        this.clickAction = { ...widgetData.clickAction } // shallow copy
        this.replaceSettings = widgetData.replaceSettings
        this.originalElement = originalElement
        this.dataElements = {}
        this.gatherDataElements()
        this.entity = entity
        this.widgetID = Math.random()
        // Boolean if widget is unblocked and content should not be blocked
        this.isUnblocked = false
    }

    dispatchEvent (eventTarget, eventName) {
        eventTarget.dispatchEvent(
            createCustomEvent(
                eventName, {
                    detail: {
                        entity: this.entity,
                        replaceSettings: this.replaceSettings,
                        widgetID: this.widgetID
                    }
                }
            )
        )
    }

    // Collect and store data elements from original widget. Store default values
    // from config if not present.
    gatherDataElements () {
        if (!this.clickAction.urlDataAttributesToPreserve) {
            return
        }
        for (const [attrName, attrSettings] of Object.entries(this.clickAction.urlDataAttributesToPreserve)) {
            let value = this.originalElement.getAttribute(attrName)
            if (!value) {
                if (attrSettings.required) {
                    // missing a required attribute means we won't be able to replace it
                    // with a light version, replace with full version.
                    this.clickAction.type = 'allowFull'
                }
                value = attrSettings.default
            }
            this.dataElements[attrName] = value
        }
    }

    // Return the facebook content URL to use when a user has clicked.
    getTargetURL () {
        // Copying over data fields should be done lazily, since some required data may not be
        // captured until after page scripts run.
        this.copySocialDataFields()
        return this.clickAction.targetURL
    }

    // Determine if element should render in dark mode
    getMode () {
        // Login buttons are always the login style types
        if (this.replaceSettings.type === 'loginButton') {
            return 'loginMode'
        }
        const mode = this.originalElement.getAttribute('data-colorscheme')
        if (mode === 'dark') {
            return 'darkMode'
        }
        return 'lightMode'
    }

    // The config file offers the ability to style the replaced facebook widget. This
    // collects the style from the original element & any specified in config for the element
    // type and returns a CSS string.
    getStyle () {
        let styleString = 'border: none;'

        if (this.clickAction.styleDataAttributes) {
            // Copy elements from the original div into style attributes as directed by config
            for (const [attr, valAttr] of Object.entries(this.clickAction.styleDataAttributes)) {
                let valueFound = this.dataElements[valAttr.name]
                if (!valueFound) {
                    valueFound = this.dataElements[valAttr.fallbackAttribute]
                }
                let partialStyleString = ''
                if (valueFound) {
                    partialStyleString += `${attr}: ${valueFound}`
                }
                if (!partialStyleString.includes(valAttr.unit)) {
                    partialStyleString += valAttr.unit
                }
                partialStyleString += ';'
                styleString += partialStyleString
            }
        }

        return styleString
    }

    // Some data fields are 'kept' from the original element. These are used both in
    // replacement styling (darkmode, width, height), and when returning to a FB element.
    copySocialDataFields () {
        if (!this.clickAction.urlDataAttributesToPreserve) {
            return
        }

        // App ID may be set by client scripts, and is required for some elements.
        if (this.dataElements.app_id_replace && appID != null) {
            this.clickAction.targetURL = this.clickAction.targetURL.replace('app_id_replace', appID)
        }

        for (const key of Object.keys(this.dataElements)) {
            let attrValue = this.dataElements[key]

            if (!attrValue) {
                continue
            }

            // The URL for Facebook videos are specified as the data-href
            // attribute on a div, that is then used to create the iframe.
            // Some websites omit the protocol part of the URL when doing
            // that, which then prevents the iframe from loading correctly.
            if (key === 'data-href' && attrValue.startsWith('//')) {
                attrValue = window.location.protocol + attrValue
            }

            this.clickAction.targetURL =
                this.clickAction.targetURL.replace(
                    key, encodeURIComponent(attrValue)
                )
        }
    }

    /*
        * Creates an iFrame for this facebook content.
        *
        * @returns {Element}
        */
    createFBIFrame () {
        const frame = document.createElement('iframe')

        frame.setAttribute('src', this.getTargetURL())
        frame.setAttribute('style', this.getStyle())

        return frame
    }

    /**
    * Tweaks an embedded YouTube video element ready for when it's
    * reloaded.
    *
    * @param {Element} videoElement
    * @returns {Function?} onError
    *   Function to be called if the video fails to load.
    */
    adjustYouTubeVideoElement (videoElement) {
        let onError = null

        if (!videoElement.src) {
            return onError
        }
        const url = new URL(videoElement.src)
        const { hostname: originalHostname } = url

        // Upgrade video to YouTube's "privacy enhanced" mode, but fall back
        // to standard mode if the video fails to load.
        // Note:
        //  1. Changing the iframe's host like this won't cause a CSP
        //     violation on Chrome, see https://crbug.com/1271196.
        //  2. The onError event doesn't fire for blocked iframes on Chrome.
        if (originalHostname !== 'www.youtube-nocookie.com') {
            url.hostname = 'www.youtube-nocookie.com'
            onError = (event) => {
                url.hostname = originalHostname
                videoElement.src = url.href
                event.stopImmediatePropagation()
            }
        }

        // Configure auto-play correctly depending on if the video's preview
        // loaded, otherwise it doesn't allow autoplay.
        let allowString = videoElement.getAttribute('allow') || ''
        const allowed = new Set(allowString.split(';').map(s => s.trim()))
        if (this.autoplay) {
            allowed.add('autoplay')
            url.searchParams.set('autoplay', '1')
        } else {
            allowed.delete('autoplay')
            url.searchParams.delete('autoplay')
        }
        allowString = Array.from(allowed).join('; ')
        videoElement.setAttribute('allow', allowString)

        videoElement.src = url.href
        return onError
    }

    /*
        * Fades out the given element. Returns a promise that resolves when the fade is complete.
        * @param {Element} element - the element to fade in or out
        * @param {int} interval - frequency of opacity updates (ms)
        * @param {bool} fadeIn - true if the element should fade in instead of out
        */
    fadeElement (element, interval, fadeIn) {
        return new Promise((resolve, reject) => {
            let opacity = fadeIn ? 0 : 1
            const originStyle = element.style.cssText
            const fadeOut = setInterval(function () {
                opacity += fadeIn ? 0.03 : -0.03
                element.style.cssText = originStyle + `opacity: ${opacity};`
                if (opacity <= 0 || opacity >= 1) {
                    clearInterval(fadeOut)
                    resolve()
                }
            }, interval)
        })
    }

    fadeOutElement (element) {
        return this.fadeElement(element, 10, false)
    }

    fadeInElement (element) {
        return this.fadeElement(element, 10, true)
    }

    clickFunction (originalElement, replacementElement) {
        let clicked = false
        const handleClick = async function handleClick (e) {
            // Ensure that the click is created by a user event & prevent double clicks from adding more animations
            if (e.isTrusted && !clicked) {
                this.isUnblocked = true
                clicked = true
                let isLogin = false
                const clickElement = e.srcElement // Object.assign({}, e)
                if (this.replaceSettings.type === 'loginButton') {
                    isLogin = true
                }
                window.addEventListener('ddg-ctp-unblockClickToLoadContent-complete', () => {
                    const parent = replacementElement.parentNode

                    // If we allow everything when this element is clicked,
                    // notify surrogate to enable SDK and replace original element.
                    if (this.clickAction.type === 'allowFull') {
                        parent.replaceChild(originalElement, replacementElement)
                        this.dispatchEvent(window, 'ddg-ctp-load-sdk')
                        return
                    }
                    // Create a container for the new FB element
                    const fbContainer = document.createElement('div')
                    fbContainer.style.cssText = styles.wrapperDiv
                    const fadeIn = document.createElement('div')
                    fadeIn.style.cssText = 'display: none; opacity: 0;'

                    // Loading animation (FB can take some time to load)
                    const loadingImg = document.createElement('img')
                    loadingImg.setAttribute('src', loadingImages[this.getMode()])
                    loadingImg.setAttribute('height', '14px')
                    loadingImg.style.cssText = styles.loadingImg

                    // Always add the animation to the button, regardless of click source
                    if (clickElement.nodeName === 'BUTTON') {
                        clickElement.firstElementChild.insertBefore(loadingImg, clickElement.firstElementChild.firstChild)
                    } else {
                        // try to find the button
                        let el = clickElement
                        let button = null
                        while (button === null && el !== null) {
                            button = el.querySelector('button')
                            el = el.parentElement
                        }
                        if (button) {
                            button.firstElementChild.insertBefore(loadingImg, button.firstElementChild.firstChild)
                        }
                    }

                    fbContainer.appendChild(fadeIn)

                    let fbElement
                    let onError = null
                    switch (this.clickAction.type) {
                    case 'iFrame':
                        fbElement = this.createFBIFrame()
                        break
                    case 'youtube-video':
                        onError = this.adjustYouTubeVideoElement(originalElement)
                        fbElement = originalElement
                        break
                    default:
                        fbElement = originalElement
                        break
                    }

                    // If hidden, restore the tracking element's styles to make
                    // it visible again.
                    if (this.originalElementStyle) {
                        for (const key of ['display', 'visibility']) {
                            const { value, priority } = this.originalElementStyle[key]
                            if (value) {
                                fbElement.style.setProperty(key, value, priority)
                            } else {
                                fbElement.style.removeProperty(key)
                            }
                        }
                    }

                    /*
                    * Modify the overlay to include a Facebook iFrame, which
                    * starts invisible. Once loaded, fade out and remove the overlay
                    * then fade in the Facebook content
                    */
                    parent.replaceChild(fbContainer, replacementElement)
                    fbContainer.appendChild(replacementElement)
                    fadeIn.appendChild(fbElement)
                    fbElement.addEventListener('load', () => {
                        this.fadeOutElement(replacementElement)
                            .then(v => {
                                fbContainer.replaceWith(fbElement)
                                this.dispatchEvent(fbElement, 'ddg-ctp-placeholder-clicked')
                                this.fadeInElement(fadeIn).then(() => {
                                    fbElement.focus() // focus on new element for screen readers
                                })
                            })
                    }, { once: true })
                    // Note: This event only fires on Firefox, on Chrome the frame's
                    //       load event will always fire.
                    if (onError) {
                        fbElement.addEventListener('error', onError, { once: true })
                    }
                }, { once: true })
                const action = this.entity === 'Youtube' ? 'block-ctl-yt' : 'block-ctl-fb'
                unblockClickToLoadContent({ entity: this.entity, action, isLogin })
            }
        }.bind(this)
        // If this is a login button, show modal if needed
        if (this.replaceSettings.type === 'loginButton' && entityData[this.entity].shouldShowLoginModal) {
            return function handleLoginClick (e) {
                makeModal(this.entity, handleClick, e)
            }.bind(this)
        }
        return handleClick
    }
}

function replaceTrackingElement (widget, trackingElement, placeholderElement, hideTrackingElement = false, currentPlaceholder = null) {
    widget.dispatchEvent(trackingElement, 'ddg-ctp-tracking-element')

    // Usually the tracking element can simply be replaced with the
    // placeholder, but in some situations that isn't possible and the
    // tracking element must be hidden instead.
    if (hideTrackingElement) {
        // Don't save original element styles if we've already done it
        if (!widget.originalElementStyle) {
            // Take care to note existing styles so that they can be restored.
            widget.originalElementStyle = getOriginalElementStyle(trackingElement, widget)
        }
        // Hide the tracking element and add the placeholder next to it in
        // the DOM.
        trackingElement.style.setProperty('display', 'none', 'important')
        trackingElement.style.setProperty('visibility', 'hidden', 'important')
        trackingElement.parentElement.insertBefore(placeholderElement, trackingElement)
        if (currentPlaceholder) {
            currentPlaceholder.remove()
        }
    } else {
        if (currentPlaceholder) {
            currentPlaceholder.replaceWith(placeholderElement)
        } else {
            trackingElement.replaceWith(placeholderElement)
        }
    }

    widget.dispatchEvent(placeholderElement, 'ddg-ctp-placeholder-element')
}

/**
 * Creates a placeholder element for the given tracking element and replaces
 * it on the page.
 * @param {DuckWidget} widget
 *   The CTP 'widget' associated with the tracking element.
 * @param {Element} trackingElement
 *   The tracking element on the page that should be replaced with a placeholder.
 */
async function createPlaceholderElementAndReplace (widget, trackingElement) {
    if (widget.replaceSettings.type === 'blank') {
        replaceTrackingElement(widget, trackingElement, document.createElement('div'))
    }

    if (widget.replaceSettings.type === 'loginButton') {
        const icon = widget.replaceSettings.icon
        // Create a button to replace old element
        const { button, container } = makeLoginButton(
            widget.replaceSettings.buttonText, widget.getMode(),
            widget.replaceSettings.popupBodyText, icon, trackingElement
        )
        button.addEventListener('click', widget.clickFunction(trackingElement, container))
        replaceTrackingElement(widget, trackingElement, container)
    }

    /** Facebook CTL */
    if (widget.replaceSettings.type === 'dialog') {
        const icon = widget.replaceSettings.icon
        const button = makeButton(widget.replaceSettings.buttonText, widget.getMode())
        const textButton = makeTextButton(widget.replaceSettings.buttonText, widget.getMode())
        const { contentBlock, shadowRoot } = await createContentBlock(
            widget, button, textButton, icon
        )
        button.addEventListener('click', widget.clickFunction(trackingElement, contentBlock))
        textButton.addEventListener('click', widget.clickFunction(trackingElement, contentBlock))

        replaceTrackingElement(
            widget, trackingElement, contentBlock
        )

        // Show the extra unblock link in the header if the placeholder or
        // its parent is too short for the normal unblock button to be visible.
        // Note: This does not take into account the placeholder's vertical
        //       position in the parent element.
        const { height: placeholderHeight } = window.getComputedStyle(contentBlock)
        const { height: parentHeight } = window.getComputedStyle(contentBlock.parentElement)
        if (parseInt(placeholderHeight, 10) <= 200 || parseInt(parentHeight, 10) <= 200) {
            const titleRowTextButton = shadowRoot.querySelector(`#${titleID + 'TextButton'}`)
            titleRowTextButton.style.display = 'block'
        }
    }

    /** YouTube CTL */
    if (widget.replaceSettings.type === 'youtube-video') {
        sendMessage('updateYouTubeCTLAddedFlag', true)
        await replaceYouTubeCTL(trackingElement, widget)

        // Subscribe to changes to youtubePreviewsEnabled setting
        // and update the CTL state
        window.addEventListener('ddg-settings-youtubePreviewsEnabled', ({ detail: value }) => {
            isYoutubePreviewsEnabled = value
            replaceYouTubeCTL(trackingElement, widget, true)
        })
    }
}

/**
 * @param {Element} trackingElement
 *   The original tracking element (YouTube video iframe)
 * @param {DuckWidget} widget
 *   The CTP 'widget' associated with the tracking element.
 * @param {boolean} togglePlaceholder
 *   Boolean indicating if this function should toggle between placeholders,
 *   because tracking element has already been replaced
 */
async function replaceYouTubeCTL (trackingElement, widget, togglePlaceholder = false) {
    // Skip replacing tracking element if it has already been unblocked
    if (widget.isUnblocked) {
        return
    }

    // Show YouTube Preview for embedded video
    // TODO: Fix the hideTrackingElement option and reenable, or remove it. It's
    //       disabled for YouTube videos so far since it caused multiple
    //       placeholders to be displayed on the page.
    if (isYoutubePreviewsEnabled === true) {
        const { youTubePreview, shadowRoot } = await createYouTubePreview(trackingElement, widget)
        const currentPlaceholder = togglePlaceholder ? document.getElementById(`yt-ctl-dialog-${widget.widgetID}`) : null
        replaceTrackingElement(
            widget, trackingElement, youTubePreview, /* hideTrackingElement= */ false, currentPlaceholder
        )
        showExtraUnblockIfShortPlaceholder(shadowRoot, youTubePreview)

        // Block YouTube embedded video and display blocking dialog
    } else {
        widget.autoplay = false
        const { blockingDialog, shadowRoot } = await createYouTubeBlockingDialog(trackingElement, widget)
        const currentPlaceholder = togglePlaceholder ? document.getElementById(`yt-ctl-preview-${widget.widgetID}`) : null
        replaceTrackingElement(
            widget, trackingElement, blockingDialog, /* hideTrackingElement= */ false, currentPlaceholder
        )
        showExtraUnblockIfShortPlaceholder(shadowRoot, blockingDialog)
    }
}

/**
 /* Show the extra unblock link in the header if the placeholder or
/* its parent is too short for the normal unblock button to be visible.
/* Note: This does not take into account the placeholder's vertical
/*       position in the parent element.
* @param {Element} shadowRoot
* @param {Element} placeholder Placeholder for tracking element
*/
function showExtraUnblockIfShortPlaceholder (shadowRoot, placeholder) {
    const { height: placeholderHeight } = window.getComputedStyle(placeholder)
    const { height: parentHeight } = window.getComputedStyle(placeholder.parentElement)
    if (parseInt(placeholderHeight, 10) <= 200 || parseInt(parentHeight, 10) <= 200) {
        const titleRowTextButton = shadowRoot.querySelector(`#${titleID + 'TextButton'}`)
        titleRowTextButton.style.display = 'block'
    }
}

/**
 * Replace the blocked CTP elements on the page with placeholders.
 * @param {Element} [targetElement]
 *   If specified, only this element will be replaced (assuming it matches
 *   one of the expected CSS selectors). If omitted, all matching elements
 *   in the document will be replaced instead.
 */
async function replaceClickToLoadElements (targetElement) {
    await ready

    for (const entity of Object.keys(config)) {
        for (const widgetData of Object.values(config[entity].elementData)) {
            const selector = widgetData.selectors.join()

            let trackingElements = []
            if (targetElement) {
                if (targetElement.matches(selector)) {
                    trackingElements.push(targetElement)
                }
            } else {
                trackingElements = Array.from(document.querySelectorAll(selector))
            }

            await Promise.all(trackingElements.map(trackingElement => {
                const widget = new DuckWidget(widgetData, trackingElement, entity)
                return createPlaceholderElementAndReplace(widget, trackingElement)
            }))
        }
    }
}

/*********************************************************
 *  Messaging to surrogates & extension
 *********************************************************/

/**
 * @typedef unblockClickToLoadContentRequest
 * @property {string} entity
 *   The entity to unblock requests for (e.g. "Facebook, Inc.").
 * @property {bool} [isLogin=false]
 *   True if we should "allow social login", defaults to false.
 * @property {string} action
 *   The Click to Load blocklist rule action (e.g. "block-ctl-fb") that should
 *   be allowed. Important since in the future there might be multiple types of
 *   embedded content from the same entity that the user can allow
 *   independently.
 */

/**
 * Send a message to the background to unblock requests for the given entity for
 * the page.
 * @param {unblockClickToLoadContentRequest} message
 * @see {@event ddg-ctp-unblockClickToLoadContent-complete} for the response handler.
 */
function unblockClickToLoadContent (message) {
    sendMessage('unblockClickToLoadContent', message)
}

function runLogin (entity) {
    const action = entity === 'Youtube' ? 'block-ctl-yt' : 'block-ctl-fb'
    unblockClickToLoadContent({ entity, action, isLogin: true })
    originalWindowDispatchEvent(
        createCustomEvent('ddg-ctp-run-login', {
            detail: {
                entity
            }
        })
    )
}

function cancelModal (entity) {
    originalWindowDispatchEvent(
        createCustomEvent('ddg-ctp-cancel-modal', {
            detail: {
                entity
            }
        })
    )
}

function openShareFeedbackPage () {
    sendMessage('openShareFeedbackPage', '')
}

function getYouTubeVideoDetails (videoURL) {
    sendMessage('getYouTubeVideoDetails', videoURL)
}

/*********************************************************
 *  Widget building blocks
 *********************************************************/
function getLearnMoreLink (mode) {
    if (!mode) {
        mode = 'lightMode'
    }

    const linkElement = document.createElement('a')
    linkElement.style.cssText = styles.generalLink + styles[mode].linkFont
    linkElement.ariaLabel = sharedStrings.readAbout
    linkElement.href = 'https://help.duckduckgo.com/duckduckgo-help-pages/privacy/embedded-content-protection/'
    linkElement.target = '_blank'
    linkElement.textContent = sharedStrings.learnMore
    return linkElement
}

/**
 * Reads and stores a set of styles from the original tracking element, and then returns it.
 * @param {Element} originalElement Original tracking element (ie iframe)
 * @param {DuckWidget} widget The widget Object.
 * @returns {{[key: string]: string[]}} Object with styles read from original element.
 */
function getOriginalElementStyle (originalElement, widget) {
    if (widget.originalElementStyle) {
        return widget.originalElementStyle
    }

    const stylesToCopy = ['display', 'visibility', 'position', 'top', 'bottom', 'left', 'right',
        'transform', 'margin']
    widget.originalElementStyle = {}
    const allOriginalElementStyles = getComputedStyle(originalElement)
    for (const key of stylesToCopy) {
        widget.originalElementStyle[key] = {
            value: allOriginalElementStyles[key],
            priority: originalElement.style.getPropertyPriority(key)
        }
    }

    // Copy current size of the element
    const { height: heightViewValue, width: widthViewValue } = originalElement.getBoundingClientRect()
    widget.originalElementStyle.height = { value: `${heightViewValue}px`, priority: '' }
    widget.originalElementStyle.width = { value: `${widthViewValue}px`, priority: '' }

    return widget.originalElementStyle
}

/**
 * Copy list of styles to provided element
 * @param {{[key: string]: string[]}} originalStyles Object with styles read from original element.
 * @param {Element} element Node element to have the styles copied to
 */
function copyStylesTo (originalStyles, element) {
    const { display, visibility, ...filteredStyles } = originalStyles
    const cssText = Object.keys(filteredStyles).reduce((cssAcc, key) => (cssAcc + `${key}: ${filteredStyles[key].value};`), '')
    element.style.cssText += cssText
}

/**
 * Create a `<style/>` element with DDG font-face styles/CSS
 * to be attached to DDG wrapper elements
 * @returns HTMLStyleElement
 */
function makeFontFaceStyleElement () {
    // Put our custom font-faces inside the wrapper element, since
    // @font-face does not work inside a shadowRoot.
    // See https://github.com/mdn/interactive-examples/issues/887.
    const fontFaceStyleElement = document.createElement('style')
    fontFaceStyleElement.textContent = styles.fontStyle
    return fontFaceStyleElement
}

/**
 * Create a `<style/>` element with base styles for DDG social container and
 * button to be attached to DDG wrapper elements/shadowRoot, also returns a wrapper
 * class name for Social Container link styles
 * @param {"lightMode" | "darkMode"} mode Light or Dark mode value
 * @returns {{wrapperClass: string, styleElement: HTMLStyleElement; }}
 */
function makeBaseStyleElement (mode = 'lightMode') {
    // Style element includes our font & overwrites page styles
    const styleElement = document.createElement('style')
    const wrapperClass = 'DuckDuckGoSocialContainer'
    styleElement.textContent = `
        .${wrapperClass} a {
            ${styles[mode].linkFont}
            font-weight: bold;
        }
        .${wrapperClass} a:hover {
            ${styles[mode].linkFont}
            font-weight: bold;
        }
        .DuckDuckGoButton {
            ${styles.button}
        }
        .DuckDuckGoButton > div {
            ${styles.buttonTextContainer}
        }
        .DuckDuckGoButton.primary {
           ${styles[mode].buttonBackground}
        }
        .DuckDuckGoButton.primary > div {
           ${styles[mode].buttonFont}
        }
        .DuckDuckGoButton.primary:hover {
           ${styles[mode].buttonBackgroundHover}
        }
        .DuckDuckGoButton.primary:active {
           ${styles[mode].buttonBackgroundPress}
        }
        .DuckDuckGoButton.secondary {
           ${styles.cancelMode.buttonBackground}
        }
        .DuckDuckGoButton.secondary > div {
            ${styles.cancelMode.buttonFont}
         }
        .DuckDuckGoButton.secondary:hover {
           ${styles.cancelMode.buttonBackgroundHover}
        }
        .DuckDuckGoButton.secondary:active {
           ${styles.cancelMode.buttonBackgroundPress}
        }
    `
    return { wrapperClass, styleElement }
}

function makeTextButton (linkText, mode) {
    const linkElement = document.createElement('a')
    linkElement.style.cssText = styles.headerLink + styles[mode].linkFont
    linkElement.textContent = linkText
    return linkElement
}

/**
 * Create a button element.
 * @param {string} buttonText Text to be displayed inside the button
 * @param {'lightMode' | 'darkMode' | 'cancelMode'} mode Key for theme value to determine the styling of the button. Key matches `styles[mode]` keys.
 * - `'lightMode'`: Primary colors styling for light theme
 * - `'darkMode'`: Primary colors styling for dark theme
 * - `'cancelMode'`: Secondary colors styling for all themes
 * @returns {HTMLButtonElement} Button element
 */
function makeButton (buttonText, mode = 'lightMode') {
    const button = document.createElement('button')
    button.classList.add('DuckDuckGoButton')
    button.classList.add(mode === 'cancelMode' ? 'secondary' : 'primary')
    if (buttonText) {
        const textContainer = document.createElement('div')
        textContainer.textContent = buttonText
        button.appendChild(textContainer)
    }
    return button
}

function makeToggleButton (isActive = false, classNames = '', dataKey = '') {
    const toggleButton = document.createElement('button')
    toggleButton.className = classNames
    toggleButton.style.cssText = styles.toggleButton
    toggleButton.type = 'button'
    toggleButton.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    toggleButton.setAttribute('data-key', dataKey)

    const toggleBg = document.createElement('div')
    toggleBg.style.cssText = styles.toggleButtonBg + (isActive ? styles.toggleButtonBgState.active : styles.toggleButtonBgState.inactive)

    const toggleKnob = document.createElement('div')
    toggleKnob.style.cssText = styles.toggleButtonKnob + (isActive ? styles.toggleButtonKnobState.active : styles.toggleButtonKnobState.inactive)

    toggleButton.appendChild(toggleBg)
    toggleButton.appendChild(toggleKnob)

    return toggleButton
}

function makeToggleButtonWithText (text, mode, isActive = false, toggleCssStyles = '', textCssStyles = '', dataKey = '') {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = styles.toggleButtonWrapper

    const toggleButton = makeToggleButton(isActive, toggleCssStyles, dataKey)

    const textDiv = document.createElement('div')
    textDiv.style.cssText = styles.contentText + styles.toggleButtonText + styles[mode].toggleButtonText + textCssStyles
    textDiv.textContent = text

    wrapper.appendChild(toggleButton)
    wrapper.appendChild(textDiv)
    return wrapper
}

/* If there isn't an image available, just make a default block symbol */
function makeDefaultBlockIcon () {
    const blockedIcon = document.createElement('div')
    const dash = document.createElement('div')
    blockedIcon.appendChild(dash)
    blockedIcon.style.cssText = styles.circle
    dash.style.cssText = styles.rectangle
    return blockedIcon
}

function makeShareFeedbackLink () {
    const feedbackLink = document.createElement('a')
    feedbackLink.style.cssText = styles.feedbackLink
    feedbackLink.target = '_blank'
    feedbackLink.href = '#'
    feedbackLink.text = 'Share Feedback'
    // Open Feedback Form page through background event to avoid browser blocking extension link
    feedbackLink.addEventListener('click', function (e) {
        e.preventDefault()
        openShareFeedbackPage()
    })

    return feedbackLink
}

function makeShareFeedbackRow () {
    const feedbackRow = document.createElement('div')
    feedbackRow.style.cssText = styles.feedbackRow

    const feedbackLink = makeShareFeedbackLink()
    feedbackRow.appendChild(feedbackLink)

    return feedbackRow
}

/* FB login replacement button, with hover text */
function makeLoginButton (buttonText, mode, hoverTextBody, icon, originalElement) {
    const container = document.createElement('div')
    container.style.cssText = 'position: relative;'
    container.appendChild(makeFontFaceStyleElement())

    const shadowRoot = container.attachShadow({ mode: devMode ? 'open' : 'closed' })
    // inherit any class styles on the button
    container.className = 'fb-login-button FacebookLogin__button'
    const { styleElement } = makeBaseStyleElement(mode)
    styleElement.textContent += `
        #DuckDuckGoPrivacyEssentialsHoverableText {
            display: none;
        }
        #DuckDuckGoPrivacyEssentialsHoverable:hover #DuckDuckGoPrivacyEssentialsHoverableText {
            display: block;
        }
    `
    shadowRoot.appendChild(styleElement)

    const hoverContainer = document.createElement('div')
    hoverContainer.id = 'DuckDuckGoPrivacyEssentialsHoverable'
    hoverContainer.style.cssText = styles.hoverContainer
    shadowRoot.appendChild(hoverContainer)

    // Make the button
    const button = makeButton(buttonText, mode)
    // Add blocked icon
    if (!icon) {
        button.appendChild(makeDefaultBlockIcon())
    } else {
        const imgElement = document.createElement('img')
        imgElement.style.cssText = styles.loginIcon
        imgElement.setAttribute('src', icon)
        imgElement.setAttribute('height', '28px')
        button.appendChild(imgElement)
    }
    hoverContainer.appendChild(button)

    // hover action
    const hoverBox = document.createElement('div')
    hoverBox.id = 'DuckDuckGoPrivacyEssentialsHoverableText'
    hoverBox.style.cssText = styles.textBubble
    const arrow = document.createElement('div')
    arrow.style.cssText = styles.textArrow
    hoverBox.appendChild(arrow)
    const branding = createTitleRow('DuckDuckGo')
    branding.style.cssText += styles.hoverTextTitle
    hoverBox.appendChild(branding)
    const hoverText = document.createElement('div')
    hoverText.style.cssText = styles.hoverTextBody
    hoverText.textContent = hoverTextBody + ' '
    hoverText.appendChild(getLearnMoreLink(mode))
    hoverBox.appendChild(hoverText)

    hoverContainer.appendChild(hoverBox)
    const rect = originalElement.getBoundingClientRect()
    /*
    * The left side of the hover popup may go offscreen if the
    * login button is all the way on the left side of the page. This
    * If that is the case, dynamically shift the box right so it shows
    * properly.
    */
    if (rect.left < styles.textBubbleLeftShift) {
        const leftShift = -rect.left + 10 // 10px away from edge of the screen
        hoverBox.style.cssText += `left: ${leftShift}px;`
        const change = (1 - (rect.left / styles.textBubbleLeftShift)) * (100 - styles.arrowDefaultLocationPercent)
        arrow.style.cssText += `left: ${Math.max(10, styles.arrowDefaultLocationPercent - change)}%;`
    } else if (rect.left + styles.textBubbleWidth - styles.textBubbleLeftShift > window.innerWidth) {
        const rightShift = rect.left + styles.textBubbleWidth - styles.textBubbleLeftShift
        const diff = Math.min(rightShift - window.innerWidth, styles.textBubbleLeftShift)
        const rightMargin = 20 // Add some margin to the page, so scrollbar doesn't overlap.
        hoverBox.style.cssText += `left: -${styles.textBubbleLeftShift + diff + rightMargin}px;`
        const change = ((diff / styles.textBubbleLeftShift)) * (100 - styles.arrowDefaultLocationPercent)
        arrow.style.cssText += `left: ${Math.max(10, styles.arrowDefaultLocationPercent + change)}%;`
    } else {
        hoverBox.style.cssText += `left: -${styles.textBubbleLeftShift}px;`
        arrow.style.cssText += `left: ${styles.arrowDefaultLocationPercent}%;`
    }

    return {
        button,
        container
    }
}

async function makeModal (entity, acceptFunction, ...acceptFunctionParams) {
    const icon = entityData[entity].modalIcon

    const modalContainer = document.createElement('div')
    modalContainer.setAttribute('data-key', 'modal')
    modalContainer.style.cssText = styles.modalContainer

    modalContainer.appendChild(makeFontFaceStyleElement())

    const closeModal = () => {
        document.body.removeChild(modalContainer)
        cancelModal(entity)
    }

    // Protect the contents of our modal inside a shadowRoot, to avoid
    // it being styled by the website's stylesheets.
    const shadowRoot = modalContainer.attachShadow({ mode: devMode ? 'open' : 'closed' })
    const { styleElement } = makeBaseStyleElement('lightMode')
    shadowRoot.appendChild(styleElement)

    const pageOverlay = document.createElement('div')
    pageOverlay.style.cssText = styles.overlay

    const modal = document.createElement('div')
    modal.style.cssText = styles.modal

    // Title
    const modalTitle = createTitleRow('DuckDuckGo', null, closeModal)
    modal.appendChild(modalTitle)

    const iconElement = document.createElement('img')
    iconElement.style.cssText = styles.icon + styles.modalIcon
    iconElement.setAttribute('src', icon)
    iconElement.setAttribute('height', '70px')

    const title = document.createElement('div')
    title.style.cssText = styles.modalContentTitle
    title.textContent = entityData[entity].modalTitle

    // Content
    const modalContent = document.createElement('div')
    modalContent.style.cssText = styles.modalContent

    const message = document.createElement('div')
    message.style.cssText = styles.modalContentText
    message.textContent = entityData[entity].modalText + ' '
    message.appendChild(getLearnMoreLink())

    modalContent.appendChild(iconElement)
    modalContent.appendChild(title)
    modalContent.appendChild(message)

    // Buttons
    const buttonRow = document.createElement('div')
    buttonRow.style.cssText = styles.modalButtonRow
    const allowButton = makeButton(entityData[entity].modalAcceptText, 'lightMode')
    allowButton.style.cssText += styles.modalButton + 'margin-bottom: 8px;'
    allowButton.setAttribute('data-key', 'allow')
    allowButton.addEventListener('click', function doLogin () {
        acceptFunction(...acceptFunctionParams)
        document.body.removeChild(modalContainer)
    })
    const rejectButton = makeButton(entityData[entity].modalRejectText, 'cancelMode')
    rejectButton.setAttribute('data-key', 'reject')
    rejectButton.style.cssText += styles.modalButton
    rejectButton.addEventListener('click', closeModal)

    buttonRow.appendChild(allowButton)
    buttonRow.appendChild(rejectButton)
    modalContent.appendChild(buttonRow)

    modal.appendChild(modalContent)

    shadowRoot.appendChild(pageOverlay)
    shadowRoot.appendChild(modal)

    document.body.insertBefore(modalContainer, document.body.childNodes[0])
}

function createTitleRow (message, textButton, closeBtnFn) {
    // Create row container
    const row = document.createElement('div')
    row.style.cssText = styles.titleBox

    // Logo
    const logoContainer = document.createElement('div')
    logoContainer.style.cssText = styles.logo
    const logoElement = document.createElement('img')
    logoElement.setAttribute('src', logoImg)
    logoElement.setAttribute('height', '21px')
    logoElement.style.cssText = styles.logoImg
    logoContainer.appendChild(logoElement)
    row.appendChild(logoContainer)

    // Content box title
    const msgElement = document.createElement('div')
    msgElement.id = titleID // Ensure we can find this to potentially hide it later.
    msgElement.textContent = message
    msgElement.style.cssText = styles.title
    row.appendChild(msgElement)

    // Close Button
    if (typeof closeBtnFn === 'function') {
        const closeButton = document.createElement('button')
        closeButton.style.cssText = styles.closeButton
        const closeIconImg = document.createElement('img')
        closeIconImg.setAttribute('src', closeIcon)
        closeIconImg.setAttribute('height', '12px')
        closeIconImg.style.cssText = styles.closeIcon
        closeButton.appendChild(closeIconImg)
        closeButton.addEventListener('click', closeBtnFn)
        row.appendChild(closeButton)
    }

    // Text button for very small boxes
    if (textButton) {
        textButton.id = titleID + 'TextButton'
        row.appendChild(textButton)
    }

    return row
}

// Create the content block to replace other divs/iframes with
async function createContentBlock (widget, button, textButton, img, bottomRow) {
    const contentBlock = document.createElement('div')
    contentBlock.style.cssText = styles.wrapperDiv

    contentBlock.appendChild(makeFontFaceStyleElement())

    // Put everything else inside the shadowRoot of the wrapper element to
    // reduce the chances of the website's stylesheets messing up the
    // placeholder's appearance.
    const shadowRootMode = devMode ? 'open' : 'closed'
    const shadowRoot = contentBlock.attachShadow({ mode: shadowRootMode })

    // Style element includes our font & overwrites page styles
    const { wrapperClass, styleElement } = makeBaseStyleElement(widget.getMode())
    shadowRoot.appendChild(styleElement)

    // Create overall grid structure
    const element = document.createElement('div')
    element.style.cssText = styles.block + styles[widget.getMode()].background + styles[widget.getMode()].textFont
    if (widget.replaceSettings.type === 'youtube-video') {
        element.style.cssText += styles.youTubeDialogBlock
    }
    element.className = wrapperClass
    shadowRoot.appendChild(element)

    // grid of three rows
    const titleRow = document.createElement('div')
    titleRow.style.cssText = styles.headerRow
    element.appendChild(titleRow)
    titleRow.appendChild(createTitleRow('DuckDuckGo', textButton))

    const contentRow = document.createElement('div')
    contentRow.style.cssText = styles.content

    if (img) {
        const imageRow = document.createElement('div')
        imageRow.style.cssText = styles.imgRow
        const imgElement = document.createElement('img')
        imgElement.style.cssText = styles.icon
        imgElement.setAttribute('src', img)
        imgElement.setAttribute('height', '70px')
        imageRow.appendChild(imgElement)
        element.appendChild(imageRow)
    }

    const contentTitle = document.createElement('div')
    contentTitle.style.cssText = styles.contentTitle
    contentTitle.textContent = widget.replaceSettings.infoTitle
    contentRow.appendChild(contentTitle)
    const contentText = document.createElement('div')
    contentText.style.cssText = styles.contentText
    contentText.textContent = widget.replaceSettings.infoText + ' '
    contentText.appendChild(getLearnMoreLink())
    contentRow.appendChild(contentText)
    element.appendChild(contentRow)

    const buttonRow = document.createElement('div')
    buttonRow.style.cssText = styles.buttonRow
    buttonRow.appendChild(button)
    contentText.appendChild(buttonRow)

    if (bottomRow) {
        contentRow.appendChild(bottomRow)
    }

    /** Share Feedback Link */
    if (widget.replaceSettings.type === 'youtube-video') {
        const feedbackRow = makeShareFeedbackRow()
        shadowRoot.appendChild(feedbackRow)
    }

    return { contentBlock, shadowRoot }
}

// Create the content block to replace embedded youtube videos/iframes with
async function createYouTubeBlockingDialog (trackingElement, widget) {
    const button = makeButton(widget.replaceSettings.buttonText, widget.getMode())
    const textButton = makeTextButton(widget.replaceSettings.buttonText, widget.getMode())

    const bottomRow = document.createElement('div')
    bottomRow.style.cssText = styles.youTubeDialogBottomRow
    const previewToggle = makeToggleButtonWithText(
        widget.replaceSettings.previewToggleText,
        widget.getMode(),
        false,
        '',
        '',
        'yt-preview-toggle'
    )
    previewToggle.addEventListener(
        'click',
        () => makeModal(widget.entity, () => sendMessage('setYoutubePreviewsEnabled', true), widget.entity)
    )
    bottomRow.appendChild(previewToggle)

    const { contentBlock, shadowRoot } = await createContentBlock(
        widget, button, textButton, null, bottomRow
    )
    contentBlock.id = `yt-ctl-dialog-${widget.widgetID}`
    contentBlock.style.cssText += styles.wrapperDiv + styles.youTubeWrapperDiv

    button.addEventListener('click', widget.clickFunction(trackingElement, contentBlock))
    textButton.addEventListener('click', widget.clickFunction(trackingElement, contentBlock))

    // Size the placeholder element to match the original video element styles.
    // If no styles are in place, it will get its current size
    const originalStyles = getOriginalElementStyle(trackingElement, widget)
    copyStylesTo(originalStyles, contentBlock)

    return {
        blockingDialog: contentBlock,
        shadowRoot
    }
}

/**
 * Creates the placeholder element to replace a YouTube video iframe element
 * with a preview image. Mutates widget Object to set the autoplay property
 * as the preview details load.
 * @param {Element} originalElement
 *   The YouTube video iframe element.
 * @param {DuckWidget} widget
 *   The widget Object. We mutate this to set the autoplay property.
 * @returns {{ youTubePreview: Element, shadowRoot: Element }}
 *   Object containing the YouTube Preview element and its shadowRoot.
 */
async function createYouTubePreview (originalElement, widget) {
    const youTubePreview = document.createElement('div')
    youTubePreview.id = `yt-ctl-preview-${widget.widgetID}`
    youTubePreview.style.cssText = styles.wrapperDiv + styles.placeholderWrapperDiv

    youTubePreview.appendChild(makeFontFaceStyleElement())

    // Size the placeholder element to match the original video element styles.
    // If no styles are in place, it will get its current size
    const originalStyles = getOriginalElementStyle(originalElement, widget)
    copyStylesTo(originalStyles, youTubePreview)

    // Protect the contents of our placeholder inside a shadowRoot, to avoid
    // it being styled by the website's stylesheets.
    const shadowRoot = youTubePreview.attachShadow({ mode: devMode ? 'open' : 'closed' })
    const { wrapperClass, styleElement } = makeBaseStyleElement(widget.getMode())
    shadowRoot.appendChild(styleElement)

    const youTubePreviewDiv = document.createElement('div')
    youTubePreviewDiv.style.cssText = styles.youTubeDialogDiv
    youTubePreviewDiv.classList.add(wrapperClass)
    shadowRoot.appendChild(youTubePreviewDiv)

    /** Preview Image */
    const previewImageWrapper = document.createElement('div')
    previewImageWrapper.style.cssText = styles.youTubePreviewWrapperImg
    youTubePreviewDiv.appendChild(previewImageWrapper)
    // We use an image element for the preview image so that we can ensure
    // the referrer isn't passed.
    const previewImageElement = document.createElement('img')
    previewImageElement.setAttribute('referrerPolicy', 'no-referrer')
    previewImageElement.style.cssText = styles.youTubePreviewImg
    previewImageWrapper.appendChild(previewImageElement)

    const innerDiv = document.createElement('div')
    innerDiv.style.cssText = styles.youTubePlaceholder

    /** Top section */
    const topSection = document.createElement('div')
    topSection.style.cssText = styles.youTubeTopSection
    innerDiv.appendChild(topSection)

    /** Video Title */
    const titleElement = document.createElement('p')
    titleElement.style.cssText = styles.youTubeTitle
    topSection.appendChild(titleElement)

    /** Text Button on top section */
    // Use darkMode styles because the preview background is dark and causes poor contrast
    // with lightMode button, making it hard to read.
    const textButton = makeTextButton(widget.replaceSettings.buttonText, 'darkMode')
    textButton.id = titleID + 'TextButton'

    textButton.addEventListener(
        'click',
        widget.clickFunction(originalElement, youTubePreview)
    )
    topSection.appendChild(textButton)

    /** Play Button */
    const playButtonRow = document.createElement('div')
    playButtonRow.style.cssText = styles.youTubePlayButtonRow

    const playButton = makeButton('', widget.getMode())
    playButton.style.cssText += styles.youTubePlayButton

    const videoPlayImg = document.createElement('img')
    const videoPlayIcon = widget.replaceSettings.placeholder.videoPlayIcon[widget.getMode()]
    videoPlayImg.setAttribute('src', videoPlayIcon)
    playButton.appendChild(videoPlayImg)

    playButton.addEventListener(
        'click',
        widget.clickFunction(originalElement, youTubePreview)
    )
    playButtonRow.appendChild(playButton)
    innerDiv.appendChild(playButtonRow)

    /** Preview Toggle */
    const previewToggleRow = document.createElement('div')
    previewToggleRow.style.cssText = styles.youTubePreviewToggleRow

    const previewToggle = makeToggleButtonWithText(
        widget.replaceSettings.placeholder.previewToggleEnabledText,
        widget.getMode(),
        true,
        '',
        styles.youTubePreviewToggleText,
        'yt-preview-toggle'
    )
    previewToggle.addEventListener(
        'click',
        () => sendMessage('setYoutubePreviewsEnabled', false)
    )

    /** Preview Info Text */
    const previewText = document.createElement('div')
    previewText.style.cssText = styles.contentText + styles.toggleButtonText + styles.youTubePreviewInfoText
    previewText.innerText = widget.replaceSettings.placeholder.previewInfoText + ' '
    // Use darkMode styles because of preview background
    previewText.appendChild(getLearnMoreLink('darkMode'))

    previewToggleRow.appendChild(previewToggle)
    previewToggleRow.appendChild(previewText)
    innerDiv.appendChild(previewToggleRow)

    youTubePreviewDiv.appendChild(innerDiv)

    widget.autoplay = false
    // We use .then() instead of await here to show the placeholder right away
    // while the YouTube endpoint takes it time to respond.
    const videoURL = originalElement.src || originalElement.getAttribute('data-src')
    getYouTubeVideoDetails(videoURL)
    window.addEventListener('ddg-ctp-youTubeVideoDetails',
        ({ detail: { videoURL: videoURLResp, status, title, previewImage } }) => {
            if (videoURLResp !== videoURL) { return }
            if (status === 'success') {
                titleElement.innerText = title
                titleElement.title = title
                if (previewImage) {
                    previewImageElement.setAttribute('src', previewImage)
                }
                widget.autoplay = true
            }
        }
    )

    /** Share Feedback Link */
    const feedbackRow = makeShareFeedbackRow()
    shadowRoot.appendChild(feedbackRow)

    return { youTubePreview, shadowRoot }
}

// Convention is that each function should be named the same as the sendMessage
// method we are calling into eg. calling `sendMessage('getClickToLoadState')`
// will result in a response routed to `updateHandlers.getClickToLoadState()`.
const messageResponseHandlers = {
    getClickToLoadState (response) {
        devMode = response.devMode
        isYoutubePreviewsEnabled = response.youtubePreviewsEnabled

        // TODO: Move the below init logic to the exported init() function,
        //       somehow waiting for this response handler to have been called
        //       first.

        // Start Click to Load
        window.addEventListener('ddg-ctp-replace-element', ({ target }) => {
            replaceClickToLoadElements(target)
        }, { capture: true })

        // Inform surrogate scripts that CTP is ready
        originalWindowDispatchEvent(createCustomEvent('ddg-ctp-ready'))

        // Mark the feature as ready, to allow placeholder replacements.
        readyResolver()
    },
    setYoutubePreviewsEnabled: function (resp) {
        if (resp?.messageType && typeof resp?.value === 'boolean') {
            originalWindowDispatchEvent(new OriginalCustomEvent(resp.messageType, { detail: resp.value }))
        }
    },
    getYouTubeVideoDetails: function (resp) {
        if (resp?.status && typeof resp.videoURL === 'string') {
            originalWindowDispatchEvent(new OriginalCustomEvent('ddg-ctp-youTubeVideoDetails', { detail: resp }))
        }
    },
    unblockClickToLoadContent () {
        originalWindowDispatchEvent(new OriginalCustomEvent('ddg-ctp-unblockClickToLoadContent-complete'))
    }
}

const knownMessageResponseType = Object.prototype.hasOwnProperty.bind(messageResponseHandlers)

export function init (args) {
    const websiteOwner = args?.site?.parentEntity
    const settings = args?.featureSettings?.clickToLoad || {}
    const locale = args?.locale || 'en'
    const localizedConfig = getConfig(locale)
    config = localizedConfig.config
    sharedStrings = localizedConfig.sharedStrings

    for (const entity of Object.keys(config)) {
        // Strip config entities that are first-party, or aren't enabled in the
        // extension's clickToLoad settings.
        if ((websiteOwner && entity === websiteOwner) ||
            !settings[entity] ||
            settings[entity].state !== 'enabled') {
            delete config[entity]
            continue
        }

        // Populate the entities and entityData data structures.
        // TODO: Remove them and this logic, they seem unnecessary.

        entities.push(entity)

        const shouldShowLoginModal = !!config[entity].informationalModal
        const currentEntityData = { shouldShowLoginModal }

        if (shouldShowLoginModal) {
            const { informationalModal } = config[entity]
            currentEntityData.modalIcon = informationalModal.icon
            currentEntityData.modalTitle = informationalModal.messageTitle
            currentEntityData.modalText = informationalModal.messageBody
            currentEntityData.modalAcceptText = informationalModal.confirmButtonText
            currentEntityData.modalRejectText = informationalModal.rejectButtonText
        }

        entityData[entity] = currentEntityData
    }

    // Listen for events from "surrogate" scripts.
    addEventListener('ddg-ctp', (event) => {
        if (!event.detail) return
        const entity = event.detail.entity
        if (!entities.includes(entity)) {
            // Unknown entity, reject
            return
        }
        if (event.detail.appID) {
            appID = JSON.stringify(event.detail.appID).replace(/"/g, '')
        }
        // Handle login call
        if (event.detail.action === 'login') {
            if (entityData[entity].shouldShowLoginModal) {
                makeModal(entity, runLogin, entity)
            } else {
                runLogin(entity)
            }
        }
    })

    // Request the current state of Click to Load from the platform.
    // Note: When the response is received, the response handler finishes
    //       starting up the feature.
    sendMessage('getClickToLoadState')
}

export function update (message) {
    // TODO: Once all Click to Load messages include the feature property, drop
    //       messages that don't include the feature property too.
    if (message?.feature && message?.feature !== 'clickToLoad') return

    const messageType = message?.messageType
    if (!messageType) return

    // Message responses.
    if (messageType === 'response') {
        const messageResponseType = message?.responseMessageType
        if (messageResponseType && knownMessageResponseType(messageResponseType)) {
            return messageResponseHandlers[messageResponseType](message.response)
        }
    }

    // Other known update messages.
    if (messageType === 'displayClickToLoadPlaceholders') {
        // TODO: Pass `message.options.ruleAction` through, that way only
        //       content corresponding to the entity for that ruleAction need to
        //       be replaced with a placeholder.
        return replaceClickToLoadElements()
    }
}
