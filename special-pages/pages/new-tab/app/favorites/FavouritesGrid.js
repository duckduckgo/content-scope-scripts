import { createContext } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import { flushSync } from 'preact/compat'

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge'
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index'

/**
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

function getInstanceId () {
    return Symbol('instance-id')
}

/** @type {import("preact").Context<symbol>} */
export const InstanceIdContext = createContext(getInstanceId())

/**
 * @param {Favorite[]} favorites
 * @param {import("preact").ComponentProps<import("./Favorites.js").Favorites>['listDidReOrder']} setFavorites
 * @param {Animation['kind']} animation
 */
export function useGridState (favorites, setFavorites, animation) {
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
                const startId = source.data.id

                if (typeof startId !== 'string') {
                    return console.warn('could not access the id')
                }

                if (typeof destinationSrc !== 'string') {
                    return console.warn('could not access the destinationSrc')
                }

                if (typeof startSrc !== 'string') {
                    return console.warn('could not access the startSrc')
                }

                const startIndex = favorites.findIndex(item => item.data === startSrc)
                const indexOfTarget = favorites.findIndex(item => item.data === destinationSrc)

                const closestEdgeOfTarget = extractClosestEdge(target.data)

                // where should the element be inserted?
                // we only use this value to send to the native side
                const targetIndex = getReorderDestinationIndex({
                    closestEdgeOfTarget,
                    startIndex,
                    indexOfTarget,
                    axis: 'horizontal'
                })

                // reorder the list using the helper from the dnd lib
                const reorderedList = reorderWithEdge({
                    list: favorites,
                    startIndex,
                    indexOfTarget,
                    closestEdgeOfTarget,
                    axis: 'horizontal'
                })

                flushSync(() => {
                    try {
                        setFavorites(reorderedList, startId, targetIndex)
                    } catch (e) {
                        console.error('did catch', e)
                    }
                })

                const htmlElem = source.element

                const pulseAnimation = htmlElem.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.1)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 500, // duration in milliseconds
                    iterations: 1, // run the animation once
                    easing: 'ease-in-out' // easing function
                })

                pulseAnimation.onfinish = () => {
                    // additional actions can be placed here or handle the end of the animation if needed
                }
            }
        })
    }, [instanceId, favorites, animation])
}
