import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect } from 'preact/hooks';
import { signal, useComputed, useSignal } from '@preact/signals';

/**
 * @typedef {{kind: 'open-url'; url: string, target: 'new-tab' | 'new-window' | 'same-tab' }
 * | { kind: 'search-commit', params: URLSearchParams, source: import('../../settings.service.js').SettingsQuerySource }
 * | { kind: 'value-change', id: string, value: any }
 * | { kind: 'button-press', id: string }
 * } Action
 */

/**
 * @typedef {object} Results
 * @property {import('../../settings.service.js').SettingsStructure} data
 * @property {Record<string, any>} state
 */

const ResultsContext = createContext(/** @type {import('@preact/signals').ReadonlySignal<Results["data"]>} */ (signal({})));

const StateContext = createContext(/** @type {import('@preact/signals').ReadonlySignal<Results["state"]>} */ (signal({})));

/**
 * @param {Action} action
 */
function defaultDispatch(action) {
    console.log('would dispatch', action);
}
const SettingsServiceDispatchContext = createContext(defaultDispatch);

/**
 * Provides a context for the settings service, allowing dependent components to access it.
 * Everything that interacts with the service should be registered here
 *
 * @param {Object} props
 * @param {import("../../settings.service.js").SettingsService} props.service
 * @param {import("preact").ComponentChild} props.children
 * @param {Results["data"]} props.data
 * @param {Results["state"]} props.initialState
 */
export function SettingsServiceProvider({ service, children, data, initialState }) {
    const results = useSignal(data);
    const state = useSignal(initialState);

    /**
     * @param {Action} action
     */
    function dispatch(action) {
        switch (action.kind) {
            case 'open-url': {
                service.openUrl(action.url, action.target);
                break;
            }
            case 'search-commit': {
                // const asQuery = paramsToQuery(action.params, action.source);
                break;
            }
            case 'value-change': {
                const exists = state.value.hasOwnProperty(action.id);
                if (exists) {
                    state.value = {
                        ...state.value,
                        [action.id]: action.value,
                    };
                }
                service.onValueChange(action.id, action.value);
                return;
            }
            case 'button-press': {
                service.onButtonPress(action.id);
                return;
            }
            default: {
                // console.warn('{exists}', { exists });
                console.warn('unhandled global event', action);
            }
        }
    }

    useEffect(() => {
        globalThis._send = dispatch;
        const unsubs = [
            service.onValueChanged(({ id, value }) => {
                const exists = state.value.hasOwnProperty(id);
                console.warn('setting', id, 'to', value);
                if (!exists) console.warn('setting a value that didnt have a default', id, 'to', value);
                state.value = {
                    ...state.value,
                    [id]: value,
                };
            }),
        ];
        return () => {
            for (const unsub of unsubs) {
                unsub?.();
            }
        };
    }, [dispatch, service]);

    const dispatcher = useCallback(dispatch, [service]);

    return (
        <SettingsServiceDispatchContext.Provider value={dispatcher}>
            <ResultsContext.Provider value={results}>
                <StateContext.Provider value={state}>{children}</StateContext.Provider>
            </ResultsContext.Provider>
        </SettingsServiceDispatchContext.Provider>
    );
}

export function useSettingsServiceDispatch() {
    return useContext(SettingsServiceDispatchContext);
}

// Hook for consuming the context
export function useResultsData() {
    return useContext(ResultsContext);
}
// Hook for consuming the state context
export function useGlobalSettingsState() {
    return useContext(StateContext);
}
// Hook for consuming the state context
/**
 * @param {string} id
 */
export function useSetting(id) {
    const state = useContext(StateContext);
    return useComputed(() => state.value[id]);
}
/**
 * @import { Signal } from '@preact/signals';
 * @return {Signal<string>}
 */
export function useDefaultScreen() {
    const results = useResultsData();
    return useComputed(() => {
        const id = results.value.groups?.[0]?.screenIds?.[0];
        if (!id) throw new Error('unreachable - there must be a default screen to show');
        return id;
    });
}
