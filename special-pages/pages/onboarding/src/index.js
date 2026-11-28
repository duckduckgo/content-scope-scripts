/**
 * @module Onboarding Page
 */
import { createTypedMessages } from '@duckduckgo/messaging';
import { Environment } from '../../../shared/environment.js';
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging.js';
import { init } from '../app/index.js';
import { mockTransport } from './mock-transport.js';
import '../../../shared/live-reload.js';

/**
 * This describes the messages that will be sent to the native layer,
 */
export class OnboardingPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @param {ImportMeta["injectName"]} injectName
     * @internal
     */
    constructor(messaging, injectName) {
        /**
         * @internal
         */
        this.messaging = createTypedMessages(this, messaging);
        this.injectName = injectName;
    }

    /**
     * Sends an initial message to the native layer. This is the opportunity for the native layer
     * to provide the initial state of the application or any configuration, for example:
     *
     * ```json
     * {
     *   "stepDefinitions": {
     *     "systemSettings": {
     *       "rows": ["dock", "import", "default-browser"]
     *     }
     *   },
     *   "steps": ["welcome", "getStarted", "makeDefaultSingle", "systemSettings", "customize", "addressBarMode", "searchOrChat"],
     *   "locale": "en"
     * }
     * ```
     *
     * In that example, the native layer is providing the list of rows that should be shown in the
     * systemSettings step, overriding the default list provided in `data.js`.
     *
     * Clients that don't send `steps` can still send `exclude` to remove steps from the default order.
     * It's ignored when `steps` is present, and will be removed once every platform sends `steps`.
     *
     * @returns {Promise<import('../types/onboarding.ts').InitResponse>}
     */
    async init() {
        return await this.messaging.request('init');
    }

    /**
     * Sends a notification to the native layer that the user has completed a step
     *
     * @param {import('../types/onboarding.ts').StepCompleted} params
     */
    stepCompleted(params) {
        this.messaging.notify('stepCompleted', params);
    }

    /**
     * Sent when the user wants to enable or disable the bookmarks bar
     *
     * @param {import('../types/onboarding.ts').SystemValue} params
     */
    setBookmarksBar(params) {
        this.messaging.notify('setBookmarksBar', params);
    }

    /**
     * Sent when the user wants to enable or disable the session restore setting
     *
     * @param {import('../types/onboarding.ts').SystemValue} params
     */
    setSessionRestore(params) {
        this.messaging.notify('setSessionRestore', params);
    }

    /**
     * Sent when the user wants to enable or disable the home button
     * Note: Although the home button can placed in multiple places in the browser taskbar, this
     * application will only ever send enabled/disabled to the native layer
     *
     * @param {import('../types/onboarding.ts').SystemValue} params
     */
    setShowHomeButton(params) {
        this.messaging.notify('setShowHomeButton', params);
    }

    /**
     * Sent when the user wants to keep the application in the dock/taskbar.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<import('../types/onboarding.ts').RequestDockOptInRequest['result']>}
     */
    requestDockOptIn() {
        return this.messaging.request('requestDockOptIn');
    }

    /**
     * Sent when the user wants to import data. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<import('../types/onboarding.ts').SystemValue>}
     */
    requestImport() {
        return this.messaging.request('requestImport');
    }

    /**
     * Sent when the user wants to set DuckDuckGo as their default browser. The UI will remain
     * in a loading state until the native layer sends a response.
     *
     * Native side should respond when the operation is 'complete'.
     *
     * @returns {Promise<import('../types/onboarding.ts').RequestSetAsDefaultRequest['result']>}
     */
    requestSetAsDefault() {
        return this.messaging.request('requestSetAsDefault');
    }

    /**
     * Sent to allow native to fire a pixel for UI interactions.
     *
     * @param {import('../types/onboarding.ts').TelemetryEvent} event
     */
    telemetryEvent(event) {
        this.messaging.notify('telemetryEvent', event);
    }

    /**
     * Sent when onboarding is complete and the user has chosen to go to settings
     */
    dismissToSettings() {
        this.messaging.notify('dismissToSettings');
    }

    /**
     * Sent when the "Start Browsing" button has been clicked.
     */
    dismissToAddressBar() {
        this.messaging.notify('dismissToAddressBar');
    }

    /**
     * Sent instead of `dismissToAddressBar` when the user submits a search or a Duck.ai prompt
     * on the searchOrChat step. Native ends onboarding and opens the query in the Welcome tab.
     * @param {import('../types/onboarding.ts').SubmitQuery} params
     */
    submitQuery(params) {
        this.messaging.notify('submitQuery', params);
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {import('../types/onboarding.ts').ReportPageExceptionNotify} params
     */
    reportPageException(params) {
        this.messaging.notify('reportPageException', params);
    }

    /**
     * This will be sent if the application fails to load.
     * @param {import('../types/onboarding.ts').ReportInitExceptionNotify} params
     */
    reportInitException(params) {
        this.messaging.notify('reportInitException', params);
    }

    /**
     * Subscribe to config updates pushed by native (e.g. customize step rows).
     * @param {(data: import('../types/onboarding.ts').ConfigUpdate) => void} params
     * @returns {() => void}
     */
    onConfigUpdate(params) {
        return this.messaging.subscribe('onConfigUpdate', params);
    }

    /**
     * Sent when the user wants to enable or disable ad blocking.
     *
     * @param {import('../types/onboarding.ts').SystemValue} params
     */
    setAdBlocking(params) {
        this.messaging.notify('setAdBlocking', params);
    }

    /**
     * Sent when the user selects their Address Bar Mode preference -- Search only or Search & Duck.ai
     *
     * @param {import('../types/onboarding.ts').SystemValue} params
     */
    setDuckAiInAddressBar(params) {
        this.messaging.notify('setDuckAiInAddressBar', params);
    }

    /**
     * Sent when the user opts in to installing the Chrome search extension during onboarding.
     * The UI advances immediately without waiting for the install to complete.
     */
    requestChromeExtensionInstall() {
        this.messaging.notify('requestChromeExtensionInstall');
    }

    /**
     * Sends the selected Windows onboarding options to native.
     * @param {import('../types/onboarding.ts').OnboardingInstallOptions} params
     */
    setOnboardingInstallOptions(params) {
        this.messaging.notify('setOnboardingInstallOptions', params);
    }
}

const baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv(import.meta.env);

// share this in the app, it's an instance of `OnboardingPage` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: 'onboarding',
    mockTransport: () => {
        // only in integration environments
        if (baseEnvironment.injectName !== 'integration') return null;
        return mockTransport();
    },
});

const onboarding = new OnboardingPage(messaging, baseEnvironment.injectName);

window.addEventListener('error', (event) => {
    let message = 'unknown error';
    if (event.error?.message) {
        message = event.error.message;
    } else if (event.error) {
        message = String(event.error);
    } else if (event.message) {
        message = event.message;
    }
    onboarding.reportInitException({ message: `[uncaught] ${message}` });
});

window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason);
    onboarding.reportInitException({ message: `[unhandledrejection] ${message}` });
});

init(onboarding, baseEnvironment).catch((e) => {
    console.error(e);
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error';
    onboarding.reportInitException({ message: msg });
});
