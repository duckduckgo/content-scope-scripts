/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 * @typedef {{ tabId: string, addedAtRelative: number }} AttachedTabEntry
 * @typedef {TabMetadata & { addedAtRelative: number }} AttachedTab
 */

/**
 * Attached subset of the live open-tab list. A tab that has since closed is omitted
 * so cap counting and submission use the same set the chips render.
 *
 * @param {AttachedTabEntry[]} attachedEntries
 * @param {TabMetadata[]} openTabs
 * @returns {AttachedTab[]}
 */
export function selectAttachedOpenTabs(attachedEntries, openTabs) {
    return attachedEntries.flatMap((entry) => {
        const tab = openTabs.find((t) => t.tabId === entry.tabId);
        return tab ? [/** @type {AttachedTab} */ ({ ...tab, addedAtRelative: entry.addedAtRelative })] : [];
    });
}

/**
 * @param {number} attachedOpenTabCount
 * @param {number} [maxTabs]
 * @returns {boolean}
 */
export function isTabLimitExceeded(attachedOpenTabCount, maxTabs = Number.POSITIVE_INFINITY) {
    return attachedOpenTabCount > maxTabs;
}
