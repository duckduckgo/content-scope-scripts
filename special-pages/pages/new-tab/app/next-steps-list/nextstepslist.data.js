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
    personalize: (t) => ({
        id: 'personalize',
        icon: 'customize-ntp',
        title: t('nextStepsList_personalize_title'),
        summary: t('nextStepsList_personalize_summary'),
        actionText: t('nextStepsList_personalize_actionText'),
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
        icon: 'import-bookmarks',
        title: t('nextStepsList_bringStuff_title'),
        summary: t('nextStepsList_bringStuff_summary'),
        actionText: t('nextStepsList_bringStuff_actionText'),
    }),
    /** @param {(translationId: keyof enStrings) => string} t */
    bringStuffAll: (t) => ({
        id: 'bringStuffAll',
        icon: 'import-passwords',
        title: t('nextStepsList_bringStuffAll_title'),
        summary: t('nextStepsList_bringStuffAll_summary'),
        actionText: t('nextStepsList_bringStuffAll_actionText'),
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

/**
 * Get the "Maybe Later" text
 * @param {(translationId: keyof enStrings) => string} t
 */
export const getMaybeLaterText = (t) => t('nextStepsList_maybeLater');

/**
 * Get the icon path for a given icon name and theme
 * @param {string} iconName - The base icon name (e.g., 'email-protection')
 * @param {'light' | 'dark'} theme - The current theme
 * @returns {string} The full path to the icon
 */
export function getIconPath(iconName, theme) {
    return `./next-steps-list/${iconName}-${theme}.png`;
}
