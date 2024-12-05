/**
 * @import enStrings from "./strings.json"
 * @import ntpStrings from "../strings.json"
 */
export const variants = {
    /** @param {(translationId: keyof enStrings) => string} t */
    basic: {
        personalInformationRemoval: {
            nextScanDate: `${new Date()}`,
            status: 'inactive',
        },
        identityRestoration: {
            coveredSinceDate: `${new Date()}`,
        },
        vpn: {
            location: {
                countryCode: 'us',
                name: 'United States',
            },
            status: 'connected',
        },
    },
};

export const otherText = {
    /** @param {(translationId: keyof ntpStrings) => string} t */
    showMore: (t) => t('ntp_show_more'),
    /** @param {(translationId: keyof ntpStrings) => string} t */
    showLess: (t) => t('ntp_show_less'),
};
