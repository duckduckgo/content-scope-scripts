/**
 * @enum {string}
 * @readonly
 */
export const SupportStatus = {
    NOT_SUPPORTED: 'notSupported',
    PARTIAL_SUPPORT: 'partialSupport',
    FULL_SUPPORT: 'fullSupport',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableIcons = ['ads.svg', 'cookie.svg', 'fire.svg', 'search.svg', 'shield.svg', 'video-player.svg'];

export const tableIconPrefix = 'assets/img/steps/v3/';

/** @typedef {{ icon: tableIcons[number], title: string, statuses: Record<'chrome'|'safari'|'ddg', SupportStatus> }} FeatureSupportData */

/**
 * Comparison table matrix
 *
 * Safari was removed from the latest comparison table layout. Keeping it the data just in case it comes back.
 *
 * @type {(t: ReturnType<typeof import('../../types')['useTypedTranslation']>['t'], adBlockingEnabled?: boolean) => FeatureSupportData[]} */
export const comparisonTableData = (t, adBlockingEnabled = false) => [
    {
        icon: 'search.svg',
        title: t('comparison_searchPrivately'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'shield.svg',
        title: t('comparison_blockTrackers'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.PARTIAL_SUPPORT,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'cookie.svg',
        title: t('comparison_blockCookies'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'ads.svg',
        title: t('comparison_blockAds'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'fire.svg',
        title: t('comparison_eraseData'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'video-player.svg',
        title: adBlockingEnabled ? t('comparison_youtubeAdFree') : t('comparison_privateYoutube'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
];
