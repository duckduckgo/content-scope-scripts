/**
 * @import enStrings from "./strings.json"
 */

export const variants = {
    /** @param {(translationId: keyof enStrings) => string} t */
    pinAppToTaskbarWindows: (t) => ({
        id: 'pinAppToTaskbarWindows',
        icon: 'pin-taskbar',
        title: t('nextStepsList_pinAppToTaskbarWindows_title'),
        summary: t('nextStepsList_pinAppToTaskbarWindows_summary'),
        actionText: t('nextStepsList_pinAppToTaskbarWindows_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    addAppToDockMac: (t) => ({
        id: 'addAppToDockMac',
        icon: 'add-dock',
        title: t('nextStepsList_addAppToDockMac_title'),
        summary: t('nextStepsList_addAppToDockMac_summary'),
        actionText: t('nextStepsList_addAppToDockMac_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    personalizeBrowser: (t) => ({
        id: 'personalizeBrowser',
        icon: 'customize-ntp',
        title: t('nextStepsList_personalizeBrowser_title'),
        summary: t('nextStepsList_personalizeBrowser_summary'),
        actionText: t('nextStepsList_personalizeBrowser_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    duckplayer: (t) => ({
        id: 'duckplayer',
        icon: 'duck-player',
        title: t('nextStepsList_duckplayer_title'),
        summary: t('nextStepsList_duckplayer_summary'),
        actionText: t('nextStepsList_duckplayer_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    youtubeAdBlocking: (t) => ({
        id: 'youtubeAdBlocking',
        icon: 'duck-player',
        title: t('nextStepsList_youtubeAdBlocking_title'),
        summary: t('nextStepsList_youtubeAdBlocking_summary'),
        actionText: t('nextStepsList_youtubeAdBlocking_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    emailProtection: (t) => ({
        id: 'emailProtection',
        icon: 'email-protection',
        title: t('nextStepsList_emailProtection_title'),
        summary: t('nextStepsList_emailProtection_summary'),
        actionText: t('nextStepsList_emailProtection_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    bringStuff: (t) => ({
        id: 'bringStuff',
        icon: 'import-passwords',
        title: t('nextStepsList_bringStuff_title'),
        summary: t('nextStepsList_bringStuff_summary'),
        actionText: t('nextStepsList_bringStuff_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    defaultApp: (t) => ({
        id: 'defaultApp',
        icon: 'set-default',
        title: t('nextStepsList_defaultApp_title'),
        summary: t('nextStepsList_defaultApp_summary'),
        actionText: t('nextStepsList_defaultApp_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    subscription: (t) => ({
        id: 'subscription',
        icon: 'subscription',
        title: t('nextStepsList_subscription_title'),
        summary: t('nextStepsList_subscription_summary'),
        actionText: t('nextStepsList_subscription_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    sync: (t) => ({
        id: 'sync',
        icon: 'sync',
        title: t('nextStepsList_sync_title'),
        summary: t('nextStepsList_sync_summary'),
        actionText: t('nextStepsList_sync_actionText'),
    }),
};

/** @type {Readonly<Record<string, string>>} */
const rebrandIconPaths = {
    'add-dock': './icons/Dock-Add-Mac-96.svg',
    'pin-taskbar': './icons/Dock-Add-Windows-96.svg',
    'customize-ntp': './icons/Browser-Redesign-96.svg',
    'duck-player': './icons/YouTube-Clean-96.svg',
    'email-protection': './icons/Email-Protection-96.svg',
    'import-passwords': './icons/Passwords-Import-96.svg',
    'set-default': './icons/Default-App-96.svg',
    subscription: './icons/Desktop-Mobile-Subscription-96.svg',
    sync: './icons/Sync-96.svg',
};

/**
 * Get the icon path for a given icon name and theme
 * @param {string} iconName - The base icon name (e.g., 'email-protection')
 * @param {'light' | 'dark'} theme - The current theme
 * @param {boolean} isRebrandEnabled - Whether the NTP rebrand is enabled
 * @returns {string} The full path to the icon
 */
export function getIconPath(iconName, theme, isRebrandEnabled = false) {
    if (isRebrandEnabled && rebrandIconPaths[iconName]) {
        return rebrandIconPaths[iconName];
    }

    return `./next-steps-list/${iconName}-${theme}.png`;
}
