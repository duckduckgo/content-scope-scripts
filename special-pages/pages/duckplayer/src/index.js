import { createTypedMessages } from '@duckduckgo/messaging';
import { Environment } from '../../../shared/environment.js';
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging.js';
import { init } from '../app/index.js';
import { initStorage } from './storage.js';
import '../../../shared/live-reload.js';
import {
    ReportMetric,
    EXCEPTION_KIND_GENERIC_ERROR,
    EXCEPTION_KIND_INITIAL_SETUP_ERROR,
    EXCEPTION_KIND_MESSAGING_ERROR,
} from '../../../shared/report-metric.js';

export class DuckplayerPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor(messaging, injectName) {
        this.messaging = createTypedMessages(this, messaging);
        this.injectName = injectName;
        this.metrics = new ReportMetric(messaging);
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @returns {Promise<import("../types/duckplayer.ts").InitialSetupResponse>}
     */
    async initialSetup() {
        if (this.injectName === 'integration') {
            return Promise.resolve({
                platform: { name: 'ios' },
                env: 'development',
                userValues: { privatePlayerMode: { alwaysAsk: {} }, overlayInteracted: false },
                settings: {
                    pip: {
                        state: 'enabled',
                    },
                    autoplay: {
                        state: 'enabled',
                    },
                },
                locale: 'en',
            });
        }
        try {
            return await this.messaging.request('initialSetup');
        } catch (e) {
            this.metrics.reportException({ message: e?.message, kind: EXCEPTION_KIND_INITIAL_SETUP_ERROR });
            throw e;
        }
    }

    /**
     * This is sent when the user wants to set Duck Player as the default.
     *
     * @param {import("../types/duckplayer.ts").UserValues} userValues
     */
    async setUserValues(userValues) {
        try {
            return await this.messaging.request('setUserValues', userValues);
        } catch (e) {
            this.metrics.reportException({ message: e?.message, kind: EXCEPTION_KIND_MESSAGING_ERROR });
            throw e;
        }
    }

    /**
     * For platforms that require a message to open settings
     */
    openSettings() {
        return this.messaging.notify('openSettings');
    }

    /**
     * For platforms that require a message to open info modal
     */
    openInfo() {
        return this.messaging.notify('openInfo');
    }

    /**
     * This is a subscription that we set up when the page loads.
     * We use this value to show/hide the checkboxes.
     *
     * **Integration NOTE**: Native platforms should always send this at least once on initial page load.
     *
     * - See {@link Messaging.SubscriptionEvent} for details on each value of this message
     *
     * ```json
     * // the payload that we receive should look like this
     * {
     *   "context": "specialPages",
     *   "featureName": "duckPlayerPage",
     *   "subscriptionName": "onUserValuesChanged",
     *   "params": {
     *     "overlayInteracted": false,
     *     "privatePlayerMode": {
     *       "enabled": {}
     *     }
     *   }
     * }
     * ```
     *
     * @param {(value: import("../types/duckplayer.ts").UserValues) => void} cb
     */
    onUserValuesChanged(cb) {
        return this.messaging.subscribe('onUserValuesChanged', cb);
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{error: import('../types/duckplayer.ts').YouTubeError}} params
     */
    reportYouTubeError(params) {
        this.messaging.notify('reportYouTubeError', params);
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
}

// TODO: Remove telemetry

/**
 * Events that occur in the client-side application
 */
export class Telemetry {
    /**
     * @internal
     */
    oneTimeEvents = new Set();
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor(messaging) {
        /**
         * @internal
         */
        this.messaging = messaging;
    }

    /**
     * @param {import('../types/duckplayer.ts').TelemetryEvent} event
     * @internal
     */
    _event(event) {
        this.messaging.notify('telemetryEvent', event);
    }

    /**
     * A landscape impression should only be sent once
     *
     * - Sends {@link "Duckplayer Messages".TelemetryEvent}
     * - With attributes: {@link "Duckplayer Messages".Impression}
     *
     * ```json
     * {
     *   "attributes": {
     *     "name": "impression",
     *     "value": "landscape-layout"
     *   }
     * }
     * ```
     */
    landscapeImpression() {
        if (this.oneTimeEvents.has('landscapeImpression')) return;
        this.oneTimeEvents.add('landscapeImpression');
        this._event({ attributes: { name: 'impression', value: 'landscape-layout' } });
    }
}

const baseEnvironment = new Environment().withInjectName(document.documentElement.dataset.platform).withEnv(import.meta.env);

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: 'duckPlayerPage',
});

const duckplayerPage = new DuckplayerPage(messaging, import.meta.injectName);
const telemetry = new Telemetry(messaging);

init(duckplayerPage, telemetry, baseEnvironment).catch((e) => {
    // messages.
    console.error(e);
    const message = typeof e?.message === 'string' ? e.message : 'unknown error';
    const kind = typeof e?.name === 'string' ? e.name : EXCEPTION_KIND_GENERIC_ERROR;
    duckplayerPage.metrics.reportException({ message, kind });

    // TODO: Remove this event once all native platforms are responding to 'reportMetric: exception'
    duckplayerPage.reportInitException({ message });
});

initStorage();
