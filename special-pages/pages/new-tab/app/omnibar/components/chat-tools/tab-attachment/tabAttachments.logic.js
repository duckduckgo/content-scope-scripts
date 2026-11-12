/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {{ tabId: string, addedAtRelative: number }} AttachedTabEntry
 * @typedef {TabMetadata & { addedAtRelative: number }} AttachedTab
 */

/**
 * Resolves persisted attach entries against the live open-tab list.
 * Closed tabs are omitted so they do not count toward limits or submission.
 *
 * @param {AttachedTabEntry[]} attachedEntries
 * @param {TabMetadata[]} openTabs
 * @returns {AttachedTab[]}
 */
export function resolveAttachedTabs(attachedEntries, openTabs) {
    return attachedEntries.flatMap((entry) => {
        const tab = openTabs.find((t) => t.tabId === entry.tabId);
        return tab ? [/** @type {AttachedTab} */ ({ ...tab, addedAtRelative: entry.addedAtRelative })] : [];
    });
}

/**
 * Whether the number of open attached tabs exceeds the configured cap.
 * An absent `maxTabs` means no limit (kill switch off / legacy native).
 *
 * @param {number} attachedTabCount
 * @param {number} [maxTabs]
 * @returns {boolean}
 */
export function isTabLimitExceeded(attachedTabCount, maxTabs = Number.POSITIVE_INFINITY) {
    return attachedTabCount > maxTabs;
}
