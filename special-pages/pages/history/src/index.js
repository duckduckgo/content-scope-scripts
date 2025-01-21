/**
 * Special Page example. Used as a template for new special pages.
 *
 * @module History Page
 */

import 'preact/devtools';
import { createTypedMessages } from '@duckduckgo/messaging';
import { Environment } from '../../../shared/environment.js';
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging.js';
import { init } from '../app/index.js';
import '../../../shared/live-reload.js';
import { mockTransport } from '../app/mocks/mock-transport.js';
import { render } from 'preact';

export class HistoryPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging) {
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
     * @returns {Promise<import('../types/history.js').InitialSetupResponse>}
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
     * This will be sent if the application fails to load.
     * @param {import('../types/history.js').HistoryQuery} params
     */
    query(params) {
        return this.messaging.request('query', params);
    }
}

const baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv(import.meta.env);

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: /** @type {string} */ (import.meta.pageName),
    mockTransport: () => {
        // only in integration environments
        if (baseEnvironment.injectName !== 'integration') return null;
        let mock = null;
        // eslint-disable-next-line no-labels,no-unused-labels
        $INTEGRATION: mock = mockTransport();
        return mock;
    },
});

const historyPage = new HistoryPage(messaging);

/**
 * Grab the root element from the index.html file - bail early if it's absent
 */
const root = document.querySelector('#app');
if (!root) {
    document.documentElement.dataset.fatalError = 'true';
    render('Fatal: #app missing', document.body);
    throw new Error('Missing #app');
}

init(root, historyPage, baseEnvironment).catch((e) => {
    // messages.
    console.error(e);
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error';
    historyPage.reportInitException({ message: msg });
});
