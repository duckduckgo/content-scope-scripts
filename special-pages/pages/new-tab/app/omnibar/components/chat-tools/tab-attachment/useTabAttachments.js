import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';
import { OpenTabsContext } from './OpenTabsProvider';

const { useStateWithLocalPersistence } = TabAttachments;

export const MAX_TABS = 3;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').PageContext} PageContext
 *
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ tabId: string, addedAtRelative: number }} AttachedTabEntry
 * @typedef {TabMetadata & { addedAtRelative: number }} AttachedTab
 */

/**
 * @param {string|null|undefined} tabId — NTP tab the attachments are persisted under.
 * @param {number} [maxTabs] - Max attached tabs, from native `attachmentLimits.tabs.maxAttached`. Defaults to {@link MAX_TABS}.
 */
export function useTabAttachments(tabId, maxTabs = MAX_TABS) {
    const { getTabContent } = useContext(OmnibarContext);
    const { openTabs } = useContext(OpenTabsContext);
    const [attachedEntries, setAttachedEntries] = useStateWithLocalPersistence(tabId);

    // Attached subset of the live open-tab list; a tab that has since closed just stops rendering.
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

    // No hard cap on attaching tabs; exceeding maxTabs warns and blocks submit until removed —
    // mirroring the file-attachment soft cap (`useFileAttachments`).
    const tabLimitExceeded = attachedTabs.length > maxTabs;

    const clearAttachedTabs = useCallback(() => {
        setAttachedEntries([]);
    }, [setAttachedEntries]);

    /**
     * Extracts page content for each attached tab in parallel; drops failures.
     * Iterates `attachedTabs` (open tabs only), NOT `attachedEntries`, so submission uses the exact
     * same set the limit and the chips are computed from. Otherwise a closed-but-still-persisted
     * entry could ship a context that isn't counted against the cap.
     * @returns {Promise<PageContext[] | null>}
     */
    const getTabsForSubmission = useCallback(async () => {
        if (attachedTabs.length === 0) return null;

        const results = await Promise.all(
            attachedTabs.map(async ({ tabId: id }) => {
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
    }, [attachedTabs, getTabContent]);

    const state = useMemo(
        () => ({
            attachedTabs,
            isAttached,
            removeTab,
            toggleTab,
            clearAttachedTabs,
            getTabsForSubmission,
            tabLimitExceeded,
            maxTabs,
        }),
        [attachedTabs, isAttached, removeTab, toggleTab, clearAttachedTabs, getTabsForSubmission, tabLimitExceeded, maxTabs],
    );

    return state;
}
