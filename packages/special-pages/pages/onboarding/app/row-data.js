import { h } from 'preact'
import { Button, ButtonBar } from './components/Buttons'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { availableIcons } from './components/ListItem'
import { Switch } from './components/Switch'
import { HomeButtonDropdown } from './components/Popover'
import { BeforeAfter } from './components/BeforeAfter'

/**
 * @typedef {(args: { accept: AcceptCallback; deny: DenyCallback; pending: boolean}) => import("preact").ComponentChild} ChildFn
 * @typedef {(args: { accept: AcceptCallback, deny: DenyCallback; enabled: boolean; pending: boolean}) => import("preact").ComponentChild} AcceptFn
 *
 * @typedef {(choice?: string) => void} AcceptCallback
 * @typedef {() => void} DenyCallback
 *
 * @typedef {object} RowData
 * @property {'one-time' | 'toggle'} kind
 * @property {import('./types').SystemValueId} id
 * @property {typeof availableIcons[number]} icon
 * @property {string} title
 * @property {string} secondaryText
 * @property {string} summary
 *
 */

/**
 * Row items that do not cause system settings to be altered
 * @type {Record<string, Omit<RowData, "id"> & { id: string }>}
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
        title: 'While watching Youtube',
        secondaryText: 'Enforce YouTube’s strictest privacy settings by default. Watch videos in a clean viewing experience without personalized ads.',
        kind: 'one-time'
    }
}

/** @type {Record<import('./types').SystemValueId, Omit<RowData, 'child' | 'accept'>>} */
export const settingsRowItems = {
    dock: {
        id: 'dock',
        icon: 'dock.png',
        title: 'Keep DuckDuckGo in your Dock',
        secondaryText: 'Get to DuckDuckGo faster.',
        summary: 'Keep in dock',
        kind: 'one-time'
    },
    import: {
        id: 'import',
        icon: 'import.png',
        title: 'Bring your stuff',
        secondaryText: 'Import bookmarks, favorites, and passwords.',
        summary: 'Import your stuff',
        kind: 'one-time'
    },
    'default-browser': {
        id: 'default-browser',
        icon: 'switch.png',
        title: 'Switch your default browser',
        secondaryText: 'Always browse privately by default.',
        summary: 'Default browser',
        kind: 'one-time'
    },
    bookmarks: {
        id: 'bookmarks',
        icon: 'bookmarks.png',
        title: 'Put your bookmarks in easy reach',
        secondaryText: 'Show a bookmarks bar with your favorite bookmarks.',
        summary: 'Bookmarks Bar',
        kind: 'toggle'
    },
    'session-restore': {
        id: 'session-restore',
        icon: 'session-restore.png',
        title: 'Pick up where you left off',
        secondaryText: 'Always restart with all windows from your last session.',
        summary: 'Session Restore',
        kind: 'toggle'
    },
    'home-shortcut': {
        id: 'home-shortcut',
        icon: 'home.png',
        title: 'Add a shortcut to your homepage',
        secondaryText: 'Show a home button in your toolbar.',
        summary: 'Home Button',
        kind: 'one-time'
    }
}

export const beforeAfterChildren = {
    fewerAds: (advance) => (
        <BeforeAfter onDone={advance}
            btnAfter="See without tracker blocking"
            btnBefore="See with tracker blocking"
            imgBefore="./assets/img/steps/while-browsing-without.jpg"
            imgAfter="./assets/img/steps/while-browsing-with.jpg"
        />
    ),
    duckPlayer: (advance) => (
        <BeforeAfter
            onDone={advance}
            btnAfter="See without Duck Player"
            btnBefore="See with Duck Player"
            imgBefore="./assets/img/steps/without-duckplayer.jpg"
            imgAfter="./assets/img/steps/with-duckplayer.jpg"
        />
    )
}

/**
 * @type {Record<import('./types').SystemValueId, { child: ChildFn; accept: AcceptFn }>}
 */
export const settingsElements = {
    dock: {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Keep in Dock</Button>
                </ButtonBar>
            )
        },
        accept: ({ accept, pending }) => {
            return <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Keep in Dock</Button>
        }
    },
    import: {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Import</Button>
                </ButtonBar>
            )
        },
        accept: ({ accept, pending }) => {
            return <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Import</Button>
        }
    },
    'default-browser': {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Make Default</Button>
                </ButtonBar>
            )
        },
        accept: ({ accept, pending }) => {
            return <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Make Default</Button>
        }
    },
    bookmarks: {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Show Bookmarks
                        Bar</Button>
                </ButtonBar>
            )
        },
        accept: ({ accept, deny, enabled, pending }) => {
            return <Switch pending={pending} checked={enabled} onChecked={accept} onUnchecked={deny} />
        }
    },
    'session-restore': {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <Button disabled={pending} variant={'secondary'} onClick={() => accept()}>Enable Session
                        Restore</Button>
                </ButtonBar>
            )
        },
        accept: ({ accept, deny, enabled, pending }) => {
            return <Switch pending={pending} checked={enabled} onChecked={accept} onUnchecked={deny} />
        }
    },
    'home-shortcut': {
        child: ({ accept, deny, pending }) => {
            return (
                <ButtonBar>
                    <Button disabled={pending} variant={'secondary'} onClick={() => deny()}>Skip</Button>
                    <HomeButtonDropdown label={'long'} setEnabled={(value) => accept(value)}/>
                </ButtonBar>
            )
        },
        accept: ({ accept }) => {
            return (
                <ButtonBar>
                    <HomeButtonDropdown label={'short'} setEnabled={(value) => accept(value)} />
                </ButtonBar>
            )
        }
    }
}
