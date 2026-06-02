import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';

const { useStateWithLocalPersistence } = TabAttachments;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').PageContext} PageContext
 */

/**
 * @typedef {object} AttachedTab
 * @property {string} tabId — Identifier of the source tab, used to dedupe and reconcile with metadata.
 * @property {'pending'|'ready'|'error'} status — Lifecycle of the content fetch.
 * @property {TabMetadata} metadata — Tab metadata captured at attach-time. Used to render the chip while content is still loading and as a fallback when the page context is incomplete.
 * @property {PageContext|null} pageContext — Native-extracted content, populated once `getTabContent` resolves. `null` when extraction failed.
 */

/**
 * @param {string|null|undefined} tabId — The NTP tab these attachments belong to. Used to persist
 * them per-tab so they survive switching between browser tabs (see `PersistentAttachmentsProvider`).
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
        async (tabToAttach) => {
            /** @type {AttachedTab} */
            const pending = { tabId: tabToAttach.tabId, status: 'pending', metadata: tabToAttach, pageContext: null };

            setAttachedTabs((prev) => {
                const idx = prev.findIndex((tab) => tab.tabId === tabToAttach.tabId);
                if (idx === -1) return [...prev, pending];

                return prev.map((tab, i) => (i === idx ? pending : tab));
            });

            try {
                const pageContext = await getTabContent(tabToAttach.tabId);
                setAttachedTabs((prev) => {
                    if (!prev.some((tab) => tab.tabId === tabToAttach.tabId)) return prev;

                    if (pageContext === null) {
                        return prev.filter((tab) => tab.tabId !== tabToAttach.tabId);
                    }

                    return prev.map((tab) =>
                        tab.tabId === tabToAttach.tabId
                            ? { ...tab, status: /** @type {const} */ ('ready'), pageContext: { ...pageContext, tabId: tabToAttach.tabId } }
                            : tab,
                    );
                });
            } catch (err) {
                console.error('omnibar_getTabContent failed', err);
                setAttachedTabs((prev) => prev.filter((t) => t.tabId !== tabToAttach.tabId));
            }
        },
        [getTabContent, setAttachedTabs],
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
     * @returns {PageContext[] | null}
     */
    const getTabsForSubmission = useCallback(() => {
        const ready = attachedTabs.filter((tab) => tab.status === 'ready' && tab.pageContext !== null);
        if (ready.length === 0) return null;
        return ready.map((tab) => /** @type {PageContext} */ ({ ...tab.pageContext, tabId: tab.tabId }));
    }, [attachedTabs]);

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
