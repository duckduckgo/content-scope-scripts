import { createContext, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { PrivacyProService } from './privacy-pro.service.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../service.hooks.js';

/**
 * @typedef {import('../../types/new-tab.js').PrivacyProData} PrivacyProData
 * @typedef {import('../../types/new-tab.js').PrivacyProConfig} PrivacyProConfig
 * @typedef {import('../service.hooks.js').State<PrivacyProData, PrivacyProConfig>} State
 * @typedef {import('../service.hooks.js').Events<PrivacyProData, PrivacyProConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const PrivacyProContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
});

export const PrivacyProDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

/**
 * A data provider that will use `PrivacyProService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function PrivacyProProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    // const [state, dispatch] = useReducer(withLog('PrivacyProProvider', reducer), initial)
    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `PrivacyProService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    return (
        <PrivacyProContext.Provider value={{ state, toggle }}>
            <PrivacyProDispatchContext.Provider value={dispatch}>{props.children}</PrivacyProDispatchContext.Provider>
        </PrivacyProContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<PrivacyProService>}
 */
export function useService() {
    const service = useRef(/** @type {PrivacyProService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const privacyPro = new PrivacyProService(ntp);
        service.current = privacyPro;
        return () => {
            privacyPro.destroy();
        };
    }, [ntp]);
    return service;
}
