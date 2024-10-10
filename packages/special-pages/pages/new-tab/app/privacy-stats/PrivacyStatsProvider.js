import { createContext, h } from 'preact'
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks'
import { useMessaging } from '../types.js'
import { PrivacyStatsService } from './privacy-stats.service.js'
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js'
import { log } from '../utils.js'

/**
 * A data provider that will use `PrivacyStatsService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function PrivacyStatsProvider (props) {
    const [state, dispatch] = useReducer((state, event) => log('PrivacyStatsProvider', state, event, reducer), {
        status: /** @type {const} */('idle'),
        data: null,
        config: null
    })

    // create an instance of `PrivacyStatsService` for the lifespan of this component.
    const service = useService()

    // get initial data
    useInitialData({ dispatch, service })

    // subscribe to data updates
    useDataSubscription({ dispatch, service })

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service })

    return (
        <PrivacyStatsContext.Provider value={{ state, toggle }}>
            <PrivacyStatsDispatchContext.Provider value={dispatch}>
                {props.children}
            </PrivacyStatsDispatchContext.Provider>
        </PrivacyStatsContext.Provider>
    )
}

/**
 * @typedef {import('../../../../types/new-tab.js').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../../types/new-tab.js').StatsConfig} StatsConfig
 * @typedef {'entering' | 'exiting' | 'entered'} Ui
 *
 * @typedef {{ kind: 'initial-data'; data: PrivacyStatsData, config: StatsConfig }
 *         | { kind: 'data'; data: PrivacyStatsData }
 *         | { kind: 'config'; config: StatsConfig; animate: boolean }
 *         | { kind: 'load-initial'; }
 *         | { kind: 'error'; error: string }
 *         | { kind: 'did-exit'; }
 *         | { kind: 'did-enter'; }
 *         | { kind: 'clear'; }
 * } Events
 * @typedef {{status: 'idle'; data: null, config: null}
 *         | {status: 'pending-initial'; data: null, config: null}
 *         | {status: 'ready'; data: PrivacyStatsData; config: StatsConfig, ui?: Ui}
 * } State
 */

/**
 * These are the values exposed to consumers.
 */
export const PrivacyStatsContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement')
    }
})

export const PrivacyStatsDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */({}))

/**
 * @param {State} state
 * @param {Events} event
 */
export function reducer (state, event) {
    switch (state.status) {
    case 'idle': {
        switch (event.kind) {
        case 'load-initial': {
            return { ...state, status: /** @type {const} */('pending-initial') }
        }
        default:
            return state
        }
    }
    case 'pending-initial': {
        switch (event.kind) {
        case 'initial-data': {
            return {
                ...state,
                status: /** @type {const} */('ready'),
                data: event.data,
                config: event.config
            }
        }
        case 'error': {
            console.error('error with initial data', event.error)
            return state
        }
        default:
            return state
        }
    }
    case 'ready': {
        switch (event.kind) {
        case 'config': {
            /**
             * When `config` was updated, we need to check if it was to 'expand' an item.
             * If it was to 'expand', we want an intermediate 'entering' state to allow
             * a nice fade-in animation.
             *
             * Likewise when collapsing, we want to ensure we first go into an 'exiting' state.
             * This stuff is (p)react-specific, which is why the logic lives here and not the service.
             */
            if (event.config.expansion === 'expanded') {
                const ui = event.animate === true ? /** @type {const} */('entering') : undefined
                return { ...state, config: event.config, ui }
            } else {
                const ui = event.animate === true ? /** @type {const} */('exiting') : undefined
                return { ...state, config: event.config, ui }
            }
        }
        case 'data': {
            return { ...state, data: event.data }
        }
        case 'did-exit': {
            return { ...state, ui: undefined }
        }
        case 'did-enter': {
            return { ...state, ui: /** @type {const} */('entered') }
        }
        case 'clear': {
            return { ...state, effect: null }
        }
        default:
            return state
        }
    }
    default:
        return state
    }
}

/**
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<Events>} params.dispatch
 * @param {import("preact").RefObject<PrivacyStatsService>} params.service
 */
function useInitialData ({ dispatch, service }) {
    useEffect(() => {
        if (!service.current) return console.warn('missing service')
        const stats = service.current
        async function init () {
            const { config, data } = await stats.getInitial()
            if (data) {
                dispatch({ kind: 'initial-data', data, config })
            } else {
                dispatch({ kind: 'error', error: 'missing data from getPrivacyStats' })
            }
        }

        dispatch({ kind: 'load-initial' })

        // eslint-disable-next-line promise/prefer-await-to-then
        init().catch((e) => {
            console.error('uncaught error', e)
            dispatch({ kind: 'error', error: e })
        })

        return () => {
            stats.destroy()
        }
    }, [])
}

/**
 * @return {import("preact").RefObject<PrivacyStatsService>}
 */
function useService () {
    const service = useRef(/** @type {PrivacyStatsService|null} */(null))
    const ntp = useMessaging()
    useEffect(() => {
        const stats = new PrivacyStatsService(ntp)
        service.current = stats
        return () => {
            stats.destroy()
        }
    }, [ntp])
    return service
}

/**
 * Subscribe to data updates
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<Events>} params.dispatch
 * @param {import("preact").RefObject<PrivacyStatsService>} params.service
 */
function useDataSubscription ({ dispatch, service }) {
    useEffect(() => {
        if (!service.current) return console.warn('could not access service')
        const unsub = service.current.onData((evt) => {
            dispatch({ kind: 'data', data: evt.data })
        })
        return () => {
            unsub()
        }
    }, [service, dispatch])
}

/**
 * Subscribe to config updates + provide a method for toggling visibility
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<Events>} params.dispatch
 * @param {import("preact").RefObject<PrivacyStatsService>} params.service
 */
function useConfigSubscription ({ dispatch, service }) {
    const { isReducedMotion } = useEnv()

    /**
     * Consumers can call 'toggle' and the in-memory data will be updated in the service
     * The result of that toggle will be broadcasts immediately, allowing real-time (optimistic) UI updates
     */
    const toggle = useCallback(() => {
        service.current?.toggleExpansion()
    }, [service, dispatch])

    useEffect(() => {
        if (!service.current) return console.warn('could not access service')
        const unsub = service.current.onConfig((data) => {
            const animate = !isReducedMotion && data.source === 'manual'
            dispatch({ kind: 'config', config: data.data, animate })
        })
        return () => {
            unsub()
        }
    }, [service, isReducedMotion])

    return { toggle }
}
