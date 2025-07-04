import { DomState } from './util.js';
import { ClickInterception, Thumbnails } from './thumbnails.js';
import { VideoOverlay } from './video-overlay.js';
import { registerCustomElements } from './components/index.js';

/**
 * @typedef {object} OverlayOptions
 * @property {import("../duck-player.js").UserValues} userValues
 * @property {import("../duck-player.js").OverlaysFeatureSettings} settings
 * @property {import("../duck-player.js").DuckPlayerOverlayMessages} messages
 * @property {import("../duck-player.js").UISettings} ui
 * @property {import("./environment.js").Environment} environment
 */

/**
 * @param {import("../duck-player.js").OverlaysFeatureSettings} settings - methods to read environment-sensitive things like the current URL etc
 * @param {import("./environment.js").Environment} environment - methods to read environment-sensitive things like the current URL etc
 * @param {import("./overlay-messages.js").DuckPlayerOverlayMessages} messages - methods to communicate with a native backend
 */
export async function initOverlays(settings, environment, messages) {
    // bind early to attach all listeners
    const domState = new DomState();

    /** @type {import("../duck-player.js").OverlaysInitialSettings} */
    let initialSetup;
    try {
        initialSetup = await messages.initialSetup();
    } catch (e) {
        console.warn(e);
        return;
    }

    if (!initialSetup) {
        console.warn('cannot continue without user settings');
        return;
    }

    let { userValues, ui } = initialSetup;

    // ad block detection
    let adBlockDestroy;
    const adBlockSelector = 'Foo Figthers - Everlong';
    const adBlockMessageName = 'didFindAdBlockNotice';

    /**
     * Create the instance - this might fail if settings or user preferences prevent it
     * @type {Thumbnails|ClickInterception|null}
     */
    let thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui });
    let videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui });

    if (thumbnails || videoOverlays) {
        if (videoOverlays) {
            registerCustomElements();
            videoOverlays?.init('page-load');
        }
        domState.onLoaded(() => {
            // start initially
            thumbnails?.init();

            // now add video overlay specific stuff
            if (videoOverlays) {
                // there was an issue capturing history.pushState, so just falling back to
                let prev = globalThis.location.href;
                setInterval(() => {
                    if (globalThis.location.href !== prev) {
                        videoOverlays?.init('href-changed');
                    }
                    prev = globalThis.location.href;
                }, 500);
            }

            adBlockDestroy = initAdBlockDetection(this.messaging, adBlockSelector, adBlockMessageName);
        });
    }

    function update() {
        thumbnails?.destroy();
        videoOverlays?.destroy();
        adBlockDestroy?.();

        // re-create thumbs
        thumbnails = thumbnailsFeatureFromOptions({ userValues, settings, messages, environment, ui });
        thumbnails?.init();

        // re-create video overlay
        videoOverlays = videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui });
        videoOverlays?.init('preferences-changed');

        // re-init ad block detection
        adBlockDestroy = initAdBlockDetection(this.messaging, adBlockSelector, adBlockMessageName);
    }

    /**
     * Continue to listen for updated preferences and try to re-initiate
     */
    messages.onUserValuesChanged((_userValues) => {
        userValues = _userValues;
        update();
    });

    /**
     * Continue to listen for updated UI settings and try to re-initiate
     */
    messages.onUIValuesChanged((_ui) => {
        ui = _ui;
        update();
    });
}

/**
 * Initializes ad block detection by monitoring for the presence of a selector or text
 * @param {import('../../../../messaging/index.js').Messaging} messaging - The messaging backend to notify when adblock is found
 * @param {string} adBlockSelector - The selector to watch for (starts with '.' or '#' for CSS selectors, otherwise treated as text)
 * @param {string} messageName - The message to send when adblock is found
 * @returns {() => void} - A function to disable detection
 */
const initAdBlockDetection = (messaging, adBlockSelector, messageName) => {
    const isSelector = adBlockSelector.startsWith('.') || adBlockSelector.startsWith('#');

    console.log('initAdBlockDetection', adBlockSelector, messageName, isSelector);
    // Check if the element already exists
    if (isSelector) {
        const existingAdBlock = document?.querySelector(adBlockSelector);
        if (existingAdBlock) {
            messaging.notify(messageName);
            return () => {};
        }
    } else {
        // Check for text content
        const existingText = document?.body?.textContent?.includes(adBlockSelector);
        if (existingText) {
            messaging.notify(messageName);
            return () => {};
        }
    }

    // Set up a MutationObserver to watch for when the element is created
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = /** @type {Element} */ (node);

                        if (isSelector) {
                            // Check if the added node is the adblock element
                            if (element.matches(adBlockSelector) || element.querySelector(adBlockSelector)) {
                                messaging.notify(messageName);
                                observer.disconnect();
                                return;
                            }
                        } else {
                            // Check for text content in the added element
                            if (element.textContent?.includes(adBlockSelector)) {
                                messaging.notify(messageName);
                                observer.disconnect();
                                return;
                            }
                        }
                    } else if (node.nodeType === Node.TEXT_NODE && !isSelector) {
                        // Check for text content in text nodes
                        const textContent = node.textContent;
                        if (textContent && textContent.includes(adBlockSelector)) {
                            messaging.notify(messageName);
                            observer.disconnect();
                            return;
                        }
                    }
                }
            } else if (mutation.type === 'characterData' && !isSelector) {
                console.log('characterData');
                // Check for text content changes
                const textContent = document?.body?.textContent;

                if (textContent && textContent.includes(adBlockSelector)) {
                    messaging.notify(messageName);
                    observer.disconnect();
                    return;
                }
            }
        }
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: !isSelector // Only watch character data when monitoring for text
    });

    return () => {
        console.log('disconnecting observer');
        observer.disconnect();
    };
}

/**
 * @param {OverlayOptions} options
 * @returns {Thumbnails | ClickInterception | null}
 */
function thumbnailsFeatureFromOptions(options) {
    return thumbnailOverlays(options) || clickInterceptions(options);
}

/**
 * @param {OverlayOptions} options
 * @return {Thumbnails | null}
 */
function thumbnailOverlays({ userValues, settings, messages, environment, ui }) {
    // bail if not enabled remotely
    if (settings.thumbnailOverlays.state !== 'enabled') return null;

    const conditions = [
        // must be in 'always ask' mode
        'alwaysAsk' in userValues.privatePlayerMode,
        // must not be set to play in DuckPlayer
        ui?.playInDuckPlayer !== true,
        // must be a desktop layout
        environment.layout === 'desktop',
    ];

    // Only show thumbnails if ALL conditions above are met
    if (!conditions.every(Boolean)) return null;

    return new Thumbnails({
        environment,
        settings,
        messages,
    });
}

/**
 * @param {OverlayOptions} options
 * @return {ClickInterception | null}
 */
function clickInterceptions({ userValues, settings, messages, environment, ui }) {
    // bail if not enabled remotely
    if (settings.clickInterception.state !== 'enabled') return null;

    const conditions = [
        // either enabled via prefs
        'enabled' in userValues.privatePlayerMode,
        // or has a one-time override
        ui?.playInDuckPlayer === true,
    ];

    // Intercept clicks if ANY of the conditions above are met
    if (!conditions.some(Boolean)) return null;

    return new ClickInterception({
        environment,
        settings,
        messages,
    });
}

/**
 * @param {OverlayOptions} options
 * @returns {VideoOverlay | undefined}
 */
function videoOverlaysFeatureFromSettings({ userValues, settings, messages, environment, ui }) {
    if (settings.videoOverlays.state !== 'enabled') return undefined;

    return new VideoOverlay({ userValues, settings, environment, messages, ui });
}
