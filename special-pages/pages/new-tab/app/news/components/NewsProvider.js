import { createContext, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { NewsService } from '../news.service.js';

/**
 * @typedef {import('../../../types/new-tab.js').NewsData} NewsData
 */

/**
 * @typedef {{ kind: 'initial-data'; data: NewsData }
 *         | { kind: 'data'; data: NewsData }
 *         | { kind: 'load-initial'; }
 *         | { kind: 'error'; error: string }
 * } NewsEvents
 */

/**
 * @typedef {{status: 'idle'; data: null}
 *         | {status: 'pending-initial'; data: null}
 *         | {status: 'ready'; data: NewsData}
 * } NewsState
 */

/**
 * @param {NewsState} state
 * @param {NewsEvents} event
 * @returns {NewsState}
 */
function newsReducer(state, event) {
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
                    console.error('error with initial news data', event.error);
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
export const NewsContext = createContext({
    /** @type {NewsState} */
    state: { status: 'idle', data: null },
    /** @type {string | undefined} */
    instanceId: undefined,
    /** @type {() => void} */
    openSetQueryDialog: () => {},
});

/**
 * A data provider that will use `NewsService` to fetch initial data
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {string} [props.instanceId]
 */
export function NewsProvider(props) {
    const initial = /** @type {NewsState} */ ({
        status: /** @type {const} */ ('idle'),
        data: null,
    });

    const [state, dispatch] = useReducer(newsReducer, initial);

    // create an instance of `NewsService` for the lifespan of this component.
    const service = useService(props.instanceId);

    // get initial data
    useInitialNewsData({ dispatch, service, instanceId: props.instanceId });

    // subscribe to data updates
    useNewsDataSubscription({ dispatch, service, instanceId: props.instanceId });

    const openSetQueryDialog = () => {
        service.current?.openSetQueryDialog();
    };

    return (
        <NewsContext.Provider value={{ state, instanceId: props.instanceId, openSetQueryDialog }}>{props.children}</NewsContext.Provider>
    );
}

/**
 * @param {string} [instanceId]
 * @return {import("preact").RefObject<NewsService>}
 */
export function useService(instanceId) {
    const service = useRef(/** @type {NewsService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const newsService = new NewsService(ntp, instanceId);
        service.current = newsService;
        return () => {
            newsService.destroy();
        };
    }, [ntp, instanceId]);
    return service;
}

/**
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<NewsEvents>} params.dispatch
 * @param {import("preact").RefObject<NewsService>} params.service
 * @param {string} [params.instanceId]
 */
function useInitialNewsData({ dispatch, service, instanceId }) {
    const messaging = useMessaging();
    useEffect(() => {
        if (!service.current) return console.warn('missing news service');
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
 * Subscribe to news data updates
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<NewsEvents>} params.dispatch
 * @param {import("preact").RefObject<NewsService>} params.service
 * @param {string} [params.instanceId]
 */
function useNewsDataSubscription({ dispatch, service, instanceId }) {
    useEffect(() => {
        if (!service.current) return console.warn('could not access news service');

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
