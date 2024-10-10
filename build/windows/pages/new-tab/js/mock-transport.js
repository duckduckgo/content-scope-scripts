import { TestTransportConfig } from '@duckduckgo/messaging'

import { stats } from '../../app/privacy-stats/mocks/stats.js'

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
        console.log('*will* read from LS', name)
        try {
            const item = localStorage.getItem(name)
            if (!item) return null
            console.log('did read from LS', item)
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
            localStorage.setItem(name, JSON.stringify(value))
            console.log('✅ did write')
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
                write('ntp.widget_config', msg.params)
                broadcast('ntp.widget_config')
                return
            }
            case 'stats_setConfig': {
                if (!msg.params) throw new Error('unreachable')
                write('ntp.stats_config', msg.params)
                broadcast('ntp.stats_config')
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
                    if (msg.data.change === 'ntp.widget_config') {
                        const values = read('ntp.widget_config')
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
                    if (msg.data.change === 'ntp.stats_config') {
                        const values = read('ntp.stats_config')
                        if (values) {
                            cb(values)
                        }
                    }
                }, { signal: controller.signal })
                return () => controller.abort()
            }
            }
            return () => {}
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
                const fromStorage = read('ntp.stats_config') || { expansion: 'expanded' }
                return Promise.resolve(fromStorage)
            }
            case 'initialSetup': {
                const widgetsFromStorage = read('ntp.widgets') || [
                    { id: 'favorites' },
                    { id: 'privacyStats' }
                ]

                const widgetConfigFromStorage = read('ntp.widget_config') || [
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
