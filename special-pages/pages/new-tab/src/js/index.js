import 'preact/devtools';
import { render, Fragment, h } from 'preact';
/**
 * New Tab Page
 *
 * @module New Tab Page
 */
import { init } from '../../app/index.js';
import { createTypedMessages } from '@duckduckgo/messaging';
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging';
import { Environment } from '../../../../shared/environment.js';
import { mockTransport } from './mock-transport.js';
import { install } from '../../app/telemetry/telemetry.js';

export class NewTabPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta['injectName']} injectName
     */
    constructor(messaging, injectName) {
        /**
         * @internal - test 3
         */
        this.messaging = createTypedMessages(this, messaging);
        this.injectName = injectName;
    }

    /**
     * @return {Promise<import('../../../../types/new-tab.js').InitialSetupResponse>}
     */
    init() {
        return this.messaging.request('initialSetup');
    }

    /**
     * @param {string} message
     */
    reportInitException(message) {
        this.messaging.notify('reportInitException', { message });
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
     * Sent when a right-click occurs, and wasn't intercepted by another widget
     * @param {import('../../../../types/new-tab.js').ContextMenuNotify} params
     */
    contextMenu(params) {
        this.messaging.notify('contextMenu', params);
    }
}

const baseEnvironment = new Environment().withInjectName(import.meta.injectName).withEnv(import.meta.env);

const rawMessaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'newTabPage',
    mockTransport: () => {
        // only in integration environments
        if (baseEnvironment.injectName !== 'integration') return null;
        let mock = null;
        // eslint-disable-next-line no-labels,no-unused-labels
        $INTEGRATION: mock = mockTransport();
        return mock;
    },
});

const { messaging, telemetry } = install(rawMessaging);
const newTabMessaging = new NewTabPage(messaging, import.meta.injectName);

/**
 * Grab the root element from the index.html file - bail early if it's absent
 */
const root = document.querySelector('#app');
if (!root) {
    document.documentElement.dataset.fatalError = 'true';
    render('Fatal: #app missing', document.body);
    throw new Error('Missing #app');
}

init(root, newTabMessaging, telemetry, baseEnvironment).catch((e) => {
    console.error(e);
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error';
    newTabMessaging.reportInitException(msg);
    document.documentElement.dataset.fatalError = 'true';
    const element = (
        <Fragment>
            <div style="padding: 1rem;">
                <p>
                    <strong>A fatal error occurred:</strong>
                </p>
                <br />
                <pre style={{ whiteSpace: 'prewrap', overflow: 'auto' }}>
                    <code>{JSON.stringify({ message: e.message }, null, 2)}</code>
                </pre>
                <br />
                <p>
                    <strong>Telemetry</strong>
                </p>
                <br />
                <pre style={{ whiteSpace: 'prewrap', overflow: 'auto', fontSize: '.8em' }}>
                    <code>{JSON.stringify(telemetry.eventStore, null, 2)}</code>
                </pre>
            </div>
        </Fragment>
    );
    render(element, document.body);
});
