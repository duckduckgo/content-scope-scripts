import { createContext, h } from 'preact';
import { useCallback, useContext } from 'preact/hooks';
import { signal, useSignal } from '@preact/signals';
import { paramsToQuery } from '../../../../history/app/history.service.js';

/**
 * @typedef {{kind: 'open-url'; url: string, target: 'new-tab' | 'new-window' | 'same-tab' }
 * | {kind: 'search-commit', params: URLSearchParams, source: import('../../settings.service.js').SettingsQuerySource}
 * } Action
 */

/**
 * @typedef {object} SettingsScreen
 */

/**
 * @typedef {object} Results
 * @property {SettingsScreen[]} screens
 */

const ResultsContext = createContext(
    /** @type {import('@preact/signals').ReadonlySignal<Results>} */ (
        signal({
            screens: [],
        })
    ),
);

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
 * @param {Results} props.initial
 */
export function SettingsServiceProvider({ service, children, initial }) {
    const results = useSignal(initial);
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
                const asQuery = paramsToQuery(action.params, action.source);
                console.log('handle query?', asQuery);
                break;
            }
            default:
                console.warn('unhandled global event', action);
        }
    }

    const dispatcher = useCallback(dispatch, [service]);

    return (
        <SettingsServiceDispatchContext.Provider value={dispatcher}>
            <ResultsContext.Provider value={results}>{children}</ResultsContext.Provider>
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
