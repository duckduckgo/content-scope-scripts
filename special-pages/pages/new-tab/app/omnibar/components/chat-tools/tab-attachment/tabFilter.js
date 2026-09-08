/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * Case-insensitive substring match, scored (title = 2, URL = 1, both = 3), sorted by score with
 * ties keeping input order. Matches the Duck.ai tab-picker filter.
 *
 * @param {TabMetadata[]} tabs
 * @param {string} query
 * @param {string} [currentTabId] - Hoisted to the front if it survives the filter. Unused on NTP until `TabMetadata` marks a current tab.
 * @returns {TabMetadata[]}
 */
export function filterTabs(tabs, query, currentTabId) {
    const trimmedQuery = query.trim().toLowerCase();
    const result = trimmedQuery
        ? tabs
              .map((tab, inputIndex) => {
                  let score = 0;
                  if (tab.title.toLowerCase().includes(trimmedQuery)) score += 2;
                  if (tab.url.toLowerCase().includes(trimmedQuery)) score += 1;
                  return { tab, score, inputIndex };
              })
              .filter((entry) => entry.score > 0)
              .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.inputIndex - b.inputIndex))
              .map((entry) => entry.tab)
        : tabs;

    if (!currentTabId) return result;
    const currentIndex = result.findIndex((tab) => tab.tabId === currentTabId);
    if (currentIndex <= 0) return result;

    return [result[currentIndex], ...result.slice(0, currentIndex), ...result.slice(currentIndex + 1)];
}
