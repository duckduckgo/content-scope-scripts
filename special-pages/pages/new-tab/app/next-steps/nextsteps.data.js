// // import { TranslationContext } from "../../../../shared/components/TranslationsProvider"

// /**
//  * @typedef {ReturnType<useTypedTranslation>['t']} TranslationFn
//  */

// /**
//  * This is a wrapper to only allow keys from the default translation file
//  * @type {() => { t: (key: keyof json, replacements?: Record<string, string>) => string }}
//  */
// // export function useTypedTranslation () {
// //     return {
// //         t: useContext(TranslationContext).t
// //     }
// // }

// /**

//  * @type {Record<string, (t: import('../types').TranslationFn) => Omit<RowData, "id" | "acceptText"> & { id: string }>}
//  */

// type variant {
// id: string,

// }
export const variants = {
    // /**
    //  * @param {import('../types').TranslationFn} t
    //  */
    bringStuff: (t) => ({
        id: 'bring-stuff',
        icon: 'Bring-Stuff',
        title: t('nextSteps_bringStuff_title'),
        summary: t('nextSteps_bringStuff_summary'),
        actionText: t('nextSteps_bringStuff_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    defaultApp: (t) => ({
        id: 'defaultApp',
        icon: 'Default-App',
        title: t('nextSteps_defaultApp_title'),
        summary: t('nextSteps_defaultApp_summary'),
        actionText: t('nextSteps_defaultApp_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    blockCookies: (t) => ({
        id: 'blockCookies',
        icon: 'Cookie-Pops',
        title: t('nextSteps_blockCookies_title'),
        summary: t('nextSteps_blockCookies_summary'),
        actionText: t('nextSteps_blockCookies_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    emailProtection: (t) => ({
        id: 'emailProtection',
        icon: 'Email-Protection',
        title: t('nextSteps_emailProtection_title'),
        summary: t('nextSteps_emailProtection_summary'),
        actionText: t('nextSteps_emailProtection_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    duckplayer: (t) => ({
        id: 'duckplayer',
        icon: 'Tube-Clean',
        title: t('nextSteps_duckPlayer_title'),
        summary: t('nextSteps_duckPlayer_summary'),
        actionText: t('nextSteps_duckPlayer_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    addAppDockMac: (t) => ({
        id: 'addAppToDockMac',
        icon: 'Dock-Add-Mac',
        title: t('nextSteps_addAppDockMac_title'),
        summary: t('nextSteps_addAppDockMac_summary'),
        actionText: t('nextSteps_addAppDockMac_actionText'),
    }),
    // /**
    //  * @param {import('./types').TranslationFn} t
    //  */
    pinAppToTaskbarWindows: (t) => ({
        id: 'pinAppToTaskbarWindows',
        icon: 'Dock-Add-Windows',
        title: t('nextSteps_pinAppToTaskbarWindows_title'),
        summary: t('nextSteps_pinAppToTaskbarWindows_summary'),
        actionText: t('nextSteps_pinAppToTaskbarWindows_actionText'),
    }),
};

export const otherText = {
    dismiss: (t) => t('ntp_dismiss'),
    showMore: (t) => t('ntp_showMore'),
    showLess: (t) => t('ntp_showLess'),
    nextSteps_sectionTitle: (t) => t('nextSteps_sectionTitle'),
};
