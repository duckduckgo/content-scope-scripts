import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { PrivacyStatsService } from '../privacy-stats.service.js';
import { reducer, useDataSubscription, useInitialData } from '../../service.hooks.js';

/**
 * @typedef {import('../../../types/new-tab.ts').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../types/new-tab.ts').Expansion} Expansion
 * @typedef {import('../../service.hooks.js').State<PrivacyStatsData, null>} State
 * @typedef {import('../../service.hooks.js').Events<PrivacyStatsData, null>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const PrivacyStatsContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** The first request for stats failed; stats pushed later still arrive in `state` */
    failed: false,
});

export const PrivacyStatsDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

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

    // const [state, dispatch] = useReducer(withLog('PrivacyStatsProvider', statsReducer), initial)
    const [state, dispatch] = useReducer(statsReducer, initial);
    const [failed, setFailed] = useState(false);
    const initialDispatch = useCallback(
        /** @param {Events} event */
        (event) => {
            if (event.kind === 'error') setFailed(true);
            dispatch(event);
        },
        [],
    );

    // create an instance of `PrivacyStatsService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialData({ dispatch: initialDispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    return (
        <PrivacyStatsContext.Provider value={{ state, failed }}>
            <PrivacyStatsDispatchContext.Provider value={dispatch}>{props.children}</PrivacyStatsDispatchContext.Provider>
        </PrivacyStatsContext.Provider>
    );
}

/**
 * The shared reducer, except that stats pushed before the first request has
 * answered (or after it failed) count as the first data. Stats have no
 * config, so nothing else is needed to be ready.
 *
 * @param {State} state
 * @param {Events} event
 * @return {State}
 */
function statsReducer(state, event) {
    if (state.status === 'pending-initial' && event.kind === 'data') {
        return reducer(state, { kind: 'initial-data', data: event.data, config: null });
    }
    return reducer(state, event);
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
