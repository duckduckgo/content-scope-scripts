import ContentFeature from '../content-feature';
import { isBeingFramed, withExponentialBackoff } from '../utils';
import { click } from './broker-protection/actions/click';

export const ANIMATION_DURATION_MS = 1000;
export const ANIMATION_ITERATIONS = Infinity;
export const BACKGROUND_COLOR_START = 'rgba(85, 127, 243, 0.10)';
export const BACKGROUND_COLOR_END = 'rgba(85, 127, 243, 0.25)';
export const OVERLAY_ID = 'ddg-password-import-overlay';
export const DELAY_BEFORE_ANIMATION = 300;
const BOOKMARK_IMPORT_DOMAIN = 'takeout.google.com';
const TAKEOUT_DOWNLOAD_URL_BASE = '/takeout/download';

/**
 * @typedef ButtonAnimationStyle
 * @property {Record<string, string>} transform
 * @property {string} zIndex
 * @property {string} borderRadius
 * @property {number} offsetLeftEm
 * @property {number} offsetTopEm
 */

/**
 * @typedef ElementConfig
 * @property {HTMLElement|Element|SVGElement} element
 * @property {ButtonAnimationStyle} animationStyle
 * @property {boolean} shouldTap
 * @property {boolean} shouldWatchForRemoval
 * @property {boolean} tapOnce
 */

/**
 * This feature is responsible for animating some buttons passwords.google.com,
 * during a password import flow. The overall approach is:
 * 1. Check if the path is supported,
 * 2. Find the element to animate based on the path - using structural selectors first and then fallback to label texts),
 * 3. Animate the element, or tap it if it should be autotapped.
 */
export default class AutofillPasswordImport extends ContentFeature {
    #exportButtonSettings;

    #settingsButtonSettings;

    #signInButtonSettings;

    /** @type {HTMLElement|Element|SVGElement|null} */
    #elementToCenterOn;

    /** @type {HTMLElement|null} */
    #currentOverlay;

    /** @type {ElementConfig|null} */
    #currentElementConfig;

    #domLoaded;

    #exportId;

    #processingBookmark;

    #isBookmarkModalVisible = false;
    #isBookmarkProcessed = false;

    /** @type {WeakSet<Element>} */
    #tappedElements = new WeakSet();

    /**
     * @returns {ButtonAnimationStyle}
     */
    get settingsButtonAnimationStyle() {
        return {
            transform: {
                start: 'scale(0.90)',
                mid: 'scale(0.96)',
            },
            zIndex: '984',
            borderRadius: '100%',
            offsetLeftEm: 0.01,
            offsetTopEm: 0,
        };
    }

    /**
     * @returns {ButtonAnimationStyle}
     */
    get exportButtonAnimationStyle() {
        return {
            transform: {
                start: 'scale(1)',
                mid: 'scale(1.01)',
            },
            zIndex: '984',
            borderRadius: '100%',
            offsetLeftEm: 0,
            offsetTopEm: 0,
        };
    }

    /**
     * @returns {ButtonAnimationStyle}
     */
    get signInButtonAnimationStyle() {
        return {
            transform: {
                start: 'scale(1)',
                mid: 'scale(1.3, 1.5)',
            },
            zIndex: '999',
            borderRadius: '2px',
            offsetLeftEm: 0,
            offsetTopEm: -0.05,
        };
    }

    /**
     * @param {HTMLElement|null} overlay
     */
    set currentOverlay(overlay) {
        this.#currentOverlay = overlay;
    }

    /**
     * @returns {HTMLElement|null}
     */
    get currentOverlay() {
        return this.#currentOverlay ?? null;
    }

    /**
     * @returns {ElementConfig|null}
     */
    get currentElementConfig() {
        return this.#currentElementConfig;
    }

    /**
     * @returns {Promise<void>}
     */
    get domLoaded() {
        return this.#domLoaded;
    }

    async runWithRetry(fn, maxAttempts = 4, delay = 500) {
        try {
            return await withExponentialBackoff(fn, maxAttempts, delay);
        } catch (error) {
            return null;
        }
    }

    /**
     * Wait for an element's attribute to change using mutation observer
     * @param {string} selector - CSS selector for the element
     * @param {string} attribute - Attribute to watch
     * @param {Function} condition - Function that returns true when condition is met
     * @returns {Promise<void>}
     */
    async waitForAttributeChange(selector, attribute, condition) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (!element) {
                reject(new Error(`Element with selector "${selector}" not found`));
                return;
            }

            // Check if condition is already met
            if (condition(element)) {
                resolve();
                return;
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === attribute) {
                        if (condition(element)) {
                            observer.disconnect();
                            resolve();
                        }
                    }
                });
            });

            observer.observe(element, {
                attributes: true,
                attributeFilter: [attribute]
            });

            // Fallback timeout after 10 seconds
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for attribute "${attribute}" to change`));
            }, 10000);
        });
    }

    /**
     * Takes a path and returns the element and style to animate.
     * @param {string} path
     * @returns {Promise<ElementConfig | null>}
     */
    async getElementAndStyleFromPath(path) {
        if (path === '/') {
            const element = await this.findSettingsElement();
            return element != null
                ? {
                      animationStyle: this.settingsButtonAnimationStyle,
                      element,
                      shouldTap: this.#settingsButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: false,
                      tapOnce: false,
                  }
                : null;
        } else if (path === '/options') {
            const element = await this.findExportElement();
            return element != null
                ? {
                      animationStyle: this.exportButtonAnimationStyle,
                      element,
                      shouldTap: this.#exportButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: true,
                      tapOnce: true,
                  }
                : null;
        } else if (path === '/intro') {
            const element = await this.findSignInButton();
            return element != null
                ? {
                      animationStyle: this.signInButtonAnimationStyle,
                      element,
                      shouldTap: this.#signInButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: false,
                      tapOnce: false,
                  }
                : null;
        } else {
            return null;
        }
    }

    /**
     * Removes the overlay if it exists.
     */
    removeOverlayIfNeeded() {
        if (this.currentOverlay != null) {
            this.currentOverlay.style.display = 'none';
            this.currentOverlay.remove();
            this.currentOverlay = null;
            document.removeEventListener('scroll', this);
            if (this.currentElementConfig?.element) {
                this.#tappedElements.delete(this.currentElementConfig?.element);
            }
        }
    }

    /**
     * Updates the position of the overlay based on the element to center on.
     */
    updateOverlayPosition() {
        if (this.currentOverlay != null && this.currentElementConfig?.animationStyle != null && this.elementToCenterOn != null) {
            const animations = this.currentOverlay.getAnimations();
            animations.forEach((animation) => animation.pause());
            const { top, left, width, height } = this.elementToCenterOn.getBoundingClientRect();
            this.currentOverlay.style.position = 'absolute';

            const { animationStyle } = this.currentElementConfig;
            const isRound = animationStyle.borderRadius === '100%';

            const widthOffset = isRound ? width / 2 : 0;
            const heightOffset = isRound ? height / 2 : 0;

            this.currentOverlay.style.top = `calc(${top}px + ${window.scrollY}px - ${widthOffset}px - 1px - ${animationStyle.offsetTopEm}em)`;
            this.currentOverlay.style.left = `calc(${left}px + ${window.scrollX}px - ${heightOffset}px - 1px - ${animationStyle.offsetLeftEm}em)`;

            // Ensure overlay is non-interactive
            this.currentOverlay.style.pointerEvents = 'none';
            animations.forEach((animation) => animation.play());
        }
    }

    /**
     * Creates an overlay element to animate, by adding a div to the body
     * and styling it based on the found element.
     * @param {HTMLElement|Element} mainElement
     * @param {any} style
     */
    createOverlayElement(mainElement, style) {
        this.removeOverlayIfNeeded();

        const overlay = document.createElement('div');
        overlay.setAttribute('id', OVERLAY_ID);

        if (this.elementToCenterOn != null) {
            this.currentOverlay = overlay;
            this.updateOverlayPosition();
            const mainElementRect = mainElement.getBoundingClientRect();
            overlay.style.width = `${mainElementRect.width}px`;
            overlay.style.height = `${mainElementRect.height}px`;
            overlay.style.zIndex = style.zIndex;

            // Ensure overlay is non-interactive
            overlay.style.pointerEvents = 'none';

            // insert in document.body
            document.body.appendChild(overlay);

            document.addEventListener('scroll', this, { passive: true });
        } else {
            this.currentOverlay = null;
        }
    }

    /**
     * Observes the removal of an element from the DOM.
     * @param {HTMLElement|Element} element
     * @param {any} onRemoveCallback
     */
    observeElementRemoval(element, onRemoveCallback) {
        // Set up the mutation observer
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Check if the element has been removed from its parent
                if (mutation.type === 'childList' && !document.contains(element)) {
                    // Element has been removed
                    onRemoveCallback();
                    observer.disconnect(); // Stop observing
                }
            });
        });

        // Start observing the parent node for child list changes
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     *
     * @param {HTMLElement|Element|SVGElement} element
     * @param {ButtonAnimationStyle} style
     */
    setElementToCenterOn(element, style) {
        const svgElement = element.parentNode?.querySelector('svg') ?? element.querySelector('svg');
        this.#elementToCenterOn = style.borderRadius === '100%' && svgElement != null ? svgElement : element;
    }

    /**
     * @returns {HTMLElement|Element|SVGElement|null}
     */
    get elementToCenterOn() {
        return this.#elementToCenterOn;
    }

    /**
     * Moves the element into view and animates it.
     * @param {HTMLElement|Element} element
     * @param {ButtonAnimationStyle} style
     */
    animateElement(element, style) {
        this.createOverlayElement(element, style);
        if (this.currentOverlay != null) {
            this.currentOverlay.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            }); // Scroll into view
            const keyframes = [
                {
                    backgroundColor: BACKGROUND_COLOR_START,
                    offset: 0,
                    borderRadius: style.borderRadius,
                    border: `1px solid ${BACKGROUND_COLOR_START}`,
                    transform: style.transform.start,
                }, // Start: 10% blue
                {
                    backgroundColor: BACKGROUND_COLOR_END,
                    offset: 0.5,
                    borderRadius: style.borderRadius,
                    border: `1px solid ${BACKGROUND_COLOR_END}`,
                    transform: style.transform.mid,
                    transformOrigin: 'center',
                }, // Middle: 25% blue
                {
                    backgroundColor: BACKGROUND_COLOR_START,
                    offset: 1,
                    borderRadius: style.borderRadius,
                    border: `1px solid ${BACKGROUND_COLOR_START}`,
                    transform: style.transform.start,
                }, // End: 10% blue
            ];

            // Define the animation options
            const options = {
                duration: ANIMATION_DURATION_MS,
                iterations: ANIMATION_ITERATIONS,
            };

            // Apply the animation to the element
            this.currentOverlay.animate(keyframes, options);
        }
    }

    autotapElement(element) {
        element.click();
    }

    /**
     * On passwords.google.com the export button is in a container that is quite ambiguious.
     * To solve for that we first try to find the container and then the button inside it.
     * If that fails, we look for the button based on it's label.
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findExportElement() {
        const findInContainer = () => {
            const exportButtonContainer = document.querySelector(this.exportButtonContainerSelector);
            return exportButtonContainer && exportButtonContainer.querySelectorAll('button')[1];
        };

        const findWithLabel = () => {
            return document.querySelector(this.exportButtonLabelTextSelector);
        };

        return await withExponentialBackoff(() => findInContainer() ?? findWithLabel());
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSettingsElement() {
        const fn = () => {
            const settingsButton = document.querySelector(this.settingsButtonSelector);
            return settingsButton;
        };
        return await withExponentialBackoff(fn);
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSignInButton() {
        return await withExponentialBackoff(() => document.querySelector(this.signinButtonSelector));
    }

    /**
     * @param {Event} event
     */
    handleEvent(event) {
        if (event.type === 'scroll') {
            requestAnimationFrame(() => this.updateOverlayPosition());
        }
    }

    /**
     * @param {ElementConfig|null} config
     */
    setCurrentElementConfig(config) {
        if (config != null) {
            this.#currentElementConfig = config;
            this.setElementToCenterOn(config.element, config.animationStyle);
        }
    }

    /**
     * Checks if the path is supported for animation.
     * @param {string} path
     * @returns {boolean}
     */
    isSupportedPath(path) {
        return [this.#exportButtonSettings?.path, this.#settingsButtonSettings?.path, this.#signInButtonSettings?.path].includes(path);
    }

    async handlePasswordManagerPath(pathname) {
        console.log('DEEP DEBUG autofill-password-import: handlePasswordManagerPath', pathname);
        this.removeOverlayIfNeeded();
        if (this.isSupportedPath(pathname)) {
            try {
                this.setCurrentElementConfig(await this.getElementAndStyleFromPath(pathname));
                if (this.currentElementConfig?.element && !this.#tappedElements.has(this.currentElementConfig?.element)) {
                    await this.animateOrTapElement();
                    if (this.currentElementConfig?.shouldTap && this.currentElementConfig?.tapOnce) {
                        this.#tappedElements.add(this.currentElementConfig.element);
                    }
                }
            } catch {
                console.error('password-import: failed for path:', pathname);
            }
        }
    }

    async downloadData() {
        const userId = document.querySelector(this.userIdSelector)?.getAttribute('href')?.split('&user=')[1];
        console.log('DEEP DEBUG autofill-password-import: userId', userId);
        await this.runWithRetry(() => document.querySelector(`a[href="./manage/archive/${this.#exportId}"]`), 8);
        const downloadURL = `${TAKEOUT_DOWNLOAD_URL_BASE}?j=${this.#exportId}&i=0&user=${userId}`;
        window.location.href = downloadURL;
    }

    async handleBookmarkImportPath(pathname) {
        console.log('DEEP DEBUG autofill-password-import: handleBookmarkImportPath', pathname);
        if (pathname === '/' && !this.#isBookmarkModalVisible) {
            console.log('DEEP DEBUG autofill-password-import: handleBookmarkImportPath', this.disselectAllButtonSelector);
            click({
                id: 'disselect-all-click',
                actionType: 'click',
                elements: [{
                    type: 'element',
                    selector: this.disselectAllButtonSelector
                }]
            }, {}, /** @type HTMLElement */ (this.getRoot(this.tabPanelSelector)))
            await this.scrollToChromeSection();
            await this.openBookmarkModal();
            await this.selectBookmark();
            await this.startExportProcess();
            await this.storeExportId();
            click({
                id: 'manage-button-click',
                actionType: 'click',
                elements: [{
                    type: 'element',
                    selector: this.manageButtonSelector
                }]
            }, {}, document)
            await this.downloadData();
        }
    }

    /**
     * @param {Location} location
     *
     */
    async handleLocation(location) {
        const { pathname, hostname } = location;
        if (hostname === BOOKMARK_IMPORT_DOMAIN) {
            if (this.#processingBookmark) {
                return;
            }
            this.#processingBookmark = true;
            this.handleBookmarkImportPath(pathname);
        } else {
            await this.handlePasswordManagerPath(pathname);
        }
    }

    /**
     * Based on the current element config, animates the element or taps it.
     * If the element should be watched for removal, it sets up a mutation observer.
     */
    async animateOrTapElement() {
        const { element, animationStyle, shouldTap, shouldWatchForRemoval } = this.currentElementConfig ?? {};
        if (element != null && animationStyle != null) {
            if (shouldTap) {
                this.autotapElement(element);
            } else {
                await this.domLoaded;
                this.animateElement(element, animationStyle);
            }
            if (shouldWatchForRemoval) {
                // Sometimes navigation events are not triggered, then we need to watch for removal
                this.observeElementRemoval(element, () => {
                    this.removeOverlayIfNeeded();
                });
            }
        }
    }

    /**
     * @returns {string}
     */
    get exportButtonContainerSelector() {
        return this.#exportButtonSettings?.selectors?.join(',');
    }

    /**
     * @returns {string}
     */
    get exportButtonLabelTextSelector() {
        return this.#exportButtonSettings?.labelTexts.map((text) => `button[aria-label="${text}"]`).join(',');
    }

    /**
     * @returns {string}
     */
    get signinLabelTextSelector() {
        return this.#signInButtonSettings?.labelTexts.map((text) => `a[aria-label="${text}"]:not([target="_top"])`).join(',');
    }

    /**
     * @returns {string}
     */
    get signinButtonSelector() {
        return `${this.#signInButtonSettings?.selectors?.join(',')}, ${this.signinLabelTextSelector}`;
    }

    /**
     * @returns {string}
     */
    get settingsLabelTextSelector() {
        return this.#settingsButtonSettings?.labelTexts.map((text) => `a[aria-label="${text}"]`).join(',');
    }

    /**
     * @returns {string}
     */
    get settingsButtonSelector() {
        return `${this.#settingsButtonSettings?.selectors?.join(',')}, ${this.settingsLabelTextSelector}`;
    }

    get manageButtonSelector() {
        return 'a[href="manage"]';
    }

    get userIdSelector() {
        return 'a[href*="&user="]';
    }

    setButtonSettings() {
        this.#exportButtonSettings = this.getFeatureSetting('exportButton');
        this.#signInButtonSettings = this.getFeatureSetting('signInButton');
        this.#settingsButtonSettings = this.getFeatureSetting('settingsButton');
    }

    /* ****************************** Bookmark import code ****************************** */

    getRoot(selector) {
        return /** @type HTMLElement */ (document.querySelector(selector)) ?? document;
    }

    get disselectAllButtonSelector() {
        return `${this.tabPanelSelector} div:nth-child(2) div:nth-child(2)`;
    }

    get bookmarkModalSelector() {
        return 'fieldset.rcetic';
    }

    get bookmarkSelectButtonSelector() {
        return `${this.bookmarkModalSelector} input`;
    }

    get chromeInputCheckboxSelector() {
        return `${this.tabPanelSelector} div:nth-child(10) input[type="checkbox"]`;
    }

    get chromeSectionSelector() {
        return 'c-wiz [data-id="chrome"]';
    }

    get chromeDataButtonSelector() {
        return `${this.tabPanelSelector} div:nth-child(10) > div:nth-child(2) > div:nth-child(2) button`;
    }

    get nextStepButtonSelector() {
        return `${this.tabPanelSelector} > div:nth-child(1) > div:nth-child(2) button`;
    }

    get createExportButtonSelector() {
        return 'div[data-configure-step="1"] button';
    }

    get tabPanelSelector() {
        return 'div[role="tabpanel"]';
    }

    get inputCheckboxSelector() {
        return `${this.tabPanelSelector} input[type="checkbox"]`;
    }

    get okButtonSelector() {
        return 'div[isfullscreen] div:nth-child(3) div:last-child';
    }

    get bookmarkCheckboxSelector() {
        return `${this.bookmarkModalSelector} div:nth-child(3) > div:nth-of-type(2) input`;
    }

    async findExportId() {
        const panels = document.querySelectorAll(this.tabPanelSelector);
        const exportPanel = panels[panels.length - 1];
        return await withExponentialBackoff(() => exportPanel.querySelector('div[data-archive-id]')?.getAttribute('data-archive-id'));
    }

    async storeExportId() {
        this.#exportId = await this.findExportId();
        console.log('DEEP DEBUG autofill-password-import: stored export id', this.#exportId);
    }

    startExportProcess() {
        click({
            id: 'next-step-button-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: this.nextStepButtonSelector
            }]
        }, {}, document)

        click({
            id: 'create-export-button-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: this.createExportButtonSelector
            }]
        }, {}, document)
    }

    async openBookmarkModal() { 
        if (this.#isBookmarkProcessed || this.#isBookmarkModalVisible) {
            return;
        }

        await this.runWithRetry(() => {
            const element = /** @type HTMLButtonElement */ (document.querySelector(this.chromeDataButtonSelector));
            return element?.checkVisibility();
        });

        click({
            id: 'select-bookmark-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: this.chromeDataButtonSelector
            }]
        }, {}, document);
        await this.runWithRetry(() => document.querySelector(this.bookmarkModalSelector) != null)
        this.#isBookmarkModalVisible = true;
    }

    async selectBookmark() {
        if (this.#isBookmarkProcessed) {
            return;
        }

        const disselectSelector = `${this.bookmarkModalSelector} div:nth-child(2) button:nth-of-type(2)`;

        click({
            id: 'bookmark-disselect-all-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: disselectSelector
            }]
        }, {}, this.getRoot(this.bookmarkModalSelector))

        await this.runWithRetry(() => {
            const element = /** @type HTMLInputElement */ (document.querySelector(this.bookmarkCheckboxSelector));
            return !element.checked;
        });

        click({
            id: 'bookmark-checkbox-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: this.bookmarkCheckboxSelector
            }]
        }, {}, document)

        await this.runWithRetry(() => {
            const element = /** @type HTMLInputElement */ (document.querySelector(this.bookmarkCheckboxSelector));
            return element?.checked;
        });

        await this.runWithRetry(() => {
            const okButton = /** @type HTMLButtonElement */ (document.querySelector(this.okButtonSelector));
            return okButton?.ariaDisabled !== 'true';
        });

        click({
            id: 'bookmark-ok-button-click',
            actionType: 'click',
            elements: [{
                type: 'element',
                selector: this.okButtonSelector
            }]
        }, {}, document)

        this.#isBookmarkModalVisible = false;
        this.#isBookmarkProcessed = true;
    }

    async scrollToChromeSection() {
        const chromeSectionElement = /** @type HTMLInputElement */ (
            await this.runWithRetry(() => document.querySelectorAll(this.chromeSectionSelector)[0].querySelector('input'))
        );
        console.log('DEEP chromeSectionElement', chromeSectionElement);

        await this.runWithRetry(() => !chromeSectionElement.checked);

        chromeSectionElement.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
        chromeSectionElement?.click();
    }

    urlChanged(navigationType) {
        console.log('DEEP DEBUG autofill-password-import: urlChanged', window.location.pathname, navigationType);
        this.handleLocation(window.location);
    }

    init() {
        console.log('DEEP DEBUG autofill-password-import: init');
        if (isBeingFramed()) {
            return;
        }

        this.setButtonSettings();
        const handleLocation = this.handleLocation.bind(this);

        this.#domLoaded = new Promise((resolve) => {
            if (document.readyState !== 'loading') {
                // @ts-expect-error - caller doesn't expect a value here
                resolve();
                return;
            }

            document.addEventListener(
                'DOMContentLoaded',
                async () => {
                    // @ts-expect-error - caller doesn't expect a value here
                    resolve();
                    await handleLocation(window.location);
                },
                { once: true },
            );
        });
    }
}
