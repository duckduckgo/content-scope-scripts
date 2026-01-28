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
});

/**
 * A data provider that will use `NewsService` to fetch initial data
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function NewsProvider(props) {
    const initial = /** @type {NewsState} */ ({
        status: /** @type {const} */ ('idle'),
        data: null,
    });

    const [state, dispatch] = useReducer(newsReducer, initial);

    // create an instance of `NewsService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialNewsData({ dispatch, service });

    // subscribe to data updates
    useNewsDataSubscription({ dispatch, service });

    return <NewsContext.Provider value={{ state }}>{props.children}</NewsContext.Provider>;
}

/**
 * @return {import("preact").RefObject<NewsService>}
 */
export function useService() {
    const service = useRef(/** @type {NewsService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const newsService = new NewsService(ntp);
        service.current = newsService;
        return () => {
            newsService.destroy();
        };
    }, [ntp]);
    return service;
}

/**
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<NewsEvents>} params.dispatch
 * @param {import("preact").RefObject<NewsService>} params.service
 */
function useInitialNewsData({ dispatch, service }) {
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
    }, [messaging]);
}

/**
 * Subscribe to news data updates
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<NewsEvents>} params.dispatch
 * @param {import("preact").RefObject<NewsService>} params.service
 */
function useNewsDataSubscription({ dispatch, service }) {
    useEffect(() => {
        if (!service.current) return console.warn('could not access news service');

        const unsub = service.current.onData((evt) => {
            dispatch({ kind: 'data', data: evt.data });
        });
        return () => {
            unsub();
        };
    }, [service, dispatch]);
}
