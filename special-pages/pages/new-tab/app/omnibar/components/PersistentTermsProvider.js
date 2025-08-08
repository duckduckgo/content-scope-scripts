import { h, createContext } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarTerm } from '../omnibar.term.js';
import { OmnibarContext, useOmnibarService } from './OmnibarProvider.js';

const InitialTermContext = createContext(/** @type {OmnibarTerm|null} */ (null));

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function PersistentTermsProvider({ children }) {
    const [terms] = useState(() => new OmnibarTerm());
    return <InitialTermContext.Provider value={terms}>{children}</InitialTermContext.Provider>;
}

/**
 * When the Omnibar Service becomes ready, subscribe to tab updates so that we can prune old state
 */
export function PruneInitialTerms() {
    const terms = useContext(InitialTermContext);
    const service = useOmnibarService();
    useEffect(() => {
        return service?.onConfig(({ source, data }) => {
            if (source === 'subscription') {
                if (typeof data.tabId === 'string' && Array.isArray(data.tabIds)) {
                    terms?.prune({ preserve: data.tabIds });
                }
            }
        });
    }, [service]);
    return null;
}

/**
 * A normal set-state, but with values recorded. Must be used when the Omnibar Service is ready
 */
export function useQueryWithPersistence() {
    const terms = useContext(InitialTermContext);
    const { state } = useContext(OmnibarContext);

    if (state.status !== 'ready') {
        throw new Error('Cannot use `useQueryWithPersistence` without Omnibar Service being ready.');
    }

    const [query, _setQuery] = useState(() => terms?.byId(state.config.tabId) || '');

    /** @type {(term: string) => void} */
    const setter = useCallback(
        (term) => {
            if (state.config.tabId) {
                terms?.update({ id: state.config.tabId, term });
            }
            _setQuery(term);
        },
        [state.config.tabId],
    );

    return /** @type {const} */ ([query, setter]);
}
