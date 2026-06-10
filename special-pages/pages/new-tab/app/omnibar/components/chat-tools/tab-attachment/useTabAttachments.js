import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';
import { OpenTabsContext } from './OpenTabsProvider';

const { useStateWithLocalPersistence } = TabAttachments;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').PageContext} PageContext
 *
 * `addedAtRelative` is a `performance.now()` value used only to sort attachments into the
 * order the user attached them; it's relative and monotonic, not a wall-clock timestamp.
 * @typedef {{ tabId: string, addedAtRelative: number }} AttachedTabEntry — persisted per-tab attachment record
 * @typedef {TabMetadata & { addedAtRelative: number }} AttachedTab — live tab metadata carrying its attach order, for chip rendering
 */

/**
 * @param {string|null|undefined} tabId — The NTP tab these attachments belong to. Used to persist
 * them per-tab so they survive switching between browser tabs
 */
export function useTabAttachments(tabId) {
    const { getTabContent } = useContext(OmnibarContext);
    const { openTabs } = useContext(OpenTabsContext);
    const [attachedEntries, setAttachedEntries] = useStateWithLocalPersistence(tabId);

    // Chips are the attached subset of the live open-tab list, looked up by id, each carrying its
    // attach order. A tab that's no longer open (closed since it was attached) just stops rendering.
    const attachedTabs = useMemo(() => {
        return attachedEntries.flatMap((entry) => {
            const tab = openTabs.find((t) => t.tabId === entry.tabId);
            return tab ? [/** @type {AttachedTab} */ ({ ...tab, addedAtRelative: entry.addedAtRelative })] : [];
        });
    }, [attachedEntries, openTabs]);

    const isAttached = useCallback(
        /** @param {string} tabId */
        (tabId) => attachedEntries.some((entry) => entry.tabId === tabId),
        [attachedEntries],
    );

    const attachTab = useCallback(
        /** @param {TabMetadata} tabToAttach */
        (tabToAttach) => {
            setAttachedEntries((prev) =>
                prev.some((entry) => entry.tabId === tabToAttach.tabId)
                    ? prev
                    : [...prev, { tabId: tabToAttach.tabId, addedAtRelative: performance.now() }],
            );
        },
        [setAttachedEntries],
    );

    const removeTab = useCallback(
        /** @param {string} tabId */
        (tabId) => {
            setAttachedEntries((prev) => prev.filter((entry) => entry.tabId !== tabId));
        },
        [setAttachedEntries],
    );

    const toggleTab = useCallback(
        /** @param {TabMetadata} tab */
        (tab) => {
            setAttachedEntries((prev) =>
                prev.some((entry) => entry.tabId === tab.tabId)
                    ? prev.filter((entry) => entry.tabId !== tab.tabId)
                    : [...prev, { tabId: tab.tabId, addedAtRelative: performance.now() }],
            );
        },
        [setAttachedEntries],
    );

    const clearAttachedTabs = useCallback(() => {
        setAttachedEntries([]);
    }, [setAttachedEntries]);

    /**
     * Extract page content for each attached tab in parallel, on submit. Drops
     * tabs whose extraction fails or returns null.
     * @returns {Promise<PageContext[] | null>}
     */
    const getTabsForSubmission = useCallback(async () => {
        if (attachedEntries.length === 0) return null;

        const results = await Promise.all(
            attachedEntries.map(async ({ tabId: id }) => {
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
    }, [attachedEntries, getTabContent]);

    const state = useMemo(
        () => ({
            attachedTabs,
            isAttached,
            attachTab,
            removeTab,
            toggleTab,
            clearAttachedTabs,
            getTabsForSubmission,
        }),
        [attachedTabs, isAttached, attachTab, removeTab, toggleTab, clearAttachedTabs, getTabsForSubmission],
    );

    return state;
}

/** @typedef {ReturnType<typeof useTabAttachments>} TabAttachmentState */
