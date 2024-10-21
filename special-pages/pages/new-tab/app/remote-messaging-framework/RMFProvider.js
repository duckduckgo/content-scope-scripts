import { createContext, h } from 'preact'
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks'
import { useMessaging } from '../types.js'
import { RMFService } from './rmf.service.js'
import { reducer, useConfigSubscription, useDataSubscription, useInitialData } from '../service.hooks.js'

/**
 * @typedef {import('../../../../types/new-tab.js').RMFData} RMFData
 * @typedef {import('../../../../types/new-tab.js').RMFConfig} RMFConfig
 * @typedef {import('../service.hooks.js').State<RMFData, RMFConfig>} State
 * @typedef {import('../service.hooks.js').Events<RMFData, RMFConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const RMFContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement')
    },
    /** @type {() => void} */
    onDismiss: () => {
        throw new Error('must implement')
    },
    /** @type {() => void} */
    primaryAction: () => {
        throw new Error('must implement')
    },
    /** @type {() => void} */
    secondaryAction: () => {
        throw new Error('must implement')
    }
})

export const RMFDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */({}))

/**
 * A data provider that will use `RMFService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function RMFProvider (props) {
    const initial = /** @type {State} */({
        status: 'idle',
        data: null,
        config: null
    })

    // const [state, dispatch] = useReducer(withLog('RMFProvider', reducer), initial)
    const [state, dispatch] = useReducer(reducer, initial)

    // create an instance of `RMFService` for the lifespan of this component.
    const service = useService()

    // get initial data
    useInitialData({ dispatch, service })

    // subscribe to data updates
    useDataSubscription({ dispatch, service })

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service })

    const onDismiss = useCallback(() => {
        console.log('onDismiss')
    }, [service]);

    const primaryAction = useCallback(() => {
        console.log('primaryAction')
    }, [service]);

    const secondaryAction = useCallback(() => {
        console.log('secondaryAction')
    }, [service]);

    console.log(state)

    return (
        <RMFContext.Provider value={{ state, toggle, onDismiss, primaryAction, secondaryAction }}>
            <RMFDispatchContext.Provider value={dispatch}>
                {props.children}
            </RMFDispatchContext.Provider>
        </RMFContext.Provider>
    )
}

/**
 * @return {import("preact").RefObject<RMFService>}
 */
export function useService () {
    const service = useRef(/** @type {RMFService|null} */(null))
    const ntp = useMessaging()
    useEffect(() => {
        const stats = new RMFService(ntp)
        service.current = stats
        return () => {
            stats.destroy()
        }
    }, [ntp])
    return service
}
