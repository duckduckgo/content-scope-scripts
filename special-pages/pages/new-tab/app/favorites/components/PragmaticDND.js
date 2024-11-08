import { h, createContext } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { flushSync } from 'preact/compat';

import { monitorForElements, draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge, attachClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import { monitorForExternal, dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { getHTML } from '@atlaskit/pragmatic-drag-and-drop/external/html';
import { DDG_MIME_TYPE } from '../constants.js';

/** @type {import("preact").Context<symbol>} */
const InstanceIdContext = createContext(getInstanceId());

/**
 * Entry point for Pragmatic DND
 * https://github.com/atlassian/pragmatic-drag-and-drop
 *
 * Wrap your list in this, and then `useItemState` on your individual items
 *
 * @template {{id: string, url: string}} T
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {T[]} props.items
 * @param {(list: T[], id: string, index: number) => void} props.itemsDidReOrder
 */
export function PragmaticDND({ children, items, itemsDidReOrder }) {
    /**
     * Unique id for this instance
     */
    const [instanceId] = useState(getInstanceId);

    /**
     * Register the event handlers for drag-n-drop
     */
    useGridState(items, itemsDidReOrder, instanceId);

    return <InstanceIdContext.Provider value={instanceId}>{children}</InstanceIdContext.Provider>;
}

/**
 * @template {{id: string; url: string}} T
 * @param {T[]} favorites
 * @param {(items: T[], id: string, target: number) => void} itemsDidReOrder
 * @param {symbol} instanceId
 */
function useGridState(favorites, itemsDidReOrder, instanceId) {
    useEffect(() => {
        return combine(
            monitorForExternal({
                onDrop(payload) {
                    // const data = '<meta name="application/vnd.duckduckgo.bookmark-by-id" content="3" />';
                    const data = getHTML(payload);
                    if (!data) return console.warn('missing text/html payload');

                    // Create a document fragment using the safer createContextualFragment
                    const fragment = document.createRange().createContextualFragment(data);

                    // Get the first element
                    const node = fragment.firstElementChild;
                    if (!node) return console.warn('missing first element');

                    // check the name attribute
                    if (node.getAttribute('name') !== DDG_MIME_TYPE) return console.warn(`attribute name was not ${DDG_MIME_TYPE}`);

                    // check the id
                    const id = node.getAttribute('content');
                    if (!id) return console.warn('id missing from `content` attribute');

                    const location = payload.location;
                    const target = location.current.dropTargets[0];

                    if (!target || !target.data || typeof target.data.url !== 'string') {
                        return console.warn('missing data from target');
                    }

                    const closestEdgeOfTarget = extractClosestEdge(target.data);
                    const destinationSrc = target.data.url;
                    let indexOfTarget = favorites.findIndex((item) => item.url === destinationSrc);
                    if (indexOfTarget === -1 && destinationSrc.includes('PLACEHOLDER-URL')) {
                        indexOfTarget = favorites.length;
                    }
                    const targetIndex = getReorderDestinationIndex({
                        closestEdgeOfTarget,
                        startIndex: favorites.length,
                        indexOfTarget,
                        axis: 'horizontal',
                    });

                    itemsDidReOrder(favorites, id, targetIndex);
                },
            }),
            monitorForElements({
                canMonitor({ source }) {
                    return source.data.instanceId === instanceId;
                },
                onDrop({ source, location }) {
                    const target = location.current.dropTargets[0];
                    if (!target) {
                        return;
                    }

                    const destinationSrc = target.data.url;
                    const startSrc = source.data.url;
                    const startId = source.data.id;

                    if (typeof startId !== 'string') {
                        return console.warn('could not access the id');
                    }

                    if (typeof destinationSrc !== 'string') {
                        return console.warn('could not access the destinationSrc');
                    }

                    if (typeof startSrc !== 'string') {
                        return console.warn('could not access the startSrc');
                    }

                    const startIndex = favorites.findIndex((item) => item.url === startSrc);
                    let indexOfTarget = favorites.findIndex((item) => item.url === destinationSrc);

                    if (indexOfTarget === -1 && destinationSrc.includes('PLACEHOLDER-URL')) {
                        indexOfTarget = favorites.length;
                    }

                    const closestEdgeOfTarget = extractClosestEdge(target.data);

                    // where should the element be inserted?
                    // we only use this value to send to the native side
                    const targetIndex = getReorderDestinationIndex({
                        closestEdgeOfTarget,
                        startIndex,
                        indexOfTarget,
                        axis: 'horizontal',
                    });

                    // reorder the list using the helper from the dnd lib
                    const reorderedList = reorderWithEdge({
                        list: favorites,
                        startIndex,
                        indexOfTarget,
                        closestEdgeOfTarget,
                        axis: 'horizontal',
                    });

                    flushSync(() => {
                        try {
                            itemsDidReOrder(reorderedList, startId, targetIndex);
                        } catch (e) {
                            console.error('did catch', e);
                        }
                    });

                    const htmlElem = source.element;

                    const pulseAnimation = htmlElem.animate(
                        [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
                        {
                            duration: 500, // duration in milliseconds
                            iterations: 1, // run the animation once
                            easing: 'ease-in-out', // easing function
                        },
                    );

                    pulseAnimation.onfinish = () => {
                        // additional actions can be placed here or handle the end of the animation if needed
                    };
                },
            }),
        );
    }, [instanceId, favorites]);
}

/**
 * @typedef {{ type: 'idle' }
 *         | { type: 'dragging' }
 *         | { type: 'is-dragging-over'; closestEdge: null | import("@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge").Edge }
 * } DNDState
 */

/**
 * @param {string} url
 * @param {string} id
 * @return {{ ref: import("preact").RefObject<any>; state: DNDState }}
 */
export function useItemState(url, id) {
    const instanceId = useContext(InstanceIdContext);
    /** @type {import("preact").Ref<HTMLAnchorElement>} */
    const ref = useRef(null);
    const [state, setState] = useState(/** @type {DNDState} */ ({ type: 'idle' }));

    useEffect(() => {
        const el = ref.current;
        if (!el) throw new Error('unreachable');

        return combine(
            draggable({
                element: el,
                getInitialData: () => ({ type: 'grid-item', url, id, instanceId }),
                getInitialDataForExternal: () => ({
                    'text/plain': url,
                    [DDG_MIME_TYPE]: id,
                }),
                onDragStart: () => setState({ type: 'dragging' }),
                onDrop: () => setState({ type: 'idle' }),
            }),
            dropTargetForExternal({
                element: el,
                canDrop: ({ source }) => {
                    return source.types.some((type) => type === 'text/html');
                },
                getData: ({ input }) => {
                    return attachClosestEdge(
                        { url, id },
                        {
                            element: el,
                            input,
                            allowedEdges: ['left', 'right'],
                        },
                    );
                },
                onDrop: () => {
                    setState({ type: 'idle' });
                },
                onDragLeave: () => setState({ type: 'idle' }),
                onDrag: ({ self }) => {
                    const closestEdge = extractClosestEdge(self.data);
                    // Only need to update react state if nothing has changed.
                    // Prevents re-rendering.
                    setState((current) => {
                        if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
                            return current;
                        }
                        return { type: 'is-dragging-over', closestEdge };
                    });
                },
            }),
            dropTargetForElements({
                element: el,
                getData: ({ input }) => {
                    return attachClosestEdge(
                        { url, id },
                        {
                            element: el,
                            input,
                            allowedEdges: ['left', 'right'],
                        },
                    );
                },
                getIsSticky: () => true,
                canDrop: ({ source }) => {
                    return source.data.instanceId === instanceId && source.data.type === 'grid-item' && source.data.id !== id;
                },
                onDragEnter: ({ self }) => {
                    const closestEdge = extractClosestEdge(self.data);
                    setState({ type: 'is-dragging-over', closestEdge });
                },
                onDrag({ self }) {
                    const closestEdge = extractClosestEdge(self.data);
                    // Only need to update react state if nothing has changed.
                    // Prevents re-rendering.
                    setState((current) => {
                        if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
                            return current;
                        }
                        return { type: 'is-dragging-over', closestEdge };
                    });
                },
                onDragLeave: () => setState({ type: 'idle' }),
                onDrop: () => setState({ type: 'idle' }),
            }),
        );
    }, [instanceId, url, id]);

    return { ref, state };
}

function getInstanceId() {
    return Symbol('instance-id');
}
