import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import { paramsToQuery, toRange } from './history.service.js';
import { OVERSCAN_AMOUNT } from './constants.js';
import { usePlatformName } from './types.js';
import { eventToTarget } from '../../../shared/handlers.js';

// Create the context
const HistoryServiceContext = createContext({
    service: /** @type {import("./history.service").HistoryService} */ ({}),
    initial: /** @type {import("./history.service").ServiceData} */ ({}),
});

// Provider component
/**
 * Provides a context for the history service, allowing dependent components to access it.
 *
 * @param {Object} props - The properties object for the HistoryServiceProvider component.
 * @param {import("./history.service").HistoryService} props.service - The history service instance to be provided through the context.
 * @param {import("./history.service").ServiceData} props.initial - The history service instance to be provided through the context.
 * @param {import("preact").ComponentChild} props.children - The child components that will consume the history service context.
 */
export function HistoryServiceProvider({ service, initial, children }) {
    const platFormName = usePlatformName();
    useSignalEffect(() => {
        // Add a listener for the 'search-commit' event
        window.addEventListener('search-commit', (/** @type {CustomEvent<{params: URLSearchParams}>} */ event) => {
            const detail = event.detail;
            if (detail && detail.params instanceof URLSearchParams) {
                const asQuery = paramsToQuery(detail.params);
                service.trigger(asQuery);
            } else {
                console.error('missing detail.params from search-commit event');
            }
        });

        // Cleanup the event listener on unmount
        return () => {
            window.removeEventListener('search-commit', this);
        };
    });

    useSignalEffect(() => {
        function handler(/** @type {CustomEvent<{start: number, end: number}>} */ event) {
            if (!service.query.data) throw new Error('unreachable');
            const { end } = event.detail;
            const memory = service.query.data.results;
            if (memory.length - end < OVERSCAN_AMOUNT) {
                service.requestMore();
            }
        }
        window.addEventListener('range-change', handler);
        return () => {
            window.removeEventListener('range-change', handler);
        };
    });

    useSignalEffect(() => {
        function handler(/** @type {MouseEvent} */ event) {
            if (!(event.target instanceof Element)) return;
            const btn = /** @type {HTMLButtonElement|null} */ (event.target.closest('button'));
            const anchor = /** @type {HTMLButtonElement|null} */ (event.target.closest('a[href][data-url]'));
            if (btn?.dataset.titleMenu) {
                event.stopImmediatePropagation();
                event.preventDefault();
                // eslint-disable-next-line promise/prefer-await-to-then
                service.menuTitle(btn.value).catch(console.error);
                return;
            }
            if (btn) {
                if (btn?.dataset.rowMenu) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return confirm(`todo: row menu for ${btn.dataset.rowMenu}`);
                }
                if (btn?.dataset.deleteRange) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    const range = toRange(btn.value);
                    if (range) {
                        // eslint-disable-next-line promise/prefer-await-to-then
                        service.deleteRange(range).catch(console.error);
                    }
                }
                if (btn?.dataset.deleteAll) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    // eslint-disable-next-line promise/prefer-await-to-then
                    service.deleteRange('all').catch(console.error);
                }
            } else if (anchor) {
                const url = anchor.dataset.url;
                if (!url) return;
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platFormName);
                service.openUrl(url, target);
                return;
            }
            return null;
        }
        document.addEventListener('click', handler);

        const handleAuxClick = (event) => {
            const anchor = /** @type {HTMLButtonElement|null} */ (event.target.closest('a[href][data-url]'));
            const url = anchor?.dataset.url;
            if (anchor && url && event.button === 1) {
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = eventToTarget(event, platFormName);
                service.openUrl(url, target);
            }
        };
        document.addEventListener('auxclick', handleAuxClick);

        function contextMenu(event) {
            const target = /** @type {HTMLElement|null} */ (event.target);
            if (!(target instanceof HTMLElement)) return;

            const actions = {
                '[data-section-title]': (elem) => elem.querySelector('button')?.value,
            };

            for (const [selector, valueFn] of Object.entries(actions)) {
                const match = event.target.closest(selector);
                if (match) {
                    const value = valueFn(match);
                    if (value) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        // eslint-disable-next-line promise/prefer-await-to-then
                        service.menuTitle(value).catch(console.error);
                    }
                    break;
                }
            }
        }

        document.addEventListener('contextmenu', contextMenu);

        return () => {
            document.removeEventListener('auxclick', handleAuxClick);
            document.removeEventListener('click', handler);
            document.removeEventListener('contextmenu', contextMenu);
        };
    });
    return <HistoryServiceContext.Provider value={{ service, initial }}>{children}</HistoryServiceContext.Provider>;
}

// Hook for consuming the context
export function useHistory() {
    const context = useContext(HistoryServiceContext);
    if (!context) {
        throw new Error('useHistoryService must be used within a HistoryServiceProvider');
    }
    return context;
}
