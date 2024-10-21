import { h } from 'preact'
import cn from 'classnames'
import { useContext, useEffect, useRef, useState } from 'preact/hooks'
import { memo } from 'preact/compat'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import styles from './Favorites.module.css'
import { InstanceIdContext } from './FavouritesGrid.js'

/**
 * @typedef {{ type: 'idle' }
 *         | { type: 'dragging' }
 *         | { type: 'is-dragging-over'; closestEdge: null | import("@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge").Edge }
 * } DNDState
 *
 * @typedef {import('../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

/**
 * @param {object} props
 * @param {Favorite['data']} props.data
 * @param {Favorite['id']} props.id
 * @param {Favorite['title']} props.title
 * @param {Favorite['favicon']} props.favicon
 * @param {number} props.index
 * @param {boolean} props.visible
 */
export function Tile ({ data, visible, favicon, index, title, id }) {
    const { state, ref } = useTileState(data, id)

    return (
        <a
            class={styles.item}
            tabindex={0}
            role="button"
            href={data}
            data-id={id}
            data-index={index}
            data-edge={'closestEdge' in state && state.closestEdge}
            ref={ref}
        >
            <div class={cn(styles.icon, styles.draggable)}>
                {visible && <img src={favicon} loading="lazy" class={styles.favicon} alt={`favicon for ${title}`} />}
            </div>
            <div class={styles.text}>
                {title}
            </div>
            {state.type === 'is-dragging-over' && state.closestEdge
                ? (
                    <div class={styles.dropper} data-edge={state.closestEdge}></div>
                )
                : null}
        </a>
    )
}

/**
 * @param {string} url
 * @param {string} id
 * @return {{ ref: import("preact").Ref<HTMLAnchorElement>; state: DNDState }}
 */
function useTileState (url, id) {
    /** @type {import("preact").Ref<HTMLAnchorElement>} */
    const ref = useRef(null)
    const [state, setState] = useState(/** @type {DNDState} */({ type: 'idle' }))
    const instanceId = useContext(InstanceIdContext)

    useEffect(() => {
        const el = ref.current
        if (!el) throw new Error('unreachable')

        return combine(
            draggable({
                element: el,
                getInitialData: () => ({ type: 'grid-item', url, id, instanceId }),
                onDragStart: () => setState({ type: 'dragging' }),
                onDrop: () => setState({ type: 'idle' })
            }),
            dropTargetForElements({
                element: el,
                getData: ({ input }) => {
                    return attachClosestEdge({ url, id }, {
                        element: el,
                        input,
                        allowedEdges: ['left', 'right']
                    })
                },
                getIsSticky: () => true,
                canDrop: ({ source }) => {
                    return source.data.instanceId === instanceId &&
                        source.data.type === 'grid-item' &&
                        source.data.id !== id
                },
                onDragEnter: ({ self }) => {
                    const closestEdge = extractClosestEdge(self.data)
                    setState({ type: 'is-dragging-over', closestEdge })
                },
                onDrag ({ self }) {
                    const closestEdge = extractClosestEdge(self.data)
                    // Only need to update react state if nothing has changed.
                    // Prevents re-rendering.
                    setState((current) => {
                        if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
                            return current
                        }
                        return { type: 'is-dragging-over', closestEdge }
                    })
                },
                onDragLeave: () => setState({ type: 'idle' }),
                onDrop: () => setState({ type: 'idle' })
            })
        )
    }, [instanceId, url, id])

    return { ref, state }
}

export const TileMemo = memo(Tile)
