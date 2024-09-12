/**
 * @enum {string}
 * @readonly
 */
export const SupportStatus = {
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

/** @typedef {{ icon: tableIcons[number], title: string, statuses: SupportStatus[] }} FeatureSupportData */

/** @type {(t: ReturnType<typeof import('../../types')['useTypedTranslation']>['t']) => FeatureSupportData[]} */
export const comparisonTableData = (t) => ([
    {
        icon: 'search.svg',
        title: t('comparison_searchPrivately'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.NOT_SUPPORTED, SupportStatus.FULL_SUPPORT]
    },
    {
        icon: 'shield.svg',
        title: t('comparison_blockTrackers'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.PARTIAL_SUPPORT, SupportStatus.FULL_SUPPORT]
    },
    {
        icon: 'cookie.svg',
        title: t('comparison_blockCookies'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.NOT_SUPPORTED, SupportStatus.FULL_SUPPORT]
    },
    {
        icon: 'ads.svg',
        title: t('comparison_blockAds'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.NOT_SUPPORTED, SupportStatus.FULL_SUPPORT]
    },
    {
        icon: 'fire.svg',
        title: t('comparison_eraseData'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.NOT_SUPPORTED, SupportStatus.FULL_SUPPORT]
    },
    {
        icon: 'video-player.svg',
        title: t('comparison_privateYoutube'),
        statuses: [SupportStatus.NOT_SUPPORTED, SupportStatus.NOT_SUPPORTED, SupportStatus.FULL_SUPPORT]
    }
])
