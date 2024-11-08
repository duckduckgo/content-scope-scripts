import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';

import { FavoritesService } from '../favorites.service.js';
import { useMessaging } from '../../types.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../../service.hooks.js';

/**
 * @typedef {import('../../../../../types/new-tab.ts').Favorite} Favorite
 * @typedef {import('../../../../../types/new-tab.ts').FavoritesData} FavoritesData
 * @typedef {import('../../../../../types/new-tab.ts').FavoritesConfig} FavoritesConfig
 * @typedef {import('../../../../../types/new-tab.ts').FavoritesOpenAction['target']} OpenTarget
 * @typedef {import('../../service.hooks.js').State<FavoritesData, FavoritesConfig>} State
 * @typedef {import('../../service.hooks.js').Events<FavoritesData, FavoritesConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const FavoritesContext = createContext({
    /** @type {import('../../service.hooks.js').State<FavoritesData, FavoritesConfig>} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
    /** @type {(list: Favorite[], id: string, targetIndex: number) => void} */
    favoritesDidReOrder: (list, id, targetIndex) => {
        throw new Error('must implement');
    },
    /** @type {(id: string) => void} */
    openContextMenu: (id) => {
        throw new Error('must implement');
    },
    /** @type {(id: string, target: OpenTarget) => void} */
    openFavorite: (id, target) => {
        throw new Error('must implement');
    },
    /** @type {() => void} */
    add: () => {
        throw new Error('must implement add');
    },
});

export const FavoritesDispatchContext = createContext(/** @type {import("preact/hooks").Dispatch<Events>} */ ({}));

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function FavoritesProvider({ children }) {
    const initial = /** @type {State} */ ({
        status: /** @type {const} */ ('idle'),
        data: null,
        config: null,
    });

    const [state, dispatch] = useReducer(reducer, initial);

    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    /** @type {(f: Favorite[], id: string, targetIndex: number) => void} */
    const favoritesDidReOrder = useCallback(
        (favorites, id, targetIndex) => {
            if (!service.current) return;
            service.current.setFavoritesOrder({ favorites }, id, targetIndex);
        },
        [service],
    );

    /** @type {(id: string) => void} */
    const openContextMenu = useCallback(
        (id) => {
            if (!service.current) return;
            service.current.openContextMenu(id);
        },
        [service],
    );

    /** @type {(id: string, target: OpenTarget) => void} */
    const openFavorite = useCallback(
        (id, target) => {
            if (!service.current) return;
            service.current.openFavorite(id, target);
        },
        [service],
    );

    /** @type {() => void} */
    const add = useCallback(() => {
        if (!service.current) return;
        service.current.add();
    }, [service]);

    return (
        <FavoritesContext.Provider value={{ state, toggle, favoritesDidReOrder, openFavorite, openContextMenu, add }}>
            <FavoritesDispatchContext.Provider value={dispatch}>{children}</FavoritesDispatchContext.Provider>
        </FavoritesContext.Provider>
    );
}

export function useService() {
    const service = useRef(/** @type {FavoritesService | null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new FavoritesService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
