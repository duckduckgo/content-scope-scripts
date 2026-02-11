import { h, Fragment } from 'preact';
import { MakeDefaultContent } from '../components/MakeDefaultContent';
import { SettingsContent } from '../components/SettingsContent';
import { DuckPlayerContent } from '../components/DuckPlayerContent';
import { AddressBarContent } from '../components/AddressBarContent';
import { WelcomeContent } from '../components/WelcomeContent';
import { GetStartedContent } from '../components/GetStartedContent';
import { DaxIllustration } from '../components/DaxIllustration';

/**
 * This sets up individual steps in the v4 (bubbles) version of onboarding
 *
 * See `./data-types.js` for documentation on parameters {StepConfigParams}
 * and return values {V4StepConfig}
 */

/** @type {Record<import('./data-types').StepsV4, (params: import('./data-types').StepConfigParams) => import('./data-types').V4StepConfig>} */
export const stepsConfig = {
    welcome: ({ advance }) => {
        return {
            content: <WelcomeContent onComplete={advance} />,
        };
    },
    getStarted: () => {
        return {
            content: <DaxIllustration />,
            topBubble: <GetStartedContent />,
            topBubbleTail: 'bottom-left',
        };
    },
    makeDefaultSingle: () => {
        return {
            topBubble: <MakeDefaultContent />,
            showProgress: true,
        };
    },
    systemSettings: ({ t }) => {
        return {
            topBubble: (
                <Fragment>
                    <h2>{t('systemSettings_title_v3')}</h2>
                    <p>{t('systemSettings_subtitle_v3')}</p>
                </Fragment>
            ),
            bottomBubble: <SettingsContent />,
            showProgress: true,
        };
    },
    duckPlayerSingle: ({ t }) => {
        return {
            topBubble: (
                <Fragment>
                    <h2>{t('duckPlayer_title')}</h2>
                    <p>{t('duckPlayer_subtitle')}</p>
                </Fragment>
            ),
            bottomBubble: <DuckPlayerContent />,
            showProgress: true,
        };
    },
    customize: ({ t }) => {
        return {
            topBubble: (
                <Fragment>
                    <h2>{t('customize_title_v3')}</h2>
                    <p>{t('customize_subtitle_v3')}</p>
                </Fragment>
            ),
            bottomBubble: <SettingsContent />,
            showProgress: true,
        };
    },
    addressBarMode: ({ t }) => {
        return {
            topBubble: <h2>{t('addressBarMode_title')}</h2>,
            bottomBubble: <AddressBarContent />,
            showProgress: true,
        };
    },
};

/**
 * @typedef {object} RowData
 * @property {'one-time' | 'toggle'} kind
 * @property {import('../../types').SystemValueId} id
 * @property {typeof import('../../shared/components/ListItem').availableIcons[number]} icon
 * @property {string} title
 * @property {string} [secondaryText]
 * @property {string} acceptText
 * @property {'primary'|'secondary'} [accepButtonVariant]
 * @property {string} [acceptTextRecall] - Shown if a user chooses to skip that step. If undefined,
 * @property acceptText is shown.
 */

/** @type {Record<import('../../types').SystemValueId, (t: import('../../types').TranslationFn, platform: ImportMeta['platform']) => RowData>} */
export const settingsRowItems = {
    'default-browser': (t) => ({
        id: 'default-browser',
        icon: 'v3/Browser-Default-Color-24.svg',
        title: t('row_default-browser_title_v3'),
        kind: 'one-time',
        acceptText: t('row_default-browser_accept'),
        accepButtonVariant: 'primary',
    }),
    import: (t) => ({
        id: 'import',
        icon: 'v3/Import-Color-24.svg',
        title: t('row_import_title_v3'),
        secondaryText: t('row_import_summary_v3'),
        kind: 'one-time',
        acceptText: t('row_import_accept_v3'),
        acceptTextRecall: t('row_import_accept'),
        accepButtonVariant: 'primary',
    }),
    dock: (t, platform) => {
        const title = platform === 'macos' ? t('row_dock_title_v3') : t('row_taskbar_title_v3');
        const acceptText = platform === 'macos' ? t('row_dock_macos_accept') : t('row_dock_accept');
        const secondaryText = platform === 'macos' ? t('row_dock_summary_v3') : t('row_taskbar_summary_v3');

        return {
            id: 'dock',
            icon: 'v3/Add-To-Dock-Color-24.svg',
            title,
            secondaryText,
            kind: 'one-time',
            acceptText,
            accepButtonVariant: 'primary',
        };
    },
    bookmarks: (t) => ({
        id: 'bookmarks',
        icon: 'v3/Bookmark-Favorite-Color-24.svg',
        title: t('row_bookmarks_title_v3'),
        kind: 'toggle',
        acceptText: t('row_bookmarks_accept'),
        accepButtonVariant: 'secondary',
    }),
    'session-restore': (t) => ({
        id: 'session-restore',
        icon: 'v3/Session-Restore-Color-24.svg',
        title: t('row_session-restore_title_v3'),
        kind: 'toggle',
        acceptText: t('row_session-restore_accept'),
        accepButtonVariant: 'secondary',
    }),
    'home-shortcut': (t) => ({
        id: 'home-shortcut',
        icon: 'v3/Home-Color-24.svg',
        title: t('row_home-shortcut_title_v3'),
        kind: 'toggle',
        acceptText: t('row_home-shortcut_accept'),
        accepButtonVariant: 'secondary',
    }),
    'placebo-ad-blocking': (t) => ({
        id: 'placebo-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_placebo-ad-blocking_title_v3'),
        secondaryText: t('row_ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_ad-blocking_accept_v3'),
        accepButtonVariant: 'primary',
    }),
    'aggressive-ad-blocking': (t) => ({
        id: 'aggressive-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_aggressive-ad-blocking_title_v3'),
        secondaryText: t('row_ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_ad-blocking_accept_v3'),
        accepButtonVariant: 'primary',
    }),
    'youtube-ad-blocking': (t) => ({
        id: 'youtube-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_youtube-ad-blocking_title_v3'),
        secondaryText: t('row_youtube-ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_youtube-ad-blocking_accept_v3'),
        accepButtonVariant: 'primary',
    }),
    'address-bar-mode': (t) => ({
        id: 'address-bar-mode',
        icon: 'v3/Ai-Chat-Color-24.svg',
        title: t('addressBarMode_title'),
        kind: 'toggle',
        acceptText: t('startBrowsing'),
        accepButtonVariant: 'primary',
    }),
};

/** @type {import('../../types').StepDefinitions} */
export const stepDefinitions = {
    welcome: {
        id: 'welcome',
        kind: 'info',
    },
    getStarted: {
        id: 'getStarted',
        kind: 'info',
    },
    makeDefaultSingle: {
        id: 'makeDefaultSingle',
        kind: 'settings',
        rows: ['default-browser'],
    },
    systemSettings: {
        id: 'systemSettings',
        kind: 'settings',
        rows: ['dock', 'import'],
    },
    duckPlayerSingle: {
        id: 'duckPlayerSingle',
        kind: 'info',
    },
    customize: {
        id: 'customize',
        kind: 'settings',
        rows: ['bookmarks', 'session-restore', 'home-shortcut'],
    },
    addressBarMode: {
        id: 'addressBarMode',
        kind: 'info',
    },
};
