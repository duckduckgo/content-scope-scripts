import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { OpenTabsList } from '../../PersistentOmnibarValuesProvider';

const { useStateWithLocalPersistence } = OpenTabsList;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {{ openTabs: TabMetadata[], refetchTabs: () => Promise<void> }} OpenTabsValue
 */

export const OpenTabsContext = createContext(/** @type {OpenTabsValue} */ ({ openTabs: [], refetchTabs: async () => {} }));

/**
 * Holds the open-tab list for one NTP tab as a single shared state: the pickers and the attachment
 * chips both read from here, so they can't show divergent metadata for the same tab. The list is
 * persisted per NTP tab as a cache so chips render instantly across the browser-tab-switch remount,
 * then revalidated: refetched on (re)mount, on visibility regain, and whenever a picker opens.
 *
 * @param {object} props
 * @param {string|null|undefined} props.tabId — The NTP tab this list belongs to.
 * @param {boolean} props.enabled — Master switch; when false the visibility refresh is skipped.
 * @param {import('preact').ComponentChildren} props.children
 */
export function OpenTabsProvider({ tabId, enabled, children }) {
    const { getOpenTabs } = useContext(OmnibarContext);
    const [openTabs, setOpenTabs] = useStateWithLocalPersistence(tabId);

    const refetchTabs = useCallback(async () => {
        try {
            const response = await getOpenTabs();
            setOpenTabs(response.tabs ?? []);
        } catch (err) {}
    }, [getOpenTabs, setOpenTabs]);

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

    const value = useMemo(() => ({ openTabs, refetchTabs }), [openTabs, refetchTabs]);

    return <OpenTabsContext.Provider value={value}>{children}</OpenTabsContext.Provider>;
}
