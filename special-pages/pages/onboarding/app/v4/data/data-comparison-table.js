/**
 * @enum {string}
 * @readonly
 */
export const SupportStatus = {
    NOT_SUPPORTED: 'notSupported',
    PARTIAL_SUPPORT: 'partialSupport',
    FULL_SUPPORT: 'fullSupport',
};

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tableIcons = /** @type {const} */ ([
    'ai-chat.svg',
    'bookmark.svg',
    'cookies.svg',
    'dock.svg',
    'duck-ai.svg',
    'duck-player.svg',
    'fire.svg',
    'home.svg',
    'import.svg',
    'profile-blocker.svg',
    'session-restore.svg',
    'shield.svg',
    'vpn.svg',
]);

export const tableIconPrefix = 'assets/img/steps/v4/';

/** @typedef {{ icon: tableIcons[number], title: string, statuses: Record<'chrome'|'safari'|'ddg', SupportStatus> }} FeatureSupportData */

/**
 * Comparison table matrix
 *
 * Safari was removed from the latest comparison table layout. Keeping it the data just in case it comes back.
 *
 * @type {(t: ReturnType<typeof import('../../types')['useTypedTranslation']>['t'], adBlockingEnabled?: boolean) => FeatureSupportData[]}
 */
export const comparisonTableData = (t, adBlockingEnabled = false) => [
    {
        icon: 'vpn.svg',
        title: t('comparison_searchPrivately'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'duck-ai.svg',
        title: t('comparison_aiChat'),
        statuses: {
            chrome: SupportStatus.PARTIAL_SUPPORT,
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
        icon: 'cookies.svg',
        title: t('comparison_blockCookies'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
    {
        icon: 'profile-blocker.svg',
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
        icon: 'duck-player.svg',
        title: adBlockingEnabled ? t('comparison_youtubeAdFree') : t('comparison_privateYoutube'),
        statuses: {
            chrome: SupportStatus.NOT_SUPPORTED,
            safari: SupportStatus.NOT_SUPPORTED,
            ddg: SupportStatus.FULL_SUPPORT,
        },
    },
];
