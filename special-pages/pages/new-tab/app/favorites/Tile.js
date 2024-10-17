import { Fragment, h } from 'preact'
import cn from 'classnames'
import { useContext, useEffect, useRef, useState } from 'preact/hooks'
import { createPortal, memo } from 'preact/compat'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import styles from './Favorites.module.css'
import { InstanceIdContext } from './FavouritesGrid.js'

/**
 * @typedef {{ type: 'idle' }
 *         | { type: 'dragging' }
 *         | { type: 'preview'; container: HTMLElement }
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
 * @param {string} props.prefix - unique id for the parent
 */
export function Tile ({ data, favicon, title, id, prefix }) {
    const { state, ref } = useTileState(data, id)

    return (
        <Fragment>
            <div
                data-item-state={state.type}
                data-id={id}
                data-edge={'closestEdge' in state && state.closestEdge}
                class={styles.item}
                ref={ref}
                style={{ viewTransitionName: prefix + id }}
            >
                <div class={cn(styles.icon, styles.draggable)}>
                    {/* <span class={styles.favicon} style={{backgroundColor: favicon}}/> */}
                    <span class={styles.favicon} style={{ backgroundImage: `url(${favicon})` }}/>
                </div>
                <div class={styles.text}>
                    {title}
                </div>
                {state.type === 'is-dragging-over' && state.closestEdge
                    ? (
                        <div class={styles.dropper} data-edge={state.closestEdge}></div>
                    )
                    : null}
            </div>
            {state.type === 'preview' && state.container
                ? createPortal(<DragPreview data={data} title={title}/>, state.container)
                : null
            }
        </Fragment>
    )
}

/**
 * @param {string} url
 * @param {string} id
 * @return {{ ref: import("preact").Ref<HTMLDivElement>; state: DNDState }}
 */
function useTileState (url, id) {
    /** @type {import("preact").Ref<HTMLDivElement>} */
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

/**
 * @param {object} props
 * @param {string} props.data
 * @param {string} props.title
 */
function DragPreview ({ data, title }) {
    return <div class={styles.preview}>
        <p>{title}</p>
        <p>{data}</p>
    </div>
}
