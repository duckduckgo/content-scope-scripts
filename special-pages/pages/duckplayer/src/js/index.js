import { createTypedMessages } from '@duckduckgo/messaging'
import { Environment } from '../../../../shared/environment.js'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging.js'
import { init } from '../../app/index.js'
import { initStorage } from './storage.js'

export class DuckplayerPage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor (messaging, injectName) {
        this.messaging = createTypedMessages(this, messaging)
        this.injectName = injectName
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @returns {Promise<import("../../../../types/duckplayer").InitialSetupResponse>}
     */
    initialSetup () {
        if (this.injectName === 'integration') {
            return Promise.resolve({
                platform: { name: 'ios' },
                env: 'development',
                userValues: { privatePlayerMode: { alwaysAsk: {} }, overlayInteracted: false },
                settings: {
                    pip: {
                        state: 'enabled'
                    },
                    autoplay: {
                        state: 'enabled'
                    }
                },
                locale: 'en'
            })
        }
        return this.messaging.request('initialSetup')
    }

    /**
     * This is sent when the user wants to set Duck Player as the default.
     *
     * @param {import("../../../../types/duckplayer").UserValues} userValues
     */
    setUserValues (userValues) {
        return this.messaging.request('setUserValues', userValues)
    }

    /**
     * For platforms that require a message to open settings
     */
    openSettings () {
        return this.messaging.notify('openSettings')
    }

    /**
     * For platforms that require a message to open info modal
     */
    openInfo () {
        return this.messaging.notify('openInfo')
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
     * @param {(value: import("../../../../types/duckplayer").UserValues) => void} cb
     */
    onUserValuesChanged (cb) {
        return this.messaging.subscribe('onUserValuesChanged', cb)
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException (params) {
        this.messaging.notify('reportInitException', params)
    }
}

const baseEnvironment = new Environment()
    .withInjectName(document.documentElement.dataset.platform)
    .withEnv(import.meta.env)

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.injectName,
    env: baseEnvironment.env,
    pageName: 'duckPlayerPage'
})

const example = new DuckplayerPage(messaging, import.meta.injectName)

init(example, baseEnvironment).catch(e => {
    // messages.
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    example.reportInitException({ message: msg })
})

initStorage()
