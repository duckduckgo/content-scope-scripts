/**
 * @import enStrings from "./strings.json"
 * @import ntpStrings from "../strings.json"
 */
export const variants = {
    /** @param {(translationId: keyof enStrings) => string} t */
    bringStuff: (t) => ({
        id: 'bringStuff',
        icon: 'Bring-Stuff',
        title: t('nextSteps_bringStuff_title'),
        summary: t('nextSteps_bringStuff_summary'),
        actionText: t('nextSteps_bringStuff_actionText'),
    }),
};

export const otherText = {
    /** @param {(translationId: keyof ntpStrings) => string} t */
    showMore: (t) => t('ntp_show_more'),
    /** @param {(translationId: keyof ntpStrings) => string} t */
    showLess: (t) => t('ntp_show_less'),
};
