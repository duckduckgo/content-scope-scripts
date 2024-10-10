/**
 * @template Data, Config
 * @typedef {{ kind: 'initial-data'; data: Data, config: Config }
 *         | { kind: 'data'; data: Data }
 *         | { kind: 'config'; config: Config; animate: boolean }
 *         | { kind: 'load-initial'; }
 *         | { kind: 'error'; error: string }
 *         | { kind: 'did-exit'; }
 *         | { kind: 'did-enter'; }
 *         | { kind: 'clear'; }
 * } Events
 *
 */

/**
 * @typedef {'entering' | 'exiting' | 'entered'} Ui
 */

/**
 * @template Data, Config
 * @typedef {{status: 'idle'; data: null, config: null}
 *         | {status: 'pending-initial'; data: null, config: null}
 *         | {status: 'ready'; data: Data; config: Config, ui?: Ui}
 * } State
 */

import { useCallback, useEffect } from 'preact/hooks'
import { useEnv } from '../../../shared/components/EnvironmentProvider.js'

/**
 * @template D
 * @template {{expansion: import("../../../types/new-tab").Expansion}} C
 * @param {State<D, C>} state
 * @param {Events<D, C>} event
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
 * @template D,C
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<any>} params.dispatch
 * @param {import("preact").RefObject<{
 *   getInitial: () => Promise<{data: D, config: C}>;
 *   destroy: () => void;
 * }>} params.service
 */
export function useInitialData ({ dispatch, service }) {
    useEffect(() => {
        if (!service.current) return console.warn('missing service')
        const stats = service.current
        async function init () {
            const { config, data } = await stats.getInitial()
            if (data) {
                dispatch({ kind: 'initial-data', data, config })
            } else {
                dispatch({ kind: 'error', error: 'missing data from getInitial' })
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
 * Subscribe to data updates
 * @template Data
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<any>} params.dispatch
 * @param {import("preact").RefObject<{
 *     onData: (cb: (d: {data:Data})=>void) => () => void
 * }>} params.service
 */
export function useDataSubscription ({ dispatch, service }) {
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
 * @template Config
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<any>} params.dispatch
 * @param {import("preact").RefObject<{
 *    onConfig: (cb: (d: {data:Config, source: 'manual' | 'subscription'})=>void) => () => void;
 *    toggleExpansion: () => void;
 * }>} params.service
 */
export function useConfigSubscription ({ dispatch, service }) {
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
        const unsub2 = service.current.onConfig((data) => {
            const animate = !isReducedMotion && data.source === 'manual'
            if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
                document.startViewTransition(() => {
                    dispatch({ kind: 'config', config: data.data, animate: false })
                })
            } else {
                dispatch({ kind: 'config', config: data.data, animate })
            }
        })
        return () => {
            unsub2()
        }
    }, [service, isReducedMotion])

    return { toggle }
}
