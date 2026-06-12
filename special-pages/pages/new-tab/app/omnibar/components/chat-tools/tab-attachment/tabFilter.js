/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * @param {TabMetadata[]} tabs
 * @param {string} query
 * @returns {TabMetadata[]}
 */
export function filterTabs(tabs, query) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return tabs;
    return tabs.filter((t) => t.title.toLowerCase().includes(trimmed) || t.url.toLowerCase().includes(trimmed));
}
