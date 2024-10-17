import { TestTransportConfig } from '@duckduckgo/messaging'

import { stats } from '../../app/privacy-stats/mocks/stats.js'
import { favorites } from '../../app/favorites/mocks/favorites.data.js'

/**
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 * @typedef {import('../../../../types/new-tab').StatsConfig} StatsConfig
 */

const VERSION_PREFIX = '__ntp_16__.'
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { animation, ...rest } = msg.params
                write('stats_config', rest)
                broadcast('stats_config')
                return
            }
            case 'favorites_setConfig': {
                if (!msg.params) throw new Error('unreachable')
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { animation, ...rest } = msg.params
                write('favorites_config', rest)
                broadcast('favorites_config')
                return
            }
            case 'favorites_move': {
                if (!msg.params) throw new Error('unreachable')
                const { id, targetIndex } = msg.params
                const data = read('favorites_data')

                const favorites = reorderArray(data.favorites, id, targetIndex)

                write('favorites_data', { favorites })
                broadcast('favorites_data')
                return
            }
            case 'favorites_openContextMenu': {
                if (!msg.params) throw new Error('unreachable')
                console.log('mock: ignoring favorites_openContextMenu', msg.params)
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
            case 'favorites_onDataUpdate': {
                const controller = new AbortController()
                channel.addEventListener('message', (msg) => {
                    if (msg.data.change === 'favorites_data') {
                        const values = read('favorites_data')
                        if (values) {
                            cb(values)
                            cb(values)
                        }
                    }
                }, { signal: controller.signal })
                return () => controller.abort()
            }
            case 'favorites_onConfigUpdate': {
                const controller = new AbortController()
                channel.addEventListener('message', (msg) => {
                    if (msg.data.change === 'favorites_config') {
                        const values = read('favorites_config')
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
                /** @type {StatsConfig} */
                const defaultConfig = { expansion: 'expanded', animation: { kind: 'view-transitions' } }
                const fromStorage = read('stats_config') || defaultConfig
                if (url.searchParams.get('animation') === 'none') {
                    fromStorage.animation = { kind: 'none' }
                } else {
                    fromStorage.animation = { kind: 'view-transitions' }
                }
                return Promise.resolve(fromStorage)
            }
            case 'favorites_getData': {
                const fromStorage = read('favorites_data')
                if (!fromStorage) {
                    write('favorites_data', favorites.many)
                    return Promise.resolve(favorites.many)
                }
                return Promise.resolve(fromStorage)
            }
            case 'favorites_getConfig': {
                /** @type {FavoritesConfig} */
                const defaultConfig = { expansion: 'expanded', animation: { kind: 'view-transitions' } }
                const fromStorage = read('favorites_config') || defaultConfig
                if (url.searchParams.get('animation') === 'none') {
                    fromStorage.animation = { kind: 'none' }
                } else {
                    fromStorage.animation = { kind: 'view-transitions' }
                }
                return Promise.resolve(fromStorage)
            }
            case 'initialSetup': {
                const widgetsFromStorage = read('widgets') || [
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

/**
 * @template {{id: string}} T
 * @param {T[]} array
 * @param {string} id
 * @param {number} toIndex
 * @return {T[]}
 */
function reorderArray (array, id, toIndex) {
    const fromIndex = array.findIndex(item => item.id === id)
    const element = array.splice(fromIndex, 1)[0] // Remove the element from the original position
    array.splice(toIndex, 0, element) // Insert the element at the new position
    return array
}
