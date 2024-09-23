/** @enum {string} */
export const supportStatus = {
    NOT_SUPPORTED: 'notSupported',
    PARTIAL_SUPPORT: 'partialSupport',
    FULL_SUPPORT: 'fullSupport'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableIcons = [
    'ads.svg',
    'cookie.svg',
    'fire.svg',
    'search.svg',
    'shield.svg',
    'video-player.svg'
]

export const tableIconPrefix = 'assets/img/steps/v3/'

/** @typedef {{ icon: tableIcons[number], title: string, statuses: supportStatus[] }} FeatureSupportData */

/** @type {FeatureSupportData[]} */
export const comparisonTableData = [
    {
        icon: 'search.svg',
        title: 'Search privately by default',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'shield.svg',
        title: 'Block 3rd party trackers',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.PARTIAL_SUPPORT, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'cookie.svg',
        title: 'Block cookie requests & popups',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'ads.svg',
        title: 'Block targeted ads',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'fire.svg',
        title: 'Erase browsing data swiftly',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    },
    {
        icon: 'video-player.svg',
        title: 'Watch YouTube more privately',
        statuses: [supportStatus.NOT_SUPPORTED, supportStatus.NOT_SUPPORTED, supportStatus.FULL_SUPPORT]
    }
]
