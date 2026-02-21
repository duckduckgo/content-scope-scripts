/**
 * @type {Record<string, {content: NonNullable<import("../../../types/new-tab").RMFData['content']>}>}
 */
export const rmfDataExamples = {
    small: {
        content: {
            messageType: 'small',
            id: 'id-small',
            titleText: 'Search services limited',
            descriptionText: 'Search services are impacted by a Bing outage, results may not be what you expect',
        },
    },
    medium: {
        content: {
            messageType: 'medium',
            id: 'id-2',
            icon: 'DDGAnnounce',
            titleText: 'New Search Feature!',
            descriptionText: 'DuckDuckGo now offers Instant Answers for quicker access to the information you need.',
        },
    },
    big_single_action: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single',
            titleText: 'New! Advanced AI for Subscribers',
            descriptionText:
                'Your subscription now includes access to more advanced models in Duck.ai, our private AI chat service. Always optional. No extra cost.',
            icon: 'DuckAi',
            primaryActionText: 'Try Duck.ai',
        },
    },
    big_two_action: {
        content: {
            messageType: 'big_two_action',
            id: 'id-big-two',
            titleText: 'Personal Information Removal Scan Complete',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'RadarCheckGreen',
            primaryActionText: 'View Results',
            secondaryActionText: 'Remind me later',
        },
    },
    big_two_action_overflow: {
        content: {
            id: 'big-two-overflow',
            messageType: 'big_two_action',
            icon: 'CriticalUpdate',
            titleText: 'Windows Update Recommended',
            descriptionText:
                'Support for Windows 10 is ending soon. Update to Windows 11 or newer before July 8, 2024, to keep getting the latest browser updates and improvements.',
            primaryActionText: 'How to update Windows',
            secondaryActionText: 'Remind me later, but only if I’m actually going to update soon',
        },
    },
    big_single_action_announce: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'Announce',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_app_update: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'AppUpdate',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_critical_update: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'CriticalUpdate',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_pir: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'PIR',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_radar: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Scrub your data from broker websites like PeopleFinder',
            icon: 'Radar',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_radar_check_purple: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Personal Information Removal',
            descriptionText: 'Your free personal information scan found 19 records about you on 3 different sites',
            icon: 'RadarCheckPurple',
            primaryActionText: 'View Results',
        },
    },
    big_single_action_subscription: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Something about a subscription',
            descriptionText: 'Something about a subscription. ',
            icon: 'Subscription',
            primaryActionText: 'Learn more',
        },
    },
    big_single_action_critical_update_url: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Updating macOS is recommended',
            descriptionText: 'Updating to the latest version will fix site loading issues and enhance security.',
            icon: 'CriticalUpdate',
            primaryActionText: 'How to Update',
        },
    },
    big_single_action_very_critical_update: {
        content: {
            messageType: 'big_single_action',
            id: 'id-big-single-alt',
            titleText: 'Updating macOS is recommended',
            descriptionText: 'Updating to the latest version will fix site loading issues and enhance security.',
            icon: 'VeryCriticalUpdate',
            primaryActionText: 'Update macOS',
        },
    },
};
