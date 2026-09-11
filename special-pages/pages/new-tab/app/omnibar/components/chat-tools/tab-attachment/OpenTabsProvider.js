import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { OpenTabsList } from '../../PersistentOmnibarValuesProvider';

const { useStateWithLocalPersistence } = OpenTabsList;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {{ openTabs: TabMetadata[], isLoadingTabs: boolean, refetchTabs: () => Promise<void> }} OpenTabsValue
 */

export const OpenTabsContext = createContext(
    /** @type {OpenTabsValue} */ ({ openTabs: [], isLoadingTabs: false, refetchTabs: async () => {} }),
);

/**
 * @param {object} props
 * @param {string|null|undefined} props.tabId
 * @param {boolean} props.enabled
 * @param {import('preact').ComponentChildren} props.children
 */
export function OpenTabsProvider({ tabId, enabled, children }) {
    const { getOpenTabs } = useContext(OmnibarContext);
    const [rawTabs, setRawTabs] = useStateWithLocalPersistence(tabId);
    const [isFetching, setIsFetching] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    // Native sends tab-strip order (oldest first); reverse to show most recent first.
    const openTabs = useMemo(() => [...rawTabs].reverse(), [rawTabs]);
    const isLoadingTabs = isFetching && !hasFetched && rawTabs.length === 0;

    const refetchTabs = useCallback(async () => {
        setIsFetching(true);
        try {
            const response = await getOpenTabs();
            setRawTabs(response.tabs ?? []);
            setHasFetched(true);
        } catch (err) {
            console.error('omnibar_getOpenTabs failed', err);
        } finally {
            setIsFetching(false);
        }
    }, [getOpenTabs, setRawTabs]);

    useEffect(() => {
        if (!enabled) return;

        refetchTabs();

        const handler = () => {
            if (document.visibilityState === 'visible') {
                refetchTabs();
            }
        };

        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [enabled, refetchTabs]);

    const value = useMemo(() => ({ openTabs, isLoadingTabs, refetchTabs }), [openTabs, isLoadingTabs, refetchTabs]);

    return <OpenTabsContext.Provider value={value}>{children}</OpenTabsContext.Provider>;
}
