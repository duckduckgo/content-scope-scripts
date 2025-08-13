import ContentFeature from '../content-feature.js';
import { isBeingFramed } from '../utils.js';
import { DuckPlayerNativeMessages } from './duckplayer-native/messages.js';
import { setupDuckPlayerForNoCookie, setupDuckPlayerForSerp, setupDuckPlayerForYouTube } from './duckplayer-native/sub-feature.js';
import { Environment } from './duckplayer/environment.js';
import { Logger } from './duckplayer/util.js';
import { MetricsReporter, EXCEPTION_KIND_INITIAL_SETUP_ERROR } from '../../../metrics/metrics-reporter.js';

/**
 * @import {DuckPlayerNativeSubFeature} from './duckplayer-native/sub-feature.js'
 * @import {DuckPlayerNativeSettings} from '@duckduckgo/privacy-configuration/schema/features/duckplayer-native.js'
 * @import {UrlChangeSettings} from './duckplayer-native/messages.js'
 */

/**
 * @typedef InitialSettings - The initial payload used to communicate render-blocking information
 * @property {string} locale - UI locale
 * @property {UrlChangeSettings['pageType']} [pageType] - The type of the current page
 * @property {boolean} [playbackPaused] - Should video start playing or paused
 */

/**
 * @import localeStrings from '../locales/duckplayer/en/native.json'
 * @typedef {(key: keyof localeStrings) => string} TranslationFn
 */

export class DuckPlayerNativeFeature extends ContentFeature {
    /** @type {DuckPlayerNativeSubFeature | null} */
    currentPage;
    /** @type {TranslationFn} */
    t;

    init(args) {
        /**
         * This feature never operates in a frame
         */
        if (isBeingFramed()) return;

        const locale = args?.locale || args?.language || 'en';
        const env = new Environment({
            debug: this.isDebug,
            injectName: import.meta.injectName,
            platform: this.platform,
            locale,
        });
        const metrics = new MetricsReporter(this.messaging);

        try {
            const selectors = this.getFeatureSetting('selectors');
            if (!selectors) {
                console.warn('No selectors found. Check remote config. Feature will not be initialized.');
                return;
            }

            // Translation function to be used by view components
            this.t = (key) => env.strings('native.json')[key];

            const messages = new DuckPlayerNativeMessages(this.messaging, env);
            this.initDuckPlayerNative(messages, selectors, env)
                // Using then instead of await because this is the public interface of the parent, which doesn't explicitly wait for promises to be resolved.
                // eslint-disable-next-line promise/prefer-await-to-then
                .catch((e) => {
                    console.error(e);
                    metrics.reportExceptionWithError(e);
                });
        } catch (e) {
            console.error(e);
            metrics.reportExceptionWithError(e);
        }
    }

    async initDuckPlayerNative(messages, selectors, env) {
        messages.subscribeToURLChange(({ pageType }) => {
            const playbackPaused = false; // This can be added to the event data in the future if needed
            this.urlDidChange(pageType, selectors, playbackPaused, env, messages);
        });

        /** @type {InitialSettings} */
        let initialSetup;

        try {
            initialSetup = await messages.initialSetup();
        } catch (e) {
            console.warn(e);
            return;
        }

        if (!initialSetup) {
            const message = 'InitialSetup data is missing';
            console.warn(message);
            messages.metrics.reportException({ message, kind: EXCEPTION_KIND_INITIAL_SETUP_ERROR });
            return;
        }

        if (initialSetup.pageType) {
            const playbackPaused = initialSetup.playbackPaused || false;
            this.urlDidChange(initialSetup.pageType, selectors, playbackPaused, env, messages);
        }
    }

    /**
     *
     * @param {UrlChangeSettings['pageType']} pageType
     * @param {DuckPlayerNativeSettings['selectors']} selectors
     * @param {boolean} playbackPaused
     * @param {Environment} env
     * @param {DuckPlayerNativeMessages} messages
     */
    urlDidChange(pageType, selectors, playbackPaused, env, messages) {
        /** @type {DuckPlayerNativeSubFeature | null} */
        let nextPage = null;

        const logger = new Logger({
            id: 'DUCK_PLAYER_NATIVE',
            shouldLog: () => env.isTestMode(),
        });

        switch (pageType) {
            case 'NOCOOKIE':
                nextPage = setupDuckPlayerForNoCookie(selectors, env, messages, this.t);
                break;
            case 'YOUTUBE':
                nextPage = setupDuckPlayerForYouTube(selectors, playbackPaused, env, messages);
                break;
            case 'SERP':
                nextPage = setupDuckPlayerForSerp();
                break;
            case 'UNKNOWN':
            default:
                console.warn('No known pageType');
        }

        if (this.currentPage) {
            this.currentPage.destroy();
        }

        if (nextPage) {
            logger.log('Running init handlers');
            nextPage.onInit();
            this.currentPage = nextPage;

            if (document.readyState === 'loading') {
                const loadHandler = () => {
                    logger.log('Running deferred load handlers');
                    nextPage?.onLoad();
                    messages.notifyScriptIsReady();
                };
                document.addEventListener('DOMContentLoaded', loadHandler, { once: true });
            } else {
                logger.log('Running load handlers immediately');
                nextPage.onLoad();
                messages.notifyScriptIsReady();
            }
        }
    }
}

export default DuckPlayerNativeFeature;
