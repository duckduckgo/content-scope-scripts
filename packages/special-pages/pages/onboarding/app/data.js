// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { availableIcons } from './components/ListItem'

/**
 * @typedef {Record<import('./types').Step['id'], import('./types').Step>} StepDefinitions
 */

/**
 * @typedef {object} RowData
 * @property {'one-time' | 'toggle'} kind
 * @property {import('./types').SystemValueId} id
 * @property {typeof availableIcons[number]} icon
 * @property {string} title
 * @property {string} secondaryText
 * @property {string} acceptText
 * @property {string} summary
 */

/**
 * This is the information that powers the global state/nav.
 * This deliberately does not include the UI state or any strings
 * that might need translating. This is here purely as a structure that
 * the native layer can override.
 *
 * See {@link OnboardingMessages} for more details.
 *
 * For example, on Windows 10 the `systemSettings` section does not contain a 'dock' row,
 * but on Windows 11 it does.
 *
 * @type {Record<import('./types').Step['id'], import('./types').Step>}
 */
export const stepDefinitions = {
    welcome: {
        id: 'welcome',
        kind: 'info'
    },
    getStarted: {
        id: 'getStarted',
        kind: 'info'
    },
    privateByDefault: {
        id: 'privateByDefault',
        kind: 'info'
    },
    cleanerBrowsing: {
        id: 'cleanerBrowsing',
        kind: 'info'
    },
    systemSettings: {
        id: 'systemSettings',
        kind: 'settings',
        rows: ['import', 'default-browser']
    },
    customize: {
        id: 'customize',
        kind: 'settings',
        rows: ['bookmarks', 'session-restore', 'home-shortcut']
    },
    summary: {
        id: 'summary',
        kind: 'info'
    }
}

/**
 * Row items that do not cause system settings to be altered
 * @type {Record<string, Omit<RowData, "id" | "acceptText"> & { id: string }>}
 */
export const noneSettingsRowItems = {
    search: {
        id: 'search',
        summary: 'Private Search',
        icon: 'search.png',
        title: 'Private Search',
        secondaryText: "We don't track you. Ever.",
        kind: 'one-time'
    },
    trackingProtection: {
        id: 'trackingProtection',
        summary: 'Advanced Tracking Protection',
        icon: 'shield.png',
        title: 'Advanced Tracking Protection',
        secondaryText: 'We block most trackers before they even load.',
        kind: 'one-time'
    },
    cookieManagement: {
        id: 'cookieManagement',
        summary: 'Automatic Cookie Pop-Up Blocking',
        icon: 'cookie.png',
        title: 'Automatic Cookie Pop-Up Blocking',
        secondaryText: 'We deny optional cookies for you & hide pop-ups.',
        kind: 'one-time'
    },
    fewerAds: {
        id: 'fewerAds',
        summary: 'See Fewer Ads & Pop-Ups',
        icon: 'browsing.png',
        title: 'While browsing the web',
        secondaryText: 'Our tracker blocking eliminates most ads.',
        kind: 'one-time'
    },
    duckPlayer: {
        id: 'duckPlayer',
        summary: 'Distraction-Free YouTube',
        icon: 'duckplayer.png',
        title: 'While watching YouTube',
        secondaryText: 'Enforce YouTube’s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.',
        kind: 'one-time'
    }
}

/** @type {Record<import('./types').SystemValueId, RowData>} */
export const settingsRowItems = {
    dock: {
        id: 'dock',
        icon: 'dock.png',
        title: 'Keep DuckDuckGo in your Taskbar',
        secondaryText: 'Get to DuckDuckGo faster.',
        summary: 'Pin to Taskbar',
        kind: 'one-time',
        acceptText: 'Pin to Taskbar'
    },
    import: {
        id: 'import',
        icon: 'import.png',
        title: 'Bring your stuff',
        secondaryText: 'Import bookmarks, favorites, and passwords.',
        summary: 'Import Your Stuff',
        kind: 'one-time',
        acceptText: 'Import'
    },
    'default-browser': {
        id: 'default-browser',
        icon: 'switch.png',
        title: 'Switch your default browser',
        secondaryText: 'Always browse privately by default.',
        summary: 'Default Browser',
        kind: 'one-time',
        acceptText: 'Make Default'
    },
    bookmarks: {
        id: 'bookmarks',
        icon: 'bookmarks.png',
        title: 'Put your bookmarks in easy reach',
        secondaryText: 'Show a bookmarks bar with your favorite bookmarks.',
        summary: 'Bookmarks Bar',
        kind: 'toggle',
        acceptText: 'Show Bookmarks Bar'
    },
    'session-restore': {
        id: 'session-restore',
        icon: 'session-restore.png',
        title: 'Pick up where you left off',
        secondaryText: 'Always restart with all windows from your last session.',
        summary: 'Session Restore',
        kind: 'toggle',
        acceptText: 'Enable Session Restore'
    },
    'home-shortcut': {
        id: 'home-shortcut',
        icon: 'home.png',
        title: 'Add a shortcut to your homepage',
        secondaryText: 'Show a home button in your toolbar.',
        summary: 'Home Button',
        kind: 'toggle',
        acceptText: 'Show Home Button'
    }
}

export const beforeAfterMeta = /** @type {const} */({
    fewerAds: {
        btnBeforeText: 'See With Tracker Blocking',
        btnAfterText: 'See Without Tracker Blocking',
        artboard: 'Ad Blocking',
        inputName: 'DDG?',
        stateMachine: 'State Machine 2'
    },
    duckPlayer: {
        btnBeforeText: 'See With Duck Player',
        btnAfterText: 'See Without Duck Player',
        artboard: 'Duck Player',
        inputName: 'Duck Player?',
        stateMachine: 'State Machine 2'
    }
})
