/**
 * @import { PrivacyProData } from "../../../types/new-tab.js";
 * @type {Record<string, PrivacyProData>}
 */
export const data = {
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
