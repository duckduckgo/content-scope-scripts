import { createContext, h } from 'preact';
import { useSignalEffect } from '@preact/signals';
import { paramsToQuery, toRange } from '../history.service.js';
import { BTN_ACTION_ENTRIES_MENU, EVENT_RANGE_CHANGE, KNOWN_ACTIONS } from '../constants.js';
import { usePlatformName } from '../types.js';
import { eventToTarget } from '../../../../shared/handlers.js';
import { useCallback, useContext } from 'preact/hooks';
import { useSelected } from './SelectionProvider.js';
import { useData } from './DataProvider.js';
import { useQueryDispatch } from './QueryProvider.js';

// Create the context
const HistoryServiceContext = createContext({
    service: /** @type {import("../history.service.js").HistoryService} */ ({}),
});

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

// Create the context
const HistoryServiceDispatchContext = createContext(/** @type {(action: Action)=>void} */ ((action) => {}));

/**
 * Provides a context for the history service, allowing dependent components to access it.
 * Everything that interacts with the service should be registered here
 *
 * @param {Object} props
 * @param {import("../history.service.js").HistoryService} props.service
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

    return (
        <HistoryServiceContext.Provider value={{ service }}>
            <HistoryServiceDispatchContext.Provider value={dispatcher}>{children}</HistoryServiceDispatchContext.Provider>
        </HistoryServiceContext.Provider>
    );
}

export function useHistoryServiceDispatch() {
    return useContext(HistoryServiceDispatchContext);
}

export function useGlobalHandlers() {
    const { service } = useContext(HistoryServiceContext);

    useRangeChange(service);
}

/**
 * A hook that listens to the "range-change" custom event and triggers fetching additional data
 * from the service based on the event's range values.
 *
 * @param {import('../history.service.js').HistoryService} service
 */
export function useRangeChange(service) {
    const dispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        function handler(/** @type {CustomEvent<{start: number, end: number}>} */ event) {
            if (!service.data) throw new Error('unreachable');
            const { end } = event.detail;
            dispatch({ kind: 'request-more', end });
        }
        window.addEventListener(EVENT_RANGE_CHANGE, handler);
        return () => {
            window.removeEventListener(EVENT_RANGE_CHANGE, handler);
        };
    });
}

/**
 * Support for context menu on entries. This needs to be aware of
 * selected regions so that it can either trigger a context menu
 * for a group, or a single item
 */
export function useContextMenuForEntries() {
    const selected = useSelected();
    const results = useData();
    const dispatch = useHistoryServiceDispatch();

    useSignalEffect(() => {
        function contextMenu(event) {
            const target = /** @type {HTMLElement|null} */ (event.target);
            if (!(target instanceof HTMLElement)) return;

            // only act on history entries
            const elem = target.closest('[data-history-entry]');
            if (!elem || !(elem instanceof HTMLElement)) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            const isSelected = elem.getAttribute('aria-selected') === 'true';
            if (isSelected) {
                const indexes = [...selected.value];
                const ids = [];
                for (let i = 0; i < indexes.length; i++) {
                    const current = results.results.value.items[indexes[i]];
                    if (!current) throw new Error('unreachable');
                    ids.push(current.id);
                }
                dispatch({ kind: 'show-entries-menu', ids, indexes });
            } else {
                const button = /** @type {HTMLButtonElement|null} */ (elem.querySelector('button[value]'));
                const id = button?.value || '';
                dispatch({ kind: 'show-entries-menu', ids: [id], indexes: [Number(elem.dataset.index)] });
            }
        }

        document.addEventListener('contextmenu', contextMenu);

        return () => {
            document.removeEventListener('contextmenu', contextMenu);
        };
    });
}

/**
 * Support middle-button click
 */
export function useAuxClickHandler() {
    const platformName = usePlatformName();
    const dispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        const handleAuxClick = (event) => {
            const anchor = /** @type {HTMLButtonElement|null} */ (event.target.closest('a[href][data-url]'));
            const url = anchor?.dataset.url;
            if (anchor && url && event.button === 1) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platformName);
                dispatch({ kind: 'open-url', url, target });
            }
        };
        document.addEventListener('auxclick', handleAuxClick);
        return () => {
            document.removeEventListener('auxclick', handleAuxClick);
        };
    });
}

/**
 * This function registers button click handlers that communicate with the history service.
 * Depending on the `data-action` attribute of the clicked button, it triggers a specific action
 * in the service, such as opening a menu, deleting a range, or deleting all entries.
 *
 * - "entries_menu": Triggers the `entriesMenu` method with the button value and dataset index.
 */
export function useButtonClickHandler() {
    const historyServiceDispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        function clickHandler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;

            // was this a button click?
            const btn = /** @type {HTMLButtonElement|null} */ (event.target.closest('button[data-action]'));
            if (btn === null) return;
            if (btn?.getAttribute('aria-disabled') === 'true') return;

            // if so, was it a known action?
            const action = toKnownAction(btn);
            if (action === null) return;

            // if we get this far, we're going to handle the event
            event.stopImmediatePropagation();
            event.preventDefault();

            switch (action) {
                case BTN_ACTION_ENTRIES_MENU: {
                    historyServiceDispatch({ kind: 'show-entries-menu', ids: [btn.value], indexes: [Number(btn.dataset.index)] });
                    return;
                }
                default:
                    return null;
            }
        }
        document.addEventListener('click', clickHandler);
        return () => {
            document.removeEventListener('click', clickHandler);
        };
    });
}

/**
 * Converts an HTML button element with a `data-action` attribute
 * into a known action type, based on the `KNOWN_ACTIONS` array.
 *
 * @param {HTMLButtonElement|null} elem - The button element to parse.
 * @return {KNOWN_ACTIONS[number] | null} - The corresponding known action, or null if invalid.
 */
function toKnownAction(elem) {
    if (!elem) return null;
    const action = elem.dataset.action;
    if (!action) return null;
    if (KNOWN_ACTIONS.includes(/** @type {any} */ (action))) return /** @type {KNOWN_ACTIONS[number]} */ (action);
    return null;
}

/**
 * Registers click event handlers for anchor links (`<a>` elements) having `href` and `data-url` attributes.
 * Directs the `click` events with these links to interact with the provided history service.
 *
 * - Anchors with `data-url` attribute are intercepted, and their URLs are processed to determine
 *   the target action (`new-tab`, `same-tab`, or `new-window`) based on the click event details.
 * - Prevents default navigation and propagation for handled events.
 */
export function useLinkClickHandler() {
    const platformName = usePlatformName();
    const dispatch = useHistoryServiceDispatch();
    useSignalEffect(() => {
        /**
         * Handles click events on the document, intercepting interactions with anchor elements
         * that specify both `href` and `data-url` attributes.
         *
         * @param {MouseEvent} event - The mouse event triggered by a click.
         * @returns {void} - No return value.
         */
        function clickHandler(event) {
            if (!(event.target instanceof Element)) return;
            const anchor = /** @type {HTMLAnchorElement|null} */ (event.target.closest('a[href][data-url]'));
            if (anchor) {
                const url = anchor.dataset.url;
                if (!url) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platformName);
                dispatch({ kind: 'open-url', url, target });
            }
        }

        document.addEventListener('click', clickHandler);
        return () => {
            document.removeEventListener('click', clickHandler);
        };
    });
}
