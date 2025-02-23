import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { VpnService } from './vpn.service.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../service.hooks.js';

/**
 * @typedef {import('../../types/new-tab.js').VPNWidgetData} VPNWidgetData
 * @typedef {import('../../types/new-tab.js').VPNConfig} VPNConfig
 * @typedef {import('../service.hooks.js').State<VPNWidgetData, VPNConfig>} State
 * @typedef {import('../service.hooks.js').Events<VPNWidgetData, VPNConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const VpnContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
});

export const VpnDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));
export const VpnApiContext = createContext({
    connect() {},
    disconnect() {},
    tryForFree() {},
});

/**
 * A data provider that will use `VpnService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function VpnProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    // const [state, dispatch] = useReducer(withLog('VpnProvider', reducer), initial)
    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `VpnService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    const connect = useCallback(() => {
        service.current?.connect();
    }, [service]);
    const disconnect = useCallback(() => {
        service.current?.disconnect();
    }, [service]);
    const tryForFree = useCallback(() => {
        service.current?.tryForFree();
    }, [service]);

    return (
        <VpnContext.Provider value={{ state, toggle }}>
            <VpnDispatchContext.Provider value={dispatch}>
                <VpnApiContext.Provider value={{ connect, disconnect, tryForFree }}>{props.children}</VpnApiContext.Provider>
            </VpnDispatchContext.Provider>
        </VpnContext.Provider>
    );
}

export function useVpnApi() {
    return useContext(VpnApiContext);
}

/**
 * @return {import("preact").RefObject<VpnService>}
 */
export function useService() {
    const service = useRef(/** @type {VpnService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new VpnService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
