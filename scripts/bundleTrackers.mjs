import fetch from 'node-fetch'
import { writeFileSync } from 'fs'

const tdsUrl = 'https://staticcdn.duckduckgo.com/trackerblocking/v4/tds.json'
const resp = await fetch(tdsUrl)
const tds = await resp.json()

// Build a trie of tracker domains, starting with the broadest subdomain. Leaves are set to 1 to indicate success
// i.e. lookup['com']['example'] === 1 if example.com is a tracker domain
const trackerLookupTrie = {}
function insert (domainParts, node) {
    if (domainParts.length === 1) {
        node[domainParts[0]] = 1
    } else if (node[domainParts[0]]) {
        insert(domainParts.slice(1), node[domainParts[0]])
    } else {
        node[domainParts[0]] = {}
        insert(domainParts.slice(1), node[domainParts[0]])
    }
}
Object.keys(tds.trackers).forEach((tracker) => {
    insert(tracker.split('.').reverse(), trackerLookupTrie)
})

console.log(JSON.stringify(trackerLookupTrie))
