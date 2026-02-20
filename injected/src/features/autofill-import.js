import { isBeingFramed, withRetry } from '../utils';
import { ActionExecutorBase } from './broker-protection';
import { ErrorResponse } from './broker-protection/types';

export const ANIMATION_DURATION_MS = 1000;
export const ANIMATION_ITERATIONS = Infinity;
export const BACKGROUND_COLOR_START = 'rgba(85, 127, 243, 0.10)';
export const BACKGROUND_COLOR_END = 'rgba(85, 127, 243, 0.25)';
export const OVERLAY_ID = 'ddg-password-import-overlay';
export const DELAY_BEFORE_ANIMATION = 300;
const MANAGE_ARCHIVE_DEFAULT_BASE = '/manage/archive';

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
 * @property {ButtonAnimationStyle|null} animationStyle
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
export default class AutofillImport extends ActionExecutorBase {
    #exportButtonSettings;

    #settingsButtonSettings;

    #signInButtonSettings;

    #exportConfirmButtonSettings;

    /** @type {HTMLElement|Element|SVGElement|null} */
    #elementToCenterOn;

    /** @type {HTMLElement|null} */
    #currentOverlay;

    /** @type {ElementConfig|null} */
    #currentElementConfig;

    #domLoaded;

    #processingBookmark;

    #isBookmarkModalVisible = false;

    /** @type {WeakSet<Element>} Use WeakSet for DOM refs to allow GC */
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

    /**
     * @returns {Promise<Element|HTMLElement|null>}
     */
    async runWithRetry(fn, maxAttempts = 4, delay = 500, strategy = 'exponential') {
        try {
            return await withRetry(fn, maxAttempts, delay, strategy);
        } catch (error) {
            return null;
        }
    }

    /**
     * @returns {Promise<ElementConfig | null>}
     */
    async getExportConfirmElementAndStyle() {
        const exportConfirmElement = await this.findExportConfirmElement();
        const shouldAutotap = this.#exportConfirmButtonSettings?.shouldAutotap && exportConfirmElement != null;
        return shouldAutotap
            ? {
                  animationStyle: null,
                  element: exportConfirmElement,
                  shouldTap: true,
                  shouldWatchForRemoval: false,
                  tapOnce: false,
              }
            : null;
    }

    /**
     * @returns {Promise<ElementConfig | null>}
     */
    async getExportElementAndStyle() {
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
            // If we have found the popup element, then we return that early.
            const isExportButtonTapped =
                this.currentElementConfig?.element != null && this.#tappedElements.has(this.currentElementConfig?.element);
            if (isExportButtonTapped) {
                return await this.getExportConfirmElementAndStyle();
            } else {
                return await this.getExportElementAndStyle();
            }
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

    async findExportConfirmElement() {
        return await this.runWithRetry(() => document.querySelector(this.exportConfirmButtonSelector));
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

        return await this.runWithRetry(() => findInContainer() ?? findWithLabel());
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSettingsElement() {
        const fn = () => {
            const settingsButton = document.querySelector(this.settingsButtonSelector);
            return settingsButton;
        };
        return await this.runWithRetry(fn);
    }

    /**
     * @returns {Promise<HTMLElement|Element|null>}
     */
    async findSignInButton() {
        return await this.runWithRetry(() => document.querySelector(this.signinButtonSelector));
    }

    /**
     * Event handler using class instance pattern.
     * Use `addEventListener('scroll', this)` not `.bind(this)` to allow removal.
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

            if (config.animationStyle != null) this.setElementToCenterOn(config.element, config.animationStyle);
        }
    }

    /**
     * Checks if the path is supported for animation.
     * NOTE: All paths here must have corresponding handlers in getElementAndStyleFromPath()
     * @param {string} path
     * @returns {boolean}
     */
    isSupportedPath(path) {
        return [
            this.#exportButtonSettings?.path,
            this.#settingsButtonSettings?.path,
            this.#signInButtonSettings?.path,
            this.#exportConfirmButtonSettings?.path,
        ].includes(path);
    }

    async handlePasswordManagerPath(pathname) {
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
                this.log.error('password-import: failed for path:', pathname);
            }
        }
    }

    /**
     * @returns {Array<Record<string, any>>}
     */
    get bookmarkImportActionSettings() {
        return this.getFeatureSetting('actions') || [];
    }

    /**
     * @returns {Record<string, string>}
     */
    get bookmarkImportSelectorSettings() {
        return this.getFeatureSetting('selectors');
    }

    /**
     * @param {Location} location
     *
     */
    async handleLocation(location) {
        const { pathname } = location;
        if (this.bookmarkImportActionSettings.length > 0) {
            if (this.#processingBookmark) {
                return;
            }
            this.#processingBookmark = true;
            await this.handleBookmarkImportPath(pathname);
        } else if (this.getFeatureSetting('settingsButton')) {
            await this.handlePasswordManagerPath(pathname);
        } else {
            // Unknown feature, we bail out
        }
    }

    /**
     * Based on the current element config, animates the element or taps it.
     * If the element should be watched for removal, it sets up a mutation observer.
     */
    async animateOrTapElement() {
        const { element, animationStyle, shouldTap, shouldWatchForRemoval } = this.currentElementConfig ?? {};
        if (element != null) {
            if (shouldTap) {
                this.autotapElement(element);
            } else {
                if (animationStyle != null) {
                    await this.domLoaded;
                    this.animateElement(element, animationStyle);
                }
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
    get exportConfirmButtonSelector() {
        return this.#exportConfirmButtonSettings?.selectors?.join(',');
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

    /** Bookmark import code */
    get defaultRetrySettings() {
        return {
            maxAttempts: this.getFeatureSetting('downloadRetryLimit') ?? Infinity,
            interval: this.getFeatureSetting('downloadRetryInterval') ?? 1000,
        };
    }

    async downloadData() {
        // Run with retry forever until the download link is available,
        // Android is the one that timesout anyway and closes the whole tab if this doesn't complete

        const exportId = window.location.pathname
            .split('/')
            .filter((segment) => segment)
            .pop();

        if (!exportId) {
            this.postBookmarkImportMessage('actionCompleted', {
                result: new ErrorResponse({
                    actionID: 'download-data',
                    message: 'User id or export id not found',
                }),
            });
            return;
        }

        const downloadLinkSelector = this.bookmarkImportSelectorSettings.downloadLink ?? `a[href*="&i=0&user="]`;
        const downloadButton = /** @type {HTMLAnchorElement|null} */ (
            await this.runWithRetry(() => document.querySelector(downloadLinkSelector), 5, 1000, 'linear')
        );
        if (downloadButton == null) {
            // If there was no download link, it was likely a 404
            // so we reload the page to try again
            window.location.reload();
        }

        downloadButton?.click();
    }

    /**
     * Here we ignore the action and return a default retry config
     * as for now the retry doesn't need to be per action.
     */
    retryConfigFor(_) {
        const { interval, maxAttempts } = this.defaultRetrySettings;
        return {
            interval: { ms: interval },
            maxAttempts,
        };
    }

    postBookmarkImportMessage(name, data) {
        globalThis.ddgBookmarkImport?.postMessage(
            JSON.stringify({
                name,
                data,
            }),
        );
    }

    patchMessagingAndProcessAction(action) {
        // Ideally we should be usuing standard messaging in Android, but we are not ready yet
        // So just patching the notify method to post a message to the Android side
        this.messaging.notify = this.postBookmarkImportMessage.bind(this);
        return this.processActionAndNotify(action, {});
    }

    async handleBookmarkImportPath(pathname) {
        if (pathname === '/' && !this.#isBookmarkModalVisible) {
            for (const action of this.bookmarkImportActionSettings) {
                await this.patchMessagingAndProcessAction(action);
            }

            // Parse the export id from the page and then navigate to the 'manage' page
            const exportId = await this.getExportId();
            window.location.href = `${MANAGE_ARCHIVE_DEFAULT_BASE}/${exportId}`;
        } else if (pathname.startsWith(MANAGE_ARCHIVE_DEFAULT_BASE)) {
            // If we're on the 'manage' page, we can download the data
            await this.downloadData();
        } else {
            // Unhandled path, we bail out
        }
    }

    setPasswordImportSettings() {
        this.#exportButtonSettings = this.getFeatureSetting('exportButton');
        this.#signInButtonSettings = this.getFeatureSetting('signInButton');
        this.#settingsButtonSettings = this.getFeatureSetting('settingsButton');
        this.#exportConfirmButtonSettings = this.getFeatureSetting('exportConfirmButton');
    }

    findExportId() {
        const panels = document.querySelectorAll(this.bookmarkImportSelectorSettings.tabPanel);
        const exportPanel = panels[panels.length - 1];
        const dataArchiveIdSelector = this.bookmarkImportSelectorSettings.dataArchiveId ?? `div[data-archive-id]`;
        return exportPanel.querySelector(dataArchiveIdSelector)?.getAttribute('data-archive-id');
    }

    async getExportId() {
        const { maxAttempts, interval } = this.defaultRetrySettings;
        return await this.runWithRetry(() => this.findExportId(), maxAttempts, interval, 'linear');
    }

    urlChanged() {
        void this.handleLocation(window.location);
    }

    init() {
        if (isBeingFramed()) {
            return;
        }

        if (this.getFeatureSetting('settingsButton')) {
            this.setPasswordImportSettings();
        }
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
