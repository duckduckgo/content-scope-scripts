import { createContext, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { StockService } from '../stock.service.js';

/**
 * @typedef {import('../../../types/new-tab.js').StockData} StockData
 */

/**
 * @typedef {{ kind: 'initial-data'; data: StockData }
 *         | { kind: 'data'; data: StockData }
 *         | { kind: 'load-initial'; }
 *         | { kind: 'error'; error: string }
 * } StockEvents
 */

/**
 * @typedef {{status: 'idle'; data: null}
 *         | {status: 'pending-initial'; data: null}
 *         | {status: 'ready'; data: StockData}
 * } StockState
 */

/**
 * @param {StockState} state
 * @param {StockEvents} event
 * @returns {StockState}
 */
function stockReducer(state, event) {
    switch (state.status) {
        case 'idle': {
            switch (event.kind) {
                case 'load-initial': {
                    return { ...state, status: /** @type {const} */ ('pending-initial') };
                }
                default:
                    return state;
            }
        }
        case 'pending-initial': {
            switch (event.kind) {
                case 'initial-data': {
                    return {
                        ...state,
                        status: /** @type {const} */ ('ready'),
                        data: event.data,
                    };
                }
                case 'error': {
                    console.error('error with initial stock data', event.error);
                    return state;
                }
                default:
                    return state;
            }
        }
        case 'ready': {
            switch (event.kind) {
                case 'data': {
                    return { ...state, data: event.data };
                }
                default:
                    return state;
            }
        }
        default:
            return state;
    }
}

/**
 * These are the values exposed to consumers.
 */
export const StockContext = createContext({
    /** @type {StockState} */
    state: { status: 'idle', data: null },
    /** @type {string | undefined} */
    instanceId: undefined,
    /** @type {() => Promise<void>} */
    refetch: async () => {},
});

/**
 * A data provider that will use `StockService` to fetch initial data
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {string} [props.instanceId]
 */
export function StockProvider(props) {
    const initial = /** @type {StockState} */ ({
        status: /** @type {const} */ ('idle'),
        data: null,
    });

    const [state, dispatch] = useReducer(stockReducer, initial);

    // create an instance of `StockService` for the lifespan of this component.
    const service = useService(props.instanceId);

    // get initial data
    useInitialStockData({ dispatch, service, instanceId: props.instanceId });

    // subscribe to data updates
    useStockDataSubscription({ dispatch, service, instanceId: props.instanceId });

    const refetch = async () => {
        if (!service.current) return;
        const { data } = await service.current.getInitial();
        if (data) {
            dispatch({ kind: 'data', data });
        }
    };

    return <StockContext.Provider value={{ state, instanceId: props.instanceId, refetch }}>{props.children}</StockContext.Provider>;
}

/**
 * @param {string} [instanceId]
 * @return {import("preact").RefObject<StockService>}
 */
export function useService(instanceId) {
    const service = useRef(/** @type {StockService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stockService = new StockService(ntp, instanceId);
        service.current = stockService;
        return () => {
            stockService.destroy();
        };
    }, [ntp, instanceId]);
    return service;
}

/**
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<StockEvents>} params.dispatch
 * @param {import("preact").RefObject<StockService>} params.service
 * @param {string} [params.instanceId]
 */
function useInitialStockData({ dispatch, service, instanceId }) {
    const messaging = useMessaging();
    useEffect(() => {
        if (!service.current) return console.warn('missing stock service');
        const currentService = service.current;
        async function init() {
            const { data } = await currentService.getInitial();
            if (data) {
                dispatch({ kind: 'initial-data', data });
            } else {
                dispatch({ kind: 'error', error: 'missing data from getInitial' });
            }
        }

        dispatch({ kind: 'load-initial' });

        // eslint-disable-next-line promise/prefer-await-to-then
        init().catch((e) => {
            console.error('uncaught error', e);
            dispatch({ kind: 'error', error: e });
            messaging.reportPageException({ message: `${currentService.name()}: failed to fetch initial data: ` + e.message });
        });

        return () => {
            currentService.destroy();
        };
    }, [messaging, instanceId]);
}

/**
 * Subscribe to stock data updates
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<StockEvents>} params.dispatch
 * @param {import("preact").RefObject<StockService>} params.service
 * @param {string} [params.instanceId]
 */
function useStockDataSubscription({ dispatch, service, instanceId }) {
    useEffect(() => {
        if (!service.current) return console.warn('could not access stock service');

        const unsub = service.current.onData((evt) => {
            // Filter by instanceId if present
            if (instanceId && evt.data.instanceId && evt.data.instanceId !== instanceId) {
                return;
            }
            dispatch({ kind: 'data', data: evt.data });
        });
        return () => {
            unsub();
        };
    }, [service, dispatch, instanceId]);
}
