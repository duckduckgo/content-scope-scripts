import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { PrivacyStatsService } from './privacy-stats.service.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../service.hooks.js';

/**
 * @typedef {import('../../types/new-tab.js').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../types/new-tab.js').StatsConfig} StatsConfig
 * @typedef {import('../service.hooks.js').State<PrivacyStatsData, StatsConfig>} State
 * @typedef {import('../service.hooks.js').Events<PrivacyStatsData, StatsConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const PrivacyStatsContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
});

export const PrivacyStatsDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

export const HistoryOnboardingContext = createContext({
    openHistory: () => {},
    dismiss: () => {},
});

/**
 * A data provider that will use `PrivacyStatsService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function PrivacyStatsProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    // const [state, dispatch] = useReducer(withLog('PrivacyStatsProvider', reducer), initial)
    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `PrivacyStatsService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    const openHistory = useCallback(() => {
        service.current?.openHistory();
    }, [service]);

    const dismiss = useCallback(() => {
        service.current?.dismiss();
    }, [service]);

    return (
        <PrivacyStatsContext.Provider value={{ state, toggle }}>
            <PrivacyStatsDispatchContext.Provider value={dispatch}>
                <HistoryOnboardingContext.Provider value={{ openHistory, dismiss }}>{props.children}</HistoryOnboardingContext.Provider>
            </PrivacyStatsDispatchContext.Provider>
        </PrivacyStatsContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<PrivacyStatsService>}
 */
export function useService() {
    const service = useRef(/** @type {PrivacyStatsService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new PrivacyStatsService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
