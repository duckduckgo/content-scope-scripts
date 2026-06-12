import { useCallback, useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { TabAttachments } from '../../PersistentOmnibarValuesProvider';
import { OpenTabsContext } from './OpenTabsProvider';

const { useStateWithLocalPersistence } = TabAttachments;

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {import('../../../../../types/new-tab.js').PageContext} PageContext
 *
 * `addedAtRelative` is a `performance.now()` value used to sort attachments by attach order.
 * @typedef {{ tabId: string, addedAtRelative: number }} AttachedTabEntry
 * @typedef {TabMetadata & { addedAtRelative: number }} AttachedTab
 */

/** @param {string|null|undefined} tabId — NTP tab the attachments are persisted under. */
export function useTabAttachments(tabId) {
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

    const clearAttachedTabs = useCallback(() => {
        setAttachedEntries([]);
    }, [setAttachedEntries]);

    /**
     * Extracts page content for each attached tab in parallel; drops failures.
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
            removeTab,
            toggleTab,
            clearAttachedTabs,
            getTabsForSubmission,
        }),
        [attachedTabs, isAttached, removeTab, toggleTab, clearAttachedTabs, getTabsForSubmission],
    );

    return state;
}
