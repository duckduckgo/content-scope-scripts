/**
 * @typedef {import("../../../../types/new-tab.js").WidgetConfig} WidgetConfig
 */

/**
 * The public API. Use this to subscribe to updates
 */
export class WidgetConfigAPI {
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {WidgetConfig} initialData - Initial widget configuration.
     */
    constructor (ntp, initialData) {
        this.ntp = ntp
        this.manager = new WidgetConfigManager(ntp, initialData)
    }

    /**
     * @param {(data: WidgetConfig) => void} cb
     * @return {() => void} - call this returned method to dispose of the subscription
     */
    onUpdate (cb) {
        const controller = new AbortController()
        this.manager.eventTarget.addEventListener(this.manager.DATA_CHANGE_EVT, (/** @type {CustomEvent<WidgetConfig>} */evt) => {
            cb(evt.detail)
        }, { signal: controller.signal })
        return () => controller.abort()
    }

    /**
     * @param {string} id
     */
    show (id) {
        const next = this.manager.inMemoryData.map(w => {
            if (w.id === id) return { ...w, visibility: /** @type {const} */('visible') }
            return w
        })
        this.manager.update(next)
    }

    /**
     * @param {string} id
     */
    hide (id) {
        const next = this.manager.inMemoryData.map(w => {
            if (w.id === id) return { ...w, visibility: /** @type {const} */('hidden') }
            return w
        })
        this.manager.update(next)
    }
}

class WidgetConfigManager {
    debounceTimer = null
    eventTarget = new EventTarget()
    DATA_CHANGE_EVT = 'dataChanged'
    DEBOUNCE_TIME_MS = 200
    /**
     * @param {import("../../src/js/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {WidgetConfig} initialData - Initial widget configuration.
     */
    constructor (ntp, initialData) {
        this.ntp = ntp
        this.inMemoryData = initialData

        // Set up the subscription data feed as a source
        this.setupSubscriptionStream()
    }

    /**
     * Sets up the subscription stream from the data feed, which behaves like an input source
     * that updates in-memory data but does not trigger persistence.
     */
    setupSubscriptionStream () {
        // this subscription lives for the lifespan of the page, so doesn't need cleanup logic
        this.ntp.messaging.subscribe('onWidgetConfigUpdated', (newData) => {
            this.updateInMemoryData(newData.widgetConfig, 'subscription')
        })
    }

    /**
     * Manually trigger an update, for example, from a UI element.
     * @param {WidgetConfig} newData - The new widget configuration to update.
     */
    update (newData) {
        this.updateInMemoryData(newData, 'manual')
    }

    /**
     * Updates the in-memory data and triggers persistence if the source is a manual update.
     * This method centralizes all state updates.
     * @param {WidgetConfig} newData - The new widget configuration to update in memory.
     * @param {'manual' | 'subscription'} source - The source of the update. Either 'subscription' or 'manual'.
     */
    updateInMemoryData (newData, source) {
        this.log(`Updating in-memory data from '${source}:'`, newData)
        this.inMemoryData = structuredClone(newData) // Create new immutable state
        this.broadcastChange()

        // If the source is 'manual', debounce the save operation
        if (source === 'manual') {
            this.clearDebounceTimer()
            this.debounceTimer = /** @type {any} */(setTimeout(() => {
                this.persist()
            }, this.DEBOUNCE_TIME_MS))
        }
    }

    /**
     * Clears the debounce timer if it exists, simulating the switchMap behavior.
     */
    clearDebounceTimer () {
        if (this.debounceTimer) {
            this.log('Clearing previous debounce timer.')
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }
    }

    /**
     * Broadcasts the current state to external subscribers using EventTarget.
     */
    broadcastChange () {
        this.log('Broadcasting change to external listeners:', this.inMemoryData)
        this.eventTarget.dispatchEvent(new CustomEvent(this.DATA_CHANGE_EVT, { detail: this.inMemoryData }))
    }

    /**
     * Persists the current in-memory widget configuration state to the internal data feed.
     */
    persist () {
        this.log('will persist data to backend:', this.inMemoryData)
        this.ntp.messaging.notify('setWidgetConfig', { widgetConfig: this.inMemoryData })
    }

    /**
     * Logs messages to the console for tracing internal state updates.
     * @param {string} message - The message to log.
     * @param {any} data - The associated data for the message.
     */
    log (message, data = null) {
        console.log(`[WidgetConfigManager] ${message}`, data)
    }
}
