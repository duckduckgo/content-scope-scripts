import { createContext, h } from 'preact';
import { paramsToQuery, toRange } from '../../history.service.js';
import { useCallback, useContext } from 'preact/hooks';
import { useQueryDispatch } from './QueryProvider.js';

/**
 * @typedef {{kind: 'search-commit', params: URLSearchParams}
 * | {kind: 'delete-range'; value: string }
 * | {kind: 'delete-all'; }
 * | {kind: 'delete-term'; term: string }
 * | {kind: 'delete-entries-by-index'; value: number[] }
 * | {kind: 'open-url'; url: string, target: 'new-tab' | 'new-window' | 'same-tab' }
 * | {kind: 'show-entries-menu'; ids: string[]; indexes: number[] }
 * | {kind: 'request-more'; end: number }
 * } Action
 */

/**
 * @param {Action} action
 */
function defaultDispatch(action) {
    console.log('would dispatch', action);
}
const HistoryServiceDispatchContext = createContext(defaultDispatch);

/**
 * Provides a context for the history service, allowing dependent components to access it.
 * Everything that interacts with the service should be registered here
 *
 * @param {Object} props
 * @param {import("../../history.service.js").HistoryService} props.service
 * @param {import("preact").ComponentChild} props.children
 */
export function HistoryServiceProvider({ service, children }) {
    const queryDispatch = useQueryDispatch();
    /**
     * @param {Action} action
     */
    function dispatch(action) {
        switch (action.kind) {
            case 'search-commit': {
                const asQuery = paramsToQuery(action.params);
                service.trigger(asQuery);
                break;
            }
            case 'delete-range': {
                const range = toRange(action.value);
                if (range) {
                    service
                        .deleteRange(range)
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .then((resp) => {
                            if (resp.kind === 'range-deleted') {
                                queryDispatch({ kind: 'reset' });
                            }
                        })
                        // eslint-disable-next-line promise/prefer-await-to-then
                        .catch(console.error);
                }
                break;
            }
            case 'delete-entries-by-index': {
                // eslint-disable-next-line promise/prefer-await-to-then
                service.entriesDelete(action.value).catch(console.error);
                break;
            }
            case 'delete-all': {
                // eslint-disable-next-line promise/prefer-await-to-then
                service.deleteRange('all').catch(console.error);
                break;
            }
            case 'delete-term': {
                // eslint-disable-next-line promise/prefer-await-to-then
                service.deleteTerm(action.term).catch(console.error);
                break;
            }
            case 'open-url': {
                service.openUrl(action.url, action.target);
                break;
            }
            case 'show-entries-menu': {
                service
                    .entriesMenu(action.ids, action.indexes)
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .then((resp) => {
                        if (resp.kind === 'domain-search') {
                            queryDispatch({ kind: 'search-by-domain', value: resp.value });
                        }
                    })
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .catch(console.error);
                break;
            }
            case 'request-more': {
                service.requestMore(action.end);
                break;
            }
        }
    }

    const dispatcher = useCallback(dispatch, [service]);

    return <HistoryServiceDispatchContext.Provider value={dispatcher}>{children}</HistoryServiceDispatchContext.Provider>;
}

export function useHistoryServiceDispatch() {
    return useContext(HistoryServiceDispatchContext);
}
