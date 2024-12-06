/**
 * @import { PrivacyProData } from "../../../types/new-tab.js";
 * @type {Record<string, PrivacyProData>}
 */
export const data = {
    basic: {
        personalInformationRemoval: {
            nextScanDate: `${new Date('9/27/2024')}`,
            status: 'active',
        },
        identityRestoration: {
            coveredSinceDate: `${new Date('9/27/2024')}`,
        },
        vpn: {
            location: {
                countryCode: 'us',
                name: 'United States',
            },
            status: 'connected',
        },
    },
    unsubscribed: null,
    locationString: {
        personalInformationRemoval: {
            nextScanDate: `${new Date('8/11/2024')}`,
            status: 'active',
        },
        identityRestoration: {
            coveredSinceDate: `${new Date('8/11/2024')}`,
        },
        vpn: {
            location: 'United Kingdom',
            status: 'connected',
        },
    },
};
