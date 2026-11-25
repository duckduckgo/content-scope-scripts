import { h } from 'preact';
import { MakeDefaultContent } from '../components/MakeDefaultContent';
import { SettingsContent } from '../components/SettingsContent';
import { StepHeader } from '../components/StepHeader';
import { DuckPlayerContent } from '../components/DuckPlayerContent';
import { AddressBarContent } from '../components/AddressBarContent';
import { WelcomeContent } from '../components/WelcomeContent';
import { GetStartedContent } from '../components/GetStartedContent';
import { GetStartedAnimation } from '../components/GetStartedAnimation';
import { SystemSettingsBackground, SystemSettingsForeground } from '../components/SystemSettingsAnimation';
import { FadeTransition } from '../components/FadeTransition';
import { DockInstructionsContent } from '../components/DockInstructionsContent';
import { SearchOrChatContent } from '../components/SearchOrChatContent';
import { PickerContent } from '../components/PickerContent';

/**
 * This sets up individual steps in the v4 (bubbles) version of onboarding
 *
 * See `./data-types.js` for documentation on parameters {StepConfigParams}
 * and return values {StepConfig}
 */

/** @type {Record<import('./data-types').StepsV4, (params: import('./data-types').StepConfigParams) => import('./data-types').StepConfig>} */
export const stepsConfig = {
    welcome: ({ advance }) => {
        return {
            content: <WelcomeContent onComplete={advance} />,
        };
    },
    getStarted: ({ enqueueNext, onTitleComplete, isShortViewport, globalState }) => {
        const showInstallOptions = /** @type {import('../../types').GetStartedStep} */ (globalState.step).options?.some(
            (option) => option === 'chrome-extension-install' || option === 'sideload-extensions' || option === 'open-at-startup',
        );
        return {
            bottomBubble: {
                content: <GetStartedContent advance={enqueueNext} onTitleComplete={onTitleComplete} />,
                tail: isShortViewport ? undefined : 'bottom-left',
            },
            illustration: isShortViewport
                ? undefined
                : {
                      foreground: <GetStartedAnimation />,
                  },
            bubbleWidth: showInstallOptions ? 'chromeExtension' : 'narrow',
        };
    },
    makeDefaultSingle: ({ enqueueNext, onTitleComplete, updateSystemValue }) => {
        return {
            bottomBubble: {
                content: (
                    <MakeDefaultContent advance={enqueueNext} onTitleComplete={onTitleComplete} updateSystemValue={updateSystemValue} />
                ),
            },
            showProgress: true,
        };
    },
    systemSettings: ({ t, globalState, enqueueNext, dismiss, onTitleComplete, updateSystemValue }) => {
        const { overlay, activeStep, activeRow } = globalState;

        return {
            topBubble: {
                content: (
                    <StepHeader
                        title={t('systemSettings_title_v3')}
                        subtitle={t('systemSettings_subtitle_v3')}
                        onTitleComplete={onTitleComplete}
                    />
                ),
                tail: 'right',
            },
            bottomBubble: {
                content: (
                    <FadeTransition transitionKey={overlay ?? 'none'}>
                        {overlay === 'dock-instructions' ? (
                            <DockInstructionsContent updateSystemValue={updateSystemValue} />
                        ) : (
                            <SettingsContent advance={enqueueNext} dismiss={dismiss} updateSystemValue={updateSystemValue} />
                        )}
                    </FadeTransition>
                ),
            },
            illustration: overlay
                ? undefined
                : {
                      background: <SystemSettingsBackground />,
                      foreground: <SystemSettingsForeground />,
                  },
            showProgress: true,
            bounceKey: `${activeStep}-${activeRow}-${overlay ?? 'none'}`,
        };
    },
    duckPlayerSingle: ({ t, globalState, enqueueNext, onTitleComplete }) => {
        const duckPlayerStep = /** @type {import('../../types').DuckPlayerSingleStep} */ (globalState.stepDefinitions.duckPlayerSingle);
        const isAdFree = duckPlayerStep.variant === 'ad-free';

        return {
            topBubble: {
                content: (
                    <StepHeader
                        title={isAdFree ? t('duckPlayer_adFree_title') : t('duckPlayer_v4_title', { newline: '\n' })}
                        subtitle={
                            isAdFree ? t('duckPlayer_adFree_subtitle', { newline: ' ' }) : t('duckPlayer_v4_subtitle', { newline: '\n' })
                        }
                        onTitleComplete={onTitleComplete}
                    />
                ),
            },
            bottomBubble: { content: <DuckPlayerContent isAdFree={isAdFree} advance={enqueueNext} /> },
            showProgress: true,
        };
    },
    customize: ({ t, globalState, enqueueNext, dismiss, onTitleComplete, updateSystemValue }) => {
        const { activeStep, activeRow } = globalState;

        return {
            topBubble: {
                content: (
                    <StepHeader title={t('customize_title_v3')} subtitle={t('customize_subtitle_v3')} onTitleComplete={onTitleComplete} />
                ),
            },
            bottomBubble: { content: <SettingsContent advance={enqueueNext} dismiss={dismiss} updateSystemValue={updateSystemValue} /> },
            showProgress: true,
            bounceKey: `${activeStep}-${activeRow}`,
        };
    },
    // Only shown to clients that list it in `init.steps`.
    picker: ({ t, globalState, addFavorites, enqueueNext, onTitleComplete }) => {
        const step = /** @type {import('../../types').PickerStep} */ (globalState.step);
        return {
            topBubble: {
                content: <StepHeader title={t('picker_title')} subtitle={t('picker_subtitle')} onTitleComplete={onTitleComplete} />,
            },
            bottomBubble: {
                content: <PickerContent step={step} addFavorites={addFavorites} advance={enqueueNext} />,
            },
            showProgress: true,
            bubbleWidth: 'picker',
        };
    },
    addressBarMode: ({ t, globalState, enqueueNext, dismiss, onTitleComplete, updateSystemValue }) => {
        const { order, activeStep } = globalState;
        // Read from `order`, which config updates keep current, like `SettingsContent` does.
        const isLastStep = order[order.length - 1] === activeStep;
        return {
            topBubble: {
                content: <StepHeader title={t('addressBarMode_title')} onTitleComplete={onTitleComplete} />,
            },
            bottomBubble: {
                content: (
                    <AddressBarContent dismiss={dismiss} advance={isLastStep ? null : enqueueNext} updateSystemValue={updateSystemValue} />
                ),
            },
            showProgress: true,
        };
    },
    // Only shown to clients that list it in `init.steps`.
    searchOrChat: ({ t, globalState, submitQuery, onTitleComplete }) => {
        // "Search Only" on addressBarMode leaves Duck.ai out. If that step wasn't shown, offer both.
        /** @type {import('../../types').SearchOrChatVariant} */
        const variant = globalState.values['address-bar-mode']?.enabled === false ? 'searchOnly' : 'searchAndDuckAi';
        const title = variant === 'searchOnly' ? t('searchOrChat_searchOnly_title') : t('searchOrChat_title');
        return {
            topBubble: {
                content: <StepHeader title={title} onTitleComplete={onTitleComplete} />,
            },
            bottomBubble: {
                content: <SearchOrChatContent variant={variant} submitQuery={submitQuery} />,
            },
        };
    },
};

/**
 * @typedef {object} RowData
 * @property {'one-time' | 'toggle'} kind
 * @property {import('../../types').SystemValueId} id
 * @property {import('./data-types').RowIcon} icon
 * @property {string} title
 * @property {string} [secondaryText]
 * @property {string} acceptText
 * @property {string} [acceptTextRecall] - Shown if a user chooses to skip that step. If undefined, acceptText is shown.
 */

/** @type {Record<import('../../types').SystemValueId, (t: import('../../types').TranslationFn, platform: ImportMeta['platform']) => RowData>} */
export const settingsRowItems = {
    'default-browser': (t) => ({
        id: 'default-browser',
        icon: 'v3/Browser-Default-Color-24.svg',
        title: t('row_default-browser_title_v3'),
        kind: 'one-time',
        acceptText: t('row_default-browser_accept'),
    }),
    import: (t) => ({
        id: 'import',
        icon: 'v4/import.svg',
        title: t('row_import_title_v3'),
        secondaryText: t('row_import_summary_v3'),
        kind: 'one-time',
        acceptText: t('row_import_accept_v3'),
        acceptTextRecall: t('row_import_accept'),
    }),
    dock: (t, platform) => {
        const title = platform === 'macos' ? t('row_dock_title_v3') : t('row_taskbar_title_v3');
        const acceptText = platform === 'macos' ? t('row_dock_macos_accept') : t('row_dock_accept');
        const secondaryText = platform === 'macos' ? t('row_dock_summary_v3') : t('row_taskbar_summary_v3');

        return {
            id: 'dock',
            icon: 'v4/dock.svg',
            title,
            secondaryText,
            kind: 'one-time',
            acceptText,
        };
    },
    bookmarks: (t) => ({
        id: 'bookmarks',
        icon: 'v4/bookmark.svg',
        title: t('row_bookmarks_title_v3'),
        kind: 'toggle',
        acceptText: t('row_bookmarks_accept'),
    }),
    'session-restore': (t) => ({
        id: 'session-restore',
        icon: 'v4/session-restore.svg',
        title: t('row_session-restore_title_v3'),
        kind: 'toggle',
        acceptText: t('row_session-restore_accept'),
    }),
    'home-shortcut': (t) => ({
        id: 'home-shortcut',
        icon: 'v4/home.svg',
        title: t('row_home-shortcut_title_v3'),
        kind: 'toggle',
        acceptText: t('row_home-shortcut_accept'),
    }),
    'placebo-ad-blocking': (t) => ({
        id: 'placebo-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_placebo-ad-blocking_title_v3'),
        secondaryText: t('row_ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_ad-blocking_accept_v3'),
    }),
    'aggressive-ad-blocking': (t) => ({
        id: 'aggressive-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_aggressive-ad-blocking_title_v3'),
        secondaryText: t('row_ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_ad-blocking_accept_v3'),
    }),
    'youtube-ad-blocking': (t) => ({
        id: 'youtube-ad-blocking',
        icon: 'v3/Ads-Blocked-Color-24.svg',
        title: t('row_youtube-ad-blocking_title_v3'),
        secondaryText: t('row_youtube-ad-blocking_desc_v3'),
        kind: 'one-time',
        acceptText: t('row_youtube-ad-blocking_accept_v3'),
    }),
    'address-bar-mode': (t) => ({
        id: 'address-bar-mode',
        icon: 'v3/Ai-Chat-Color-24.svg',
        title: t('addressBarMode_title'),
        kind: 'toggle',
        acceptText: t('startBrowsing'),
    }),
    'dock-instructions': (t) => ({
        id: 'dock-instructions',
        icon: 'v4/dock.svg',
        title: t('row_dock_title_v3'),
        secondaryText: t('row_dock_summary_v3'),
        kind: 'one-time',
        acceptText: t('row_dock-instructions_accept'),
    }),
    'chrome-extension-install': (t) => ({
        id: 'chrome-extension-install',
        icon: 'v3/Browser-Default-Color-24.svg',
        title: t('getStarted_chromeExtension_label'),
        kind: 'one-time',
        acceptText: t('getStarted_chromeExtension_label'),
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
    searchOrChat: {
        id: 'searchOrChat',
        kind: 'info',
    },
    picker: {
        id: 'picker',
        kind: 'info',
        // The experiment's list. Each id keys the site's copy and bundled icon. Gmail and Outlook use the hosts
        // their short domains redirect to, so they match the favorites people import. Settings.withResolvedSiteUrls
        // resolves each url (see site-urls.js). Amazon stores follow no pattern, so they're listed by OS region, and
        // any other region gets amazon.com, where Amazon offers to switch store. Wikipedia editions follow the
        // language, so a template covers every one of them.
        sites: [
            { id: 'gmail', url: 'https://mail.google.com', title: 'Gmail', section: 'email' },
            { id: 'outlook', url: 'https://outlook.live.com', title: 'Outlook', section: 'email' },
            { id: 'yahooMail', url: 'https://mail.yahoo.com', title: 'Yahoo Mail', section: 'email' },
            { id: 'youtube', url: 'https://www.youtube.com', title: 'YouTube', section: 'popular' },
            { id: 'reddit', url: 'https://www.reddit.com', title: 'Reddit', section: 'popular' },
            { id: 'facebook', url: 'https://www.facebook.com', title: 'Facebook', section: 'popular' },
            { id: 'netflix', url: 'https://www.netflix.com', title: 'Netflix', section: 'popular' },
            { id: 'bbcNews', url: 'https://www.bbc.com/news', title: 'BBC News', section: 'popular' },
            {
                id: 'wikipedia',
                url: 'https://en.wikipedia.org',
                urlTemplate: 'https://{locale}.wikipedia.org',
                title: 'Wikipedia',
                section: 'popular',
            },
            {
                id: 'amazon',
                url: 'https://www.amazon.com',
                urlByRegion: {
                    CA: 'https://www.amazon.ca',
                    MX: 'https://www.amazon.com.mx',
                    BR: 'https://www.amazon.com.br',
                    GB: 'https://www.amazon.co.uk',
                    IE: 'https://www.amazon.ie',
                    DE: 'https://www.amazon.de',
                    AT: 'https://www.amazon.de',
                    CH: 'https://www.amazon.de',
                    FR: 'https://www.amazon.fr',
                    IT: 'https://www.amazon.it',
                    ES: 'https://www.amazon.es',
                    PT: 'https://www.amazon.es',
                    NL: 'https://www.amazon.nl',
                    BE: 'https://www.amazon.com.be',
                    SE: 'https://www.amazon.se',
                    PL: 'https://www.amazon.pl',
                    TR: 'https://www.amazon.com.tr',
                    IN: 'https://www.amazon.in',
                    JP: 'https://www.amazon.co.jp',
                    SG: 'https://www.amazon.sg',
                    AU: 'https://www.amazon.com.au',
                    NZ: 'https://www.amazon.com.au',
                    AE: 'https://www.amazon.ae',
                    SA: 'https://www.amazon.sa',
                },
                title: 'Amazon',
                section: 'popular',
            },
        ],
        // Native sends these in its shouldShowTopSitesPicker answer.
        existingFavorites: [],
    },
};
