import { TestTransportConfig } from '@duckduckgo/messaging'

import { stats } from '../../app/privacy-stats/mocks/stats.js'

/**
 * @typedef {import('../../../../types/new-tab').StatsConfig} StatsConfig
 */

const VERSION_PREFIX = '__ntp_15__.'
const url = new URL(window.location.href)

export function mockTransport () {
    const channel = new BroadcastChannel('ntp')

    function broadcast (named) {
        setTimeout(() => {
            channel.postMessage({
                change: named
            })
        }, 100)
    }

    /**
     * @param {string} name
     * @return {any}
     */
    function read (name) {
        // console.log('*will* read from LS', name)
        try {
            const item = localStorage.getItem(VERSION_PREFIX + name)
            if (!item) return null
            // console.log('did read from LS', item)
            return JSON.parse(item)
        } catch (e) {
            console.error('Failed to parse initialSetup from localStorage', e)
            return null
        }
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} value
     */
    function write (name, value) {
        try {
            localStorage.setItem(VERSION_PREFIX + name, JSON.stringify(value))
            // console.log('✅ did write')
        } catch (e) {
            console.error('Failed to write', e)
        }
    }

    return new TestTransportConfig({
        notify (_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) })
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['notifications']} */
            const msg = /** @type {any} */(_msg)
            switch (msg.method) {
            case 'widgets_setConfig': {
                if (!msg.params) throw new Error('unreachable')
                write('widget_config', msg.params)
                broadcast('widget_config')
                return
            }
            case 'stats_setConfig': {
                if (!msg.params) throw new Error('unreachable')
                write('stats_config', msg.params)
                broadcast('stats_config')
                return
            }
            case 'rmf_primaryAction': {
                console.log('ignoring rmf_primaryAction', msg.params)
                return
            }
            default: {
                console.warn('unhandled notification', msg)
            }
            }
        },
        subscribe (_msg, cb) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) })
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */(_msg.subscriptionName)
            switch (sub) {
            case 'widgets_onConfigUpdated': {
                const controller = new AbortController()
                channel.addEventListener('message', (msg) => {
                    if (msg.data.change === 'widget_config') {
                        const values = read('widget_config')
                        if (values) {
                            cb(values)
                        }
                    }
                }, { signal: controller.signal })
                return () => controller.abort()
            }
            case 'stats_onConfigUpdate': {
                const controller = new AbortController()
                channel.addEventListener('message', (msg) => {
                    if (msg.data.change === 'stats_config') {
                        const values = read('stats_config')
                        if (values) {
                            cb(values)
                        }
                    }
                }, { signal: controller.signal })
                return () => controller.abort()
            }
            case 'rmf_onDataUpdate': {
                // const timeout = setTimeout(() => {
                //     /** @type {import('../../../../types/new-tab.js').SmallMessage} */
                //     const payload = {
                //         id: "id-1",
                //         messageType: "small",
                //         titleText: "Hello world",
                //         descriptionText: "My Description"
                //     }
                //     cb(payload)
                // }, 2000)
                // return () => clearTimeout(timeout)
                return () => { }
            }
            }
            return () => { }
        },
        // eslint-ignore-next-line require-await
        request (_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) })
            /** @type {import('../../../../types/new-tab.js').NewTabMessages['requests']} */
            const msg = /** @type {any} */(_msg)
            switch (msg.method) {
            case 'stats_getData': {
                return Promise.resolve(stats.few)
            }
            case 'stats_getConfig': {
                /** @type {StatsConfig} */
                const defaultConfig = { expansion: 'expanded', animation: { kind: 'auto-animate' } }
                const fromStorage = read('stats_config') || defaultConfig
                if (url.searchParams.get('animation') === 'none') {
                    fromStorage.animation = { kind: 'none' }
                }
                if (url.searchParams.get('animation') === 'view-transitions') {
                    fromStorage.animation = { kind: 'view-transitions' }
                }
                return Promise.resolve(fromStorage)
            }
            case 'rmf_getData': {
                /** @type {import('../../../../types/new-tab.js').RMFData} */
                const message = { content: undefined }

                /** @type {import('../../../../types/new-tab.js').RMFData} */
                if (url.searchParams.get('rmf') === 'big_single_action') {
                    message.content = {
                        id: 'id-1',
                        messageType: 'big_single_action',
                        titleText: 'Tell Us Your Thoughts on Privacy Pro',
                        descriptionText: 'Take our short anonymous survey and share your feedback.',
                        icon: 'Announce',
                        primaryActionText: 'Take Survey'
                    }
                }
                if (url.searchParams.get('rmf') === 'medium') {
                    message.content = {
                        messageType: 'medium',
                        icon: 'Announce',
                        id: 'id-2',
                        titleText: 'Hello Medium!',
                        descriptionText: 'Here is some mighty fine content'
                    }
                }

                return Promise.resolve(message)
            }
            case 'initialSetup': {
                const widgetsFromStorage = read('widgets') || [
                    { id: 'rmf' },
                    { id: 'favorites' },
                    { id: 'privacyStats' }
                ]

                const widgetConfigFromStorage = read('widget_config') || [
                    { id: 'favorites', visibility: 'visible' },
                    { id: 'privacyStats', visibility: 'visible' }
                ]

                /** @type {import('../../../../types/new-tab.js').InitialSetupResponse} */
                const initial = {
                    widgets: widgetsFromStorage,
                    widgetConfigs: widgetConfigFromStorage,
                    platform: { name: 'integration' },
                    env: 'development',
                    locale: 'en'
                }

                return Promise.resolve(initial)
            }
            default: {
                return Promise.reject(new Error('unhandled request' + msg))
            }
            }
        }
    })
}
