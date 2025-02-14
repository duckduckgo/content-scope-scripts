import { createContext, h } from 'preact';
import { useSignalEffect } from '@preact/signals';
import { paramsToQuery, toRange } from '../history.service.js';
import { EVENT_RANGE_CHANGE, EVENT_SEARCH_COMMIT, KNOWN_ACTIONS, OVERSCAN_AMOUNT } from '../constants.js';
import { usePlatformName } from '../types.js';
import { eventToTarget } from '../../../../shared/handlers.js';
import { useContext } from 'preact/hooks';
import { eventToIntention, useSelected } from './SelectionProvider.js';
import { useGlobalState } from './GlobalStateProvider.js';
import { useReset } from './QueryProvider.js';

// Create the context
const HistoryServiceContext = createContext({
    service: /** @type {import("../history.service.js").HistoryService} */ ({}),
});

/**
 * Provides a context for the history service, allowing dependent components to access it.
 * Everything that interacts with the service should be registered here
 *
 * @param {Object} props
 * @param {import("../history.service.js").HistoryService} props.service
 * @param {import("preact").ComponentChild} props.children
 */
export function HistoryServiceProvider({ service, children }) {
    return <HistoryServiceContext.Provider value={{ service }}>{children}</HistoryServiceContext.Provider>;
}

export function useGlobalHandlers() {
    const { service } = useContext(HistoryServiceContext);
    const platformName = usePlatformName();
    useSearchCommit(service);
    useRangeChange(service);
    useLinkClickHandler(service, platformName);
    useButtonClickHandler(service);
    useDeleteItems(service);
    useAuxClickHandler(service, platformName);
    useContextMenu(service);
}

/**
 * A hook that listens to the "range-change" custom event and triggers fetching additional data
 * from the service based on the event's range values.
 *
 * @param {import('../history.service.js').HistoryService} service
 */
function useRangeChange(service) {
    useSignalEffect(() => {
        function handler(/** @type {CustomEvent<{start: number, end: number}>} */ event) {
            if (!service.query.data) throw new Error('unreachable');
            const { end } = event.detail;
            const memory = service.query.data.results;
            if (memory.length - end < OVERSCAN_AMOUNT) {
                service.requestMore();
            }
        }
        window.addEventListener(EVENT_RANGE_CHANGE, handler);
        return () => {
            window.removeEventListener(EVENT_RANGE_CHANGE, handler);
        };
    });
}

/**
 * @param {import('../history.service.js').HistoryService} service
 */
function useDeleteItems(service) {
    const selected = useSelected();
    const platformName = usePlatformName();
    useSignalEffect(() => {
        function handler(event) {
            if (eventToIntention(event, platformName) === 'delete' && selected.value.size > 0) {
                // eslint-disable-next-line promise/prefer-await-to-then
                service.entriesDelete([...selected.value]).catch(console.error);
            }
        }
        document.addEventListener('keydown', handler);
        return () => {
            document.removeEventListener('keydown', handler);
        };
    });
}

/**
 * A hook that listens to the "search-commit" custom event and triggers the history service
 * with the parsed query parameter values from the event's detail object.
 *
 * This hook is used to bind the EVENT_SEARCH_COMMIT event with the associated service
 * logic for handling search parameters.
 *
 * @param {import('../history.service.js').HistoryService} service
 */
function useSearchCommit(service) {
    useSignalEffect(() => {
        function handler(/** @type {CustomEvent<{params: URLSearchParams}>} */ event) {
            const detail = event.detail;
            if (detail && detail.params instanceof URLSearchParams) {
                const asQuery = paramsToQuery(detail.params);
                service.trigger(asQuery);
            } else {
                console.error('missing detail.params from search-commit event');
            }
        }

        window.addEventListener(EVENT_SEARCH_COMMIT, handler);

        // Cleanup the event listener on unmount
        return () => {
            window.removeEventListener(EVENT_SEARCH_COMMIT, handler);
        };
    });
}

/**
 * @param {import('../history.service.js').HistoryService} service
 */
function useContextMenu(service) {
    const selected = useSelected();
    const results = useGlobalState();
    useSignalEffect(() => {
        function contextMenu(event) {
            const target = /** @type {HTMLElement|null} */ (event.target);
            if (!(target instanceof HTMLElement)) return;

            const actions = {
                '[data-section-title]': (elem) => {
                    const value = elem?.querySelector('button')?.value || '';
                    if (!value) throw new Error('unreachable');
                    if (elem.dataset.sectionTitle) {
                        // eslint-disable-next-line promise/prefer-await-to-then
                        service.menuTitle(value).catch(console.error);
                        return true;
                    }
                    return null;
                },
                '[data-history-entry]': (elem) => {
                    const isSelected = elem.getAttribute('aria-selected') === 'true';
                    if (elem.dataset.historyEntry) {
                        if (isSelected) {
                            const indexes = [...selected.value];
                            const ids = [];
                            for (let i = 0; i < indexes.length; i++) {
                                const current = results.results.value.items[indexes[i]];
                                if (!current) throw new Error('unreachable');
                                ids.push(current.id);
                            }
                            // eslint-disable-next-line promise/prefer-await-to-then
                            service.entriesMenu(ids, indexes).catch(console.error);
                            return true;
                        } else {
                            const value = elem.querySelector('button[value]')?.value ?? '';
                            if (!value) throw new Error('unreachable');
                            // eslint-disable-next-line promise/prefer-await-to-then
                            service.entriesMenu([value], [Number(elem.dataset.index)]).catch(console.error);
                            return true;
                        }
                    }
                    return null;
                },
            };

            for (const [selector, valueFn] of Object.entries(actions)) {
                const match = event.target.closest(selector);
                if (match) {
                    const value = valueFn(match);
                    if (value !== null) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                    break;
                }
            }
        }

        document.addEventListener('contextmenu', contextMenu);

        return () => {
            document.removeEventListener('contextmenu', contextMenu);
        };
    });
}

/**
 * @param {import('../history.service.js').HistoryService} service
 * @param {'macos' | 'windows'} platformName
 */
function useAuxClickHandler(service, platformName) {
    useSignalEffect(() => {
        const handleAuxClick = (event) => {
            const anchor = /** @type {HTMLButtonElement|null} */ (event.target.closest('a[href][data-url]'));
            const url = anchor?.dataset.url;
            if (anchor && url && event.button === 1) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platformName);
                service.openUrl(url, target);
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
 * - "title_menu": Triggers the `menuTitle` method with the value of the button.
 * - "entries_menu": Triggers the `entriesMenu` method with the button value and dataset index.
 * - "deleteRange": Triggers the `deleteRange` method with a parsed range.
 * - "deleteAll": Triggers the `deleteRange` method with 'all'.
 *
 * @param {import('../history.service.js').HistoryService} service - The history service instance.
 */
function useButtonClickHandler(service) {
    const resetQuery = useReset();
    useSignalEffect(() => {
        function clickHandler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;
            const btn = /** @type {HTMLButtonElement|null} */ (event.target.closest('button[data-action]'));
            if (btn?.getAttribute('aria-disabled') === 'true') return;
            const action = toKnownAction(btn);
            if (btn === null || action === null) return;
            event.stopImmediatePropagation();
            event.preventDefault();

            switch (action) {
                case 'title_menu': {
                    // eslint-disable-next-line promise/prefer-await-to-then
                    service.menuTitle(btn.value).catch(console.error);
                    return;
                }
                case 'entries_menu': {
                    // eslint-disable-next-line promise/prefer-await-to-then
                    service.entriesMenu([btn.value], [Number(btn.dataset.index)]).catch(console.error);
                    return;
                }
                case 'deleteRange': {
                    const range = toRange(btn.value);
                    if (range) {
                        // eslint-disable-next-line promise/prefer-await-to-then
                        service
                            .deleteRange(range)
                            // eslint-disable-next-line promise/prefer-await-to-then
                            .then(resetQuery)
                            // eslint-disable-next-line promise/prefer-await-to-then
                            .catch(console.error);
                    }
                    return;
                }
                case 'deleteAll': {
                    // eslint-disable-next-line promise/prefer-await-to-then
                    service.deleteRange('all').catch(console.error);
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
 *
 * @param {import('../history.service.js').HistoryService} service - The history service instance.
 * @param {'macos' | 'windows'} platformName - The platform name, used to determine click modifiers.
 */
function useLinkClickHandler(service, platformName) {
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
                service.openUrl(url, target);
            }
        }

        document.addEventListener('click', clickHandler);
        return () => {
            document.removeEventListener('click', clickHandler);
        };
    });
}
