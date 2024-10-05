import { h } from 'preact'
import { InstanceIdContext } from '../FavouritesGrid.js'
import { FavoritesContext, FavoritesDispatchContext } from '../FavoritesProvider.js'
import { useCallback, useReducer, useState } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js'
import { favorites } from './favorites.data.js'
import { reducer } from '../../service.hooks.js'

/**
 * @typedef {import('../../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 * @typedef {import('../../service.hooks.js').State<FavoritesData, FavoritesConfig>} State
 * @typedef {import('../../service.hooks.js').Events<FavoritesData, FavoritesConfig>} Events
 */

function getInstanceId () {
    return Symbol('instance-id')
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {FavoritesData} [props.data]
 * @param {FavoritesConfig} [props.config]
 */
export function MockFavoritesProvider ({ data = favorites.many, config = { expansion: 'expanded' }, children }) {
    const { isReducedMotion } = useEnv()

    const [instanceId] = useState(getInstanceId)

    const initial = /** @type {State} */({
        status: 'ready',
        data,
        config
    })

    const [state, dispatch] = useReducer(reducer, initial)

    const toggle = useCallback(() => {
        if (state.status !== 'ready') return
        if (state.config.expansion === 'expanded') {
            dispatch({ kind: 'config', config: { expansion: 'collapsed' }, animate: !isReducedMotion })
        } else {
            dispatch({ kind: 'config', config: { expansion: 'expanded' }, animate: !isReducedMotion })
        }
    }, [state.status, state.config?.expansion, isReducedMotion])

    const listDidReOrder = useCallback((/** @type {Favorite[]} */newList) => {
        dispatch({ kind: 'data', data: { favorites: newList } })
    }, [])

    return (
        <InstanceIdContext.Provider value={instanceId}>
            <FavoritesContext.Provider value={{ state, toggle, listDidReOrder }}>
                <FavoritesDispatchContext.Provider value={dispatch}>
                    {children}
                </FavoritesDispatchContext.Provider>
            </FavoritesContext.Provider>
        </InstanceIdContext.Provider>
    )
}
