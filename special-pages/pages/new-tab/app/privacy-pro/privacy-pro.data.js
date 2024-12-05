/**
 * @import enStrings from "./strings.json"
 * @import ntpStrings from "../strings.json"
 */
export const variants = {
    /** @param {(translationId: keyof enStrings) => string} t */
    basic: {
        personalInformationRemoval: {
            nextScanDate: `${new Date()}`,
            status: 'active',
        },
        identityRestoration: {
            coveredSince: `${new Date()}`,
        },
        vpn: {
            location: {
                cityName: 'Denver',
                countryCode: 'us',
                countryName: 'United States',
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
