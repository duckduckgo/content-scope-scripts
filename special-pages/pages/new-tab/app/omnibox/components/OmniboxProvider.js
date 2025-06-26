import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { reducer, useInitialDataAndConfig, useConfigSubscription } from '../../service.hooks.js';
import { OmniboxService } from '../omnibox.service.js';

/**
 * @typedef {import('../../../types/new-tab.js').OmniboxConfig} OmniboxConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 * @typedef {import('../../service.hooks.js').State<null, OmniboxConfig>} State // @todo: could this be never?
 * @typedef {import('../../service.hooks.js').Events<null, OmniboxConfig>} Events // @todo: could this be never?
 */

/**
 * These are the values exposed to consumers.
 */
export const OmniboxContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {(mode: OmniboxConfig['mode']) => void} */
    setMode: () => {
        throw new Error('must implement');
    },
    /** @type {(term: string) => Promise<SuggestionsData>} */
    getSuggestions: () => {
        throw new Error('must implement');
    },
    /** @type {(params: {suggestion: Suggestion, target: OpenTarget}) => void} */
    openSuggestion: () => {
        throw new Error('must implement');
    },
    /** @type {(params: {term: string, target: OpenTarget}) => void} */
    submitSearch: () => {
        throw new Error('must implement');
    },
    /** @type {(params: {chat: string, target: OpenTarget}) => void} */
    submitChat: () => {
        throw new Error('must implement');
    },
});

export const OmniboxServiceContext = createContext(/** @type {OmniboxService|null} */ (null));

/**
 * A data provider that will use `OmniboxService` to fetch initial config only
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function OmniboxProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `OmniboxService` for the lifespan of this component.
    const service = useService();

    // get initial data and config (data will be null)
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to config updates
    useConfigSubscription({ dispatch, service });

    /** @type {(mode: OmniboxConfig['mode']) => void} */
    const setMode = useCallback(
        (mode) => {
            service.current?.setMode(mode);
        },
        [service],
    );

    /** @type {(term: string) => Promise<SuggestionsData>} */
    const getSuggestions = useCallback(
        (term) => {
            if (!service.current) throw new Error('Service not available');
            return service.current.getSuggestions(term);
        },
        [service],
    );

    /** @type {(params: {suggestion: Suggestion, target: OpenTarget}) => void} */
    const openSuggestion = useCallback(
        (params) => {
            service.current?.openSuggestion(params);
        },
        [service],
    );

    /** @type {(params: {term: string, target: OpenTarget}) => void} */
    const submitSearch = useCallback(
        (params) => {
            service.current?.submitSearch(params);
        },
        [service],
    );

    /** @type {(params: {chat: string, target: OpenTarget}) => void} */
    const submitChat = useCallback(
        (params) => {
            service.current?.submitChat(params);
        },
        [service],
    );

    return (
        <OmniboxContext.Provider
            value={{
                state,
                setMode,
                getSuggestions,
                openSuggestion,
                submitSearch,
                submitChat,
            }}
        >
            <OmniboxServiceContext.Provider value={service.current}>{props.children}</OmniboxServiceContext.Provider>
        </OmniboxContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<OmniboxService>}
 */
export function useService() {
    const service = useRef(/** @type {OmniboxService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const omnibox = new OmniboxService(ntp);
        service.current = omnibox;
        return () => {
            omnibox.destroy();
        };
    }, [ntp]);
    return service;
}
