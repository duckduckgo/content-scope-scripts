import ContentFeature from '../content-feature';
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils';

export const ANIMATION_DURATION_MS = 1000;
export const ANIMATION_ITERATIONS = Infinity;
export const BACKGROUND_COLOR_START = 'rgba(85, 127, 243, 0.10)';
export const BACKGROUND_COLOR_END = 'rgba(85, 127, 243, 0.25)';
export const OVERLAY_ID = 'ddg-password-import-overlay';
export const DELAY_BEFORE_ANIMATION = 300;

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
    #elementToCenterOn;

    /**
     * @returns {any}
     */
    get settingsButtonStyle() {
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
     * @returns {any}
     */
    get exportButtonStyle() {
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
     * @returns {any}
     */
    get signInButtonStyle() {
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
     * Takes a path and returns the element and style to animate.
     * @param {string} path
     * @returns {Promise<{element: HTMLElement|Element, style: any, shouldTap: boolean, shouldWatchForRemoval: boolean}|null>}
     */
    async getElementAndStyleFromPath(path) {
        if (path === '/') {
            const element = await this.findSettingsElement();
            return element != null
                ? {
                      style: this.settingsButtonStyle,
                      element,
                      shouldTap: this.#settingsButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: false,
                  }
                : null;
        } else if (path === '/options') {
            const element = await this.findExportElement();
            return element != null
                ? {
                      style: this.exportButtonStyle,
                      element,
                      shouldTap: this.#exportButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: true,
                  }
                : null;
        } else if (path === '/intro') {
            const element = await this.findSignInButton();
            return element != null
                ? {
                      style: this.signInButtonStyle,
                      element,
                      shouldTap: this.#signInButtonSettings?.shouldAutotap ?? false,
                      shouldWatchForRemoval: false,
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
        const existingOverlay = document.getElementById(OVERLAY_ID);
        if (existingOverlay != null) {
            existingOverlay.style.display = 'none';
            existingOverlay.remove();
            document.removeEventListener('scroll', this.updateOverlayPosition.bind(this));
        }
    }

    /**
     * Updates the position of the overlay based on the element to center on.
     * @param {HTMLDivElement} overlay
     * @param {any} style
     */
    updateOverlayPosition(overlay, style) {
        const animations = overlay.getAnimations();
        animations.forEach((animation) => animation.pause());
        const { top, left, width, height } = this.elementToCenterOn.getBoundingClientRect();
        overlay.style.position = 'absolute';

        const isRound = style.borderRadius === '100%';

        const widthOffset = isRound ? width / 2 : 0;
        const heightOffset = isRound ? height / 2 : 0;

        overlay.style.top = `calc(${top}px + ${window.scrollY}px - ${widthOffset}px - 1px - ${style.offsetTopEm}em)`;
        overlay.style.left = `calc(${left}px + ${window.scrollX}px - ${heightOffset}px - 1px - ${style.offsetLeftEm}em)`;

        // Ensure overlay is non-interactive
        overlay.style.pointerEvents = 'none';
        animations.forEach((animation) => animation.play());
    }

    /**
     * Inserts an overlay element to animate, by adding a div to the body
     * and styling it based on the found element.
     * @param {HTMLElement|Element} mainElement
     * @param {any} style
     * @returns {HTMLElement|Element|null}
     */
    insertOverlayElement(mainElement, style) {
        this.removeOverlayIfNeeded();

        const overlay = document.createElement('div');
        overlay.setAttribute('id', OVERLAY_ID);

        if (this.elementToCenterOn != null) {
            this.updateOverlayPosition(overlay, style);

            const mainElementRect = mainElement.getBoundingClientRect();
            overlay.style.width = `${mainElementRect.width}px`;
            overlay.style.height = `${mainElementRect.height}px`;
            overlay.style.zIndex = style.zIndex;

            // Ensure overlay is non-interactive
            overlay.style.pointerEvents = 'none';

            document.addEventListener('scroll', () => {
                requestAnimationFrame(() => this.updateOverlayPosition(overlay, style));
            });

            // insert in document.body
            document.body.appendChild(overlay);
            return overlay;
        } else {
            return null;
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

    setElementToCenterOn(element, style) {
        const svgElement = element.parentNode?.querySelector('svg') ?? element.querySelector('svg');
        this.#elementToCenterOn = style.borderRadius === '100%' && svgElement != null ? svgElement : element;
    }

    get elementToCenterOn() {
        return this.#elementToCenterOn;
    }

    /**
     * Moves the element into view and animates it.
     * @param {HTMLElement|Element} element
     * @param {any} style
     */
    animateElement(element, style) {
        const overlay = this.insertOverlayElement(element, style);
        if (overlay != null) {
            overlay.scrollIntoView({
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
            overlay.animate(keyframes, options);
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
     * Checks if the path is supported and animates/taps the element if it is.
     * @param {string} path
     */
    async handleElementForPath(path) {
        this.removeOverlayIfNeeded();
        const supportedPaths = [this.#exportButtonSettings?.path, this.#settingsButtonSettings?.path, this.#signInButtonSettings?.path];
        if (supportedPaths.includes(path)) {
            try {
                const { element, style, shouldTap, shouldWatchForRemoval } = (await this.getElementAndStyleFromPath(path)) ?? {};
                this.setElementToCenterOn(element, style);
                if (element != null) {
                    if (shouldTap) {
                        this.autotapElement(element);
                    } else {
                        const domLoaded = new Promise((resolve) => {
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', resolve);
                            } else {
                                // @ts-expect-error - caller doesn't expect a value here
                                resolve();
                            }
                        });
                        await domLoaded;
                        this.animateElement(element, style);
                    }
                    if (shouldWatchForRemoval) {
                        // Sometimes navigation events are not triggered, then we need to watch for removal
                        this.observeElementRemoval(element, () => {
                            this.removeOverlayIfNeeded();
                        });
                    }
                }
            } catch {
                console.error('password-import: handleElementForPath failed for path:', path);
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

    setButtonSettings() {
        this.#exportButtonSettings = this.getFeatureSetting('exportButton');
        this.#signInButtonSettings = this.getFeatureSetting('signInButton');
        this.#settingsButtonSettings = this.getFeatureSetting('settingsButton');
    }

    init() {
        this.setButtonSettings();

        const handleElementForPath = this.handleElementForPath.bind(this);
        const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
            async apply(target, thisArg, args) {
                const path = args[1] === '' ? args[2].split('?')[0] : args[1];
                await handleElementForPath(path);
                return DDGReflect.apply(target, thisArg, args);
            },
        });
        historyMethodProxy.overload();
        // listen for popstate events in order to run on back/forward navigations
        window.addEventListener('popstate', async () => {
            await handleElementForPath(window.location.pathname);
        });

        document.addEventListener('DOMContentLoaded', async () => {
            await handleElementForPath(window.location.pathname);
        });
    }
}
