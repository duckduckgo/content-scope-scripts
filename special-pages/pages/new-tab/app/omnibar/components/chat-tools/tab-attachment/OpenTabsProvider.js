import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
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
    const [isLoadingTabs, setIsLoadingTabs] = useState(false);

    // Native sends tab-strip order (oldest first); reverse to show most recent first.
    const openTabs = useMemo(() => [...rawTabs].reverse(), [rawTabs]);

    // Ref (not dep) so `refetchTabs` stays referentially stable across fetches.
    const hasCachedTabsRef = useRef(rawTabs.length > 0);
    hasCachedTabsRef.current = rawTabs.length > 0;

    const refetchTabs = useCallback(async () => {
        // Only show a loading state when nothing is cached yet.
        setIsLoadingTabs(!hasCachedTabsRef.current);
        try {
            const response = await getOpenTabs();
            setRawTabs(response.tabs ?? []);
        } catch (err) {
            console.error('omnibar_getOpenTabs failed', err);
        } finally {
            setIsLoadingTabs(false);
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
