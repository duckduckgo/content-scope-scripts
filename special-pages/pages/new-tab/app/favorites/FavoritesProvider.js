import { createContext, h } from 'preact'
import { InstanceIdContext } from './FavouritesGrid.js'
import { useCallback, useEffect, useReducer, useRef, useState } from 'preact/hooks'
import { FavoritesService } from './favorites.service.js'
import { useMessaging } from '../types.js'
import { reducer, useConfigSubscription, useDataSubscription, useInitialData } from '../service.hooks.js'

/**
 * @typedef {import('../../../../types/new-tab.js').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab.js').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab.js').FavoritesConfig} FavoritesConfig
 * @typedef {import('../service.hooks.js').State<FavoritesData, FavoritesConfig>} State
 * @typedef {import('../service.hooks.js').Events<FavoritesData, FavoritesConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const FavoritesContext = createContext({
    /** @type {import('../service.hooks.js').State<FavoritesData, FavoritesConfig>} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement')
    },
    /** @type {(list: Favorite[], id: string, targetIndex: number) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    listDidReOrder: (list, id, targetIndex) => {
        throw new Error('must implement')
    },
    /** @type {(id: string) => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    openContextMenu: (id) => {
        throw new Error('must implement')
    },
    /** @type {() => void} */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    add: () => {
        throw new Error('must implement add')
    }
})

export const FavoritesDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */({}))

function getInstanceId () {
    return Symbol('instance-id')
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function FavoritesProvider ({ children }) {
    const initial = /** @type {State} */({
        status: /** @type {const} */('idle'),
        data: null,
        config: null
    })

    const [state, dispatch] = useReducer(reducer, initial)

    const [instanceId] = useState(getInstanceId)

    const service = useService()

    // get initial data
    useInitialData({ dispatch, service })

    // subscribe to data updates
    useDataSubscription({ dispatch, service })

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service })

    /** @type {(f: Favorite[], id: string, targetIndex: number) => void} */
    const listDidReOrder = useCallback((favorites, id, targetIndex) => {
        if (!service.current) return
        service.current.setFavoritesOrder({ favorites }, id, targetIndex)
    }, [service])

    /** @type {(id: string) => void} */
    const openContextMenu = useCallback((id) => {
        if (!service.current) return
        service.current.openContextMenu(id)
    }, [service])

    /** @type {() => void} */
    const add = useCallback(() => {
        if (!service.current) return
        service.current.add()
    }, [service])

    return (
        <InstanceIdContext.Provider value={instanceId}>
            <FavoritesContext.Provider value={{ state, toggle, listDidReOrder, openContextMenu, add }}>
                <FavoritesDispatchContext.Provider value={dispatch}>
                    {children}
                </FavoritesDispatchContext.Provider>
            </FavoritesContext.Provider>
        </InstanceIdContext.Provider>
    )
}

export function useService () {
    const service = useRef(/** @type {FavoritesService | null} */(null))
    const ntp = useMessaging()
    useEffect(() => {
        const stats = new FavoritesService(ntp)
        service.current = stats
        return () => {
            stats.destroy()
        }
    }, [ntp])
    return service
}
