/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * Filter tabs by a case-insensitive substring match against title + URL.
 *
 * Lives in its own module so it can be unit-tested without dragging in Preact
 * or the CSS modules referenced by the renderer.
 *
 * @param {TabMetadata[]} tabs
 * @param {string} query
 * @returns {TabMetadata[]}
 */
export function filterTabs(tabs, query) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return tabs;
    return tabs.filter((t) => t.title.toLowerCase().includes(trimmed) || t.url.toLowerCase().includes(trimmed));
}
