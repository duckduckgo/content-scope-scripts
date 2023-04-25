
/**
 * Check if the current document origin is on the tracker list, using the provided lookup trie.
 * @param {object} trackerLookup Trie lookup of tracker domains
 * @returns {boolean} True iff the origin is a tracker.
 */
export function isTrackerOrigin (trackerLookup, originHostname = document.location.hostname) {
    const parts = originHostname.split('.').reverse()
    let node = trackerLookup
    for (const sub of parts) {
        if (node[sub] === 1) {
            return true
        } else if (node[sub]) {
            node = node[sub]
        } else {
            return false
        }
    }
    return false
}
