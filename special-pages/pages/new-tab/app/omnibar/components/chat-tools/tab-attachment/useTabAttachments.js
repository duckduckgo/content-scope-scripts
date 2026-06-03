import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';

const { useStateWithLocalPersistence } = TabAttachments;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').PageContext} PageContext
 */

/**
 * @param {string|null|undefined} tabId — The NTP tab these attachments belong to. Used to persist
 * them per-tab so they survive switching between browser tabs
 */
export function useTabAttachments(tabId) {
    const { getTabContent } = useContext(OmnibarContext);

    const [attachedTabs, setAttachedTabs] = useStateWithLocalPersistence(tabId);

    const isAttached = useCallback(
        /** @param {string} tabId */
        (tabId) => attachedTabs.some((t) => t.tabId === tabId),
        [attachedTabs],
    );

    const attachTab = useCallback(
        /** @param {TabMetadata} tabToAttach */
        (tabToAttach) => {
            setAttachedTabs((prev) => {
                if (prev.some((tab) => tab.tabId === tabToAttach.tabId)) return prev;
                return [...prev, tabToAttach];
            });
        },
        [setAttachedTabs],
    );

    const removeTab = useCallback(
        /** @param {string} tabId */
        (tabId) => {
            setAttachedTabs((prev) => prev.filter((tab) => tab.tabId !== tabId));
        },
        [setAttachedTabs],
    );

    const clearAttachedTabs = useCallback(() => {
        setAttachedTabs([]);
    }, [setAttachedTabs]);

    /**
     * Extracts page content for every attached tab in parallel. Called at submit
     * time — content is not fetched on attach. Tabs whose extraction fails or
     * returns `null` (closed/restricted/extraction error) are dropped. Each
     * returned context carries its source `tabId` so native can attribute the
     * attachment back to the tab it came from.
     *
     * @returns {Promise<PageContext[] | null>}
     */
    const getTabsForSubmission = useCallback(async () => {
        if (attachedTabs.length === 0) return null;

        const results = await Promise.all(
            attachedTabs.map(async (tab) => {
                try {
                    const pageContext = await getTabContent(tab.tabId);
                    return pageContext === null ? null : /** @type {PageContext} */ ({ ...pageContext, tabId: tab.tabId });
                } catch (err) {
                    console.error('omnibar_getTabContent failed', err);
                    return null;
                }
            }),
        );

        const ready = /** @type {PageContext[]} */ (results.filter((ctx) => ctx !== null));
        return ready.length > 0 ? ready : null;
    }, [attachedTabs, getTabContent]);

    const state = useMemo(
        () => ({
            attachedTabs,
            isAttached,
            attachTab,
            removeTab,
            clearAttachedTabs,
            getTabsForSubmission,
        }),
        [attachedTabs, isAttached, attachTab, removeTab, clearAttachedTabs, getTabsForSubmission],
    );

    return state;
}

/** @typedef {ReturnType<typeof useTabAttachments>} TabAttachmentState */
