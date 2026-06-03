import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';
import { OpenTabsContext } from './OpenTabsProvider';

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
    const { openTabs } = useContext(OpenTabsContext);

    const [attachedIds, setAttachedIds] = useStateWithLocalPersistence(tabId);

    // Chips are the attached subset of the live open-tab list, looked up by id. A tab that's no
    // longer open (closed since it was attached) just stops rendering.
    const attachedTabs = useMemo(
        () =>
            attachedIds.flatMap((id) => {
                const tab = openTabs.find((t) => t.tabId === id);
                return tab ? [tab] : [];
            }),
        [attachedIds, openTabs],
    );

    const isAttached = useCallback(
        /** @param {string} tabId */
        (tabId) => attachedIds.includes(tabId),
        [attachedIds],
    );

    const attachTab = useCallback(
        /** @param {TabMetadata} tabToAttach */
        (tabToAttach) => {
            setAttachedIds((prev) => (prev.includes(tabToAttach.tabId) ? prev : [...prev, tabToAttach.tabId]));
        },
        [setAttachedIds],
    );

    const removeTab = useCallback(
        /** @param {string} tabId */
        (tabId) => {
            setAttachedIds((prev) => prev.filter((id) => id !== tabId));
        },
        [setAttachedIds],
    );

    const clearAttachedTabs = useCallback(() => {
        setAttachedIds([]);
    }, [setAttachedIds]);

    /**
     * Extract page content for each attached tab in parallel, on submit. Drops
     * tabs whose extraction fails or returns null.
     * @returns {Promise<PageContext[] | null>}
     */
    const getTabsForSubmission = useCallback(async () => {
        if (attachedIds.length === 0) return null;

        const results = await Promise.all(
            attachedIds.map(async (id) => {
                try {
                    const pageContext = await getTabContent(id);
                    return pageContext === null ? null : /** @type {PageContext} */ ({ ...pageContext, tabId: id });
                } catch (err) {
                    console.error('omnibar_getTabContent failed', err);
                    return null;
                }
            }),
        );

        const ready = /** @type {PageContext[]} */ (results.filter((ctx) => ctx !== null));
        return ready.length > 0 ? ready : null;
    }, [attachedIds, getTabContent]);

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
