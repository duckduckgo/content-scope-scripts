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
