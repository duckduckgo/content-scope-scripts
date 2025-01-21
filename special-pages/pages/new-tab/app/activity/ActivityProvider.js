import { createContext, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { ActivityService } from './activity.service.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../service.hooks.js';

/**
 * @typedef {import('../../types/new-tab.js').ActivityData} ActivityData
 * @typedef {import('../../types/new-tab.js').ActivityConfig} ActivityConfig
 * @typedef {import('../service.hooks.js').State<ActivityData, ActivityConfig>} State
 * @typedef {import('../service.hooks.js').Events<ActivityData, ActivityConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const ActivityContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
});

export const ActivityDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

/**
 * A data provider that will use `ActivityService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function ActivityProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `ActivityService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    return (
        <ActivityContext.Provider value={{ state, toggle }}>
            <ActivityDispatchContext.Provider value={dispatch}>{props.children}</ActivityDispatchContext.Provider>
        </ActivityContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<ActivityService>}
 */
export function useService() {
    const service = useRef(/** @type {ActivityService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new ActivityService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
