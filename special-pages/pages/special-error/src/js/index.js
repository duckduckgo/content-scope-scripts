/**
 * Special Page that displays errors
 *
 * @module SSL Error Page
 */

import { createTypedMessages } from '@duckduckgo/messaging';
import { Environment } from '../../../../shared/environment.js';
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging.js';
import { sampleData } from './sampleData.js';
import { init } from '../../app/index.js';

export class SpecialErrorPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging, env) {
        this.integration = env === 'integration';
        this.messaging = createTypedMessages(this, messaging);
    }

    /**
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "env": "development",
     *   "locale": "en"
     * }
     * ```
     *
     * @returns {Promise<import('../../types/special-error.js').InitialSetupResponse>}
     */
    initialSetup() {
        return this.messaging.request('initialSetup');
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException(params) {
        this.messaging.notify('reportPageException', params);
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException(params) {
        this.messaging.notify('reportInitException', params);
    }

    /**
     * This will be sent when the user chooses to leave the current site
     */
    leaveSite() {
        this.messaging.notify('leaveSite');
    }

    /**
     * This will be sent when the user chooses to visit the current site despite warnings
     */
    visitSite() {
        this.messaging.notify('visitSite');
    }

    /**
     * This will be sent when the user clicks the Advanced Info button
     */
    advancedInfo() {
        this.messaging.notify('advancedInfo');
    }
}

export class IntegrationSpecialErrorPage extends SpecialErrorPage {
    /**
     * @returns {Promise<import('../../types/special-error.js').InitialSetupResponse>}
     */
    initialSetup() {
        const searchParams = new URLSearchParams(window.location.search);
        const errorId = searchParams.get('errorId');
        const platformName = searchParams.get('platformName');

        /** @type {import('../../types/special-error.js').InitialSetupResponse['errorData']} */
        let errorData = sampleData['ssl.expired'].data;
        if (errorId && Object.keys(sampleData).includes(errorId)) {
            errorData = sampleData[errorId].data;
        }

        const supportedPlatforms = ['macos', 'ios'];
        /** @type {import('../../types/special-error.js').InitialSetupResponse['platform']} */
        let platform = { name: 'macos' };
        if (platformName && supportedPlatforms.includes(platformName)) {
            platform = {
                name: /** @type {import('../../types/special-error.js').InitialSetupResponse['platform']['name']} */ (platformName),
            };
        }

        return Promise.resolve({
            env: 'development',
            locale: 'en',
            platform,
            errorData,
        });
    }
}

const baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv(import.meta.env);

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: /** @type {string} */ (import.meta.pageName),
});

const specialErrorPage =
    baseEnvironment.injectName === 'integration'
        ? new IntegrationSpecialErrorPage(messaging, baseEnvironment.injectName)
        : new SpecialErrorPage(messaging, baseEnvironment.injectName);

init(specialErrorPage, baseEnvironment).catch((e) => {
    // messages.
    console.error(e);
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error';
    specialErrorPage.reportInitException({ message: msg });
});
