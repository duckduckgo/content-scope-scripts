import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { SubscriptionWinBackBannerService } from './subscriptionWinBackBanner.service.js';
import { reducer, useDataSubscription, useInitialData } from '../service.hooks.js';

/**
 * @typedef {import('../../types/new-tab.js').SubscriptionWinBackBannerData} SubscriptionWinBackBannerData
 * @typedef {import('../service.hooks.js').State<SubscriptionWinBackBannerData, undefined>} State
 * @typedef {import('../service.hooks.js').Events<SubscriptionWinBackBannerData, undefined>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const SubscriptionWinBackBannerContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {(id: string) => void} */
    dismiss: (id) => {
        throw new Error('must implement dismiss' + id);
    },
    /** @type {(id: string) => void} */
    action: (id) => {
        throw new Error('must implement action' + id);
    },
});

export const SubscriptionWinBackBannerDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

/**
 * A data provider that will use `SubscriptionWinBackBannerService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function SubscriptionWinBackBannerProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    // const [state, dispatch] = useReducer(withLog('SubscriptionWinBackBannerProvider', reducer), initial)
    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `SubscriptionWinBackBannerService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialData({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // todo(valerie): implement onDismiss in the service
    const dismiss = useCallback(
        (id) => {
            console.log('onDismiss');
            service.current?.dismiss(id);
        },
        [service],
    );

    const action = useCallback(
        (id) => {
            service.current?.action(id);
        },
        [service],
    );

    return (
        <SubscriptionWinBackBannerContext.Provider value={{ state, dismiss, action }}>
            <SubscriptionWinBackBannerDispatchContext.Provider value={dispatch}>
                {props.children}
            </SubscriptionWinBackBannerDispatchContext.Provider>
        </SubscriptionWinBackBannerContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<SubscriptionWinBackBannerService>}
 */
export function useService() {
    const service = useRef(/** @type {SubscriptionWinBackBannerService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new SubscriptionWinBackBannerService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
