import { createContext } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { flushSync } from 'preact/compat'

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'

/**
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

function getInstanceId () {
    return Symbol('instance-id')
}

/** @type {import("preact").Context<symbol>} */
export const InstanceIdContext = createContext(getInstanceId())

/**
 * @param {Favorite[]} favorites
 * @param {(list: Favorite[]) => void} setFavorites
 */
export function useGridState (favorites, setFavorites) {
    const instanceId = useContext(InstanceIdContext)
    useEffect(() => {
        return monitorForElements({
            canMonitor ({ source }) {
                return source.data.instanceId === instanceId
            },
            onDrop ({ source, location }) {
                const target = location.current.dropTargets[0]
                if (!target) {
                    return
                }
                const destinationSrc = target.data.url
                const startSrc = source.data.url

                if (typeof destinationSrc !== 'string') {
                    return
                }

                if (typeof startSrc !== 'string') {
                    return
                }

                const from = favorites.findIndex(item => item.data === startSrc)
                const to = favorites.findIndex(item => item.data === destinationSrc)

                const closestEdgeOfTarget = extractClosestEdge(target.data)

                if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
                    document.startViewTransition(() => {
                        flushSync(() => {
                            setFavorites(
                                reorderWithEdge({
                                    list: favorites,
                                    startIndex: from,
                                    indexOfTarget: to,
                                    closestEdgeOfTarget,
                                    axis: 'horizontal'
                                })
                            )
                        })
                    })
                } else {
                    setFavorites(
                        reorderWithEdge({
                            list: favorites,
                            startIndex: from,
                            indexOfTarget: to,
                            closestEdgeOfTarget,
                            axis: 'horizontal'
                        })
                    )
                }
            }
        })
    }, [instanceId, favorites])
}
