/**
 * This is the information that powers the global state/nav.
 *
 * @type {Record<import('./types').Step['id'], import('./types').Step>}
 */
export const pageDefinitions = {
    welcome: {
        id: 'welcome',
        kind: 'info'
    },
    we_can_help: {
        id: 'we_can_help',
        kind: 'info'
    },
    private_by_default: {
        id: 'private_by_default',
        kind: 'info'
    },
    cleaner_browsing: {
        id: 'cleaner_browsing',
        kind: 'info'
    },
    system_settings: {
        id: 'system_settings',
        kind: 'settings',
        rows: ['dock', 'import', 'default-browser'],
        active: 0
    },
    customize: {
        id: 'customize',
        kind: 'settings',
        rows: ['bookmarks', 'session-restore', 'home-shortcut'],
        active: 0
    },
    summary: {
        id: 'summary',
        kind: 'info'
    }
}
