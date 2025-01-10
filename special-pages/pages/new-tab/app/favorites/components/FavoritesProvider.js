import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';

import { FavoritesService } from '../favorites.service.js';
import { useMessaging } from '../../types.js';
import { reducer, useConfigSubscription, useDataSubscription, useInitialDataAndConfig } from '../../service.hooks.js';

/**
 * @typedef {import('../../../types/new-tab.ts').Favorite} Favorite
 * @typedef {import('../../../types/new-tab.ts').FavoritesData} FavoritesData
 * @typedef {import('../../../types/new-tab.ts').FavoritesConfig} FavoritesConfig
 * @typedef {import('../../../types/new-tab.ts').FavoritesOpenAction['target']} OpenTarget
 * @typedef {import('../../service.hooks.js').State<FavoritesData, FavoritesConfig>} State
 * @typedef {import('../../service.hooks.js').Events<FavoritesData, FavoritesConfig>} Events
 * @typedef {{id: string; url: string}} BaseFavoriteType
 */

/**
 * @template {BaseFavoriteType} ItemType - allow any type that extends BaseFavoriteType
 * @typedef {(params: { list: ItemType[], id: string, fromIndex: number, targetIndex: number }) => void} ReorderFn
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
    /** @type {ReorderFn<Favorite>} */
    favoritesDidReOrder: ({ list, id, fromIndex, targetIndex }) => {
        throw new Error('must implement');
    },
    /** @type {(id: string) => void} */
    openContextMenu: (id) => {
        throw new Error('must implement');
    },
    /** @type {(id: string, url: string, target: OpenTarget) => void} */
    openFavorite: (id, target) => {
        throw new Error('must implement');
    },
    /** @type {() => void} */
    add: () => {
        throw new Error('must implement add');
    },
    /** @type {(cb: (data: FavoritesConfig) => void) => void} */
    onConfigChanged: (cb) => {
        /** noop */
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
    const messaging = useMessaging();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to data updates
    useDataSubscription({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    /** @type {ReorderFn<Favorite>} */
    const favoritesDidReOrder = useCallback(
        ({ list, id, fromIndex, targetIndex }) => {
            if (!service.current) return;
            service.current.setFavoritesOrder({ favorites: list }, id, fromIndex, targetIndex);
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

    /** @type {(id: string, url: string, target: OpenTarget) => void} */
    const openFavorite = useCallback(
        (id, url, target) => {
            if (!service.current) return;
            service.current.openFavorite(id, url, target);
        },
        [service],
    );

    /** @type {() => void} */
    const add = useCallback(() => {
        if (!service.current) return;
        service.current.add();
    }, [service]);

    /** @type {(cb: (data: FavoritesConfig) => void) => void} */
    const onConfigChanged = useCallback(
        (cb) => {
            if (!service.current) return;
            return service.current.onConfig((event) => {
                if (event.source === 'manual') {
                    cb(event.data);
                }
            });
        },
        [service],
    );

    useEffect(() => {
        let prev = document.visibilityState;
        const handler = () => {
            const current = document.visibilityState;
            if (prev !== current) {
                prev = current;
                if (current === 'visible') {
                    if (!service.current) return console.warn('missing service');
                    // eslint-disable-next-line promise/prefer-await-to-then
                    service.current.dataService.get().catch(console.error);
                }
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => {
            document.removeEventListener('visibilitychange', handler);
        };
    }, [messaging, service]);

    return (
        <FavoritesContext.Provider value={{ state, toggle, favoritesDidReOrder, openFavorite, openContextMenu, add, onConfigChanged }}>
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
