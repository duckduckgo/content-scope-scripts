/**
 * @type {Record<string, {content: NonNullable<import("../../../types/new-tab").FreemiumPIRBannerData['content']>}>}

 */
export const freemiumPIRDataExamples = {
    unused: {
        content: {
            messageType: 'big_single_action',
            id: 'onboarding',
            titleText: 'Search services limited',
            descriptionText: 'Search services are impacted by a Bing outage, results may not be what you expect',
            actionText: 'Free Scan',
        },
    },
    used: {
        content: {
            messageType: 'big_single_action',
            id: 'scan_results',
            titleText: 'New Search Feature!',
            descriptionText: 'DuckDuckGo now offers Instant Answers for quicker access to the information you need.',
            actionText: 'View Results',
        },
    },
};
