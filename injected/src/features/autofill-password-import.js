import ContentFeature from '../content-feature';
import { DDGProxy, DDGReflect, withExponentialBackoff } from '../utils';

const ANIMATION_DURATION_MS = 1000;
const ANIMATION_ITERATIONS = Infinity;

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

    /**
     * @returns {any}
     */
    get settingsButtonStyle() {
        return {
            scale: 1,
            backgroundColor: 'rgba(0, 39, 142, 0.5)',
        };
    }

    /**
     * @returns {any}
     */
    get exportButtonStyle() {
        return {
            scale: 1.01,
            backgroundColor: 'rgba(0, 39, 142, 0.5)',
        };
    }

    /**
     * @returns {any}
     */
    get signInButtonStyle() {
        return {
            scale: 1.5,
            backgroundColor: 'rgba(0, 39, 142, 0.5)',
        };
    }

    /**
     * Takes a path and returns the element and style to animate.
     * @param {string} path
     * @returns {Promise<{element: HTMLElement|Element, style: any, shouldTap: boolean}|null>}
     */
    async getElementAndStyleFromPath(path) {
        if (path === '/') {
            const element = await this.findSettingsElement();
            return element != null
                ? {
                      style: this.settingsButtonStyle,
                      element,
                      shouldTap: this.#settingsButtonSettings?.shouldAutotap ?? false,
                  }
                : null;
        } else if (path === '/options') {
            const element = await this.findExportElement();
            return element != null
                ? {
                      style: this.exportButtonStyle,
                      element,
                      shouldTap: this.#exportButtonSettings?.shouldAutotap ?? false,
                  }
                : null;
        } else if (path === '/intro') {
            const element = await this.findSignInButton();
            return element != null
                ? {
                      style: this.signInButtonStyle,
                      element,
                      shouldTap: this.#signInButtonSettings?.shouldAutotap ?? false,
                  }
                : null;
        } else {
            return null;
        }
    }

    /**
     * Moves the element into view and animates it.
     * @param {HTMLElement|Element} element
     * @param {any} style
     */
    animateElement(element, style) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        }); // Scroll into view
        const keyframes = [
            { backgroundColor: 'rgba(0, 0, 255, 0)', offset: 0, borderRadius: '2px' }, // Start: transparent
            { backgroundColor: style.backgroundColor, offset: 0.5, borderRadius: '2px', transform: `scale(${style.scale})` }, // Midpoint: blue with 50% opacity
            { backgroundColor: 'rgba(0, 0, 255, 0)', borderRadius: '2px', offset: 1 }, // End: transparent
        ];

        // Define the animation options
        const options = {
            duration: ANIMATION_DURATION_MS,
            iterations: ANIMATION_ITERATIONS,
        };

        // Apply the animation to the element
        element.animate(keyframes, options);
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
        const supportedPaths = [this.#exportButtonSettings?.path, this.#settingsButtonSettings?.path, this.#signInButtonSettings?.path];
        if (supportedPaths.indexOf(path)) {
            try {
                const { element, style, shouldTap } = (await this.getElementAndStyleFromPath(path)) ?? {};
                if (element != null) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    shouldTap ? this.autotapElement(element) : this.animateElement(element, style);
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
