import { h, render } from 'preact';
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js';

import { App, AppLevelErrorBoundaryFallback } from './components/App.jsx';
import { Components } from './components/Components.jsx';

import enStrings from '../public/locales/en/settings.json';
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js';
import { callWithRetry } from '../../../shared/call-with-retry.js';

import { MessagingContext, AppSettingsContext } from './types.js';
import { defaults, defaultState, paramsToQuery, SettingsService } from './settings.service.js';
import { SettingsServiceProvider } from './global/Providers/SettingsServiceProvider.js';
import { AppSettings } from './AppSettings.js';
import { QueryProvider } from './global/Providers/QueryProvider.js';
import { InlineErrorBoundary } from '../../../shared/components/InlineErrorBoundary.js';
import { NavProvider, pathnameToId } from './global/Providers/NavProvider.js';

/**
 * @param {Element} root
 * @param {import("../src/index.js").SettingsPage} messaging
 * @param {import("../../../shared/environment").Environment} baseEnvironment
 * @return {Promise<void>}
 */
export async function init(root, messaging, baseEnvironment) {
    const result = await callWithRetry(() => messaging.initialSetup());
    if ('error' in result) {
        throw new Error(result.error);
    }

    const init = result.value;

    // update the 'env' in case it was changed by native sides
    const environment = baseEnvironment
        .withEnv(init.env)
        .withLocale(init.locale)
        .withLocale(baseEnvironment.urlParams.get('locale'))
        .withTextLength(baseEnvironment.urlParams.get('textLength'))
        .withDisplay(baseEnvironment.urlParams.get('display'));

    // create app-specific settings
    const appSettings = new AppSettings({})
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))
        .withDebounce(baseEnvironment.urlParams.get('debounce'))
        .withUrlDebounce(baseEnvironment.urlParams.get('urlDebounce'));

    if (!window.__playwright_01) {
        console.log('initialSetup', init);
        console.log('environment', environment);
        console.log('appSettings', appSettings);
    }

    /**
     * @param {string} message
     */
    const didCatchInit = (message) => {
        messaging.reportInitException({ message });
    };

    // apply default styles
    applyDefaultStyles(init.defaultStyles);

    const strings = await getStrings(environment);
    const service = new SettingsService(messaging, init.settingsData);
    const query = paramsToQuery(environment.urlParams, 'initial');
    const initialId = pathnameToId(location.pathname, init.settingsData.screens);
    const structure = defaults();
    const state = defaultState();
    console.log({ structure, state });

    if (environment.display === 'app') {
        render(
            <InlineErrorBoundary
                messaging={messaging}
                context={'AppSettings view application'}
                fallback={(message) => {
                    return <AppLevelErrorBoundaryFallback>{message}</AppLevelErrorBoundaryFallback>;
                }}
            >
                <EnvironmentProvider
                    debugState={environment.debugState}
                    injectName={environment.injectName}
                    willThrow={environment.willThrow}
                >
                    <UpdateEnvironment search={window.location.search} />
                    <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                        <MessagingContext.Provider value={messaging}>
                            <AppSettingsContext.Provider value={appSettings}>
                                <NavProvider initialId={initialId}>
                                    <QueryProvider query={query}>
                                        <SettingsServiceProvider service={service} data={structure} initialState={state}>
                                            <App />
                                        </SettingsServiceProvider>
                                    </QueryProvider>
                                </NavProvider>
                            </AppSettingsContext.Provider>
                        </MessagingContext.Provider>
                    </TranslationProvider>
                </EnvironmentProvider>
            </InlineErrorBoundary>,
            root,
        );
    } else if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={false} injectName={environment.injectName}>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <Components />
                </TranslationProvider>
            </EnvironmentProvider>,
            root,
        );
    }
}

/**
 * This will apply default background colors as early as possible.
 *
 * @param {import("../types/settings.ts").DefaultStyles | null | undefined} defaultStyles
 */
function applyDefaultStyles(defaultStyles) {
    if (defaultStyles?.lightBackgroundColor) {
        document.body.style.setProperty('--default-light-background-color', defaultStyles.lightBackgroundColor);
    }
    if (defaultStyles?.darkBackgroundColor) {
        document.body.style.setProperty('--default-dark-background-color', defaultStyles.darkBackgroundColor);
    }
}

/**
 * @param {import("../../../shared/environment").Environment} environment
 */
async function getStrings(environment) {
    return environment.locale === 'en'
        ? enStrings
        : await fetch(`./locales/${environment.locale}/settings.json`)
              .then((x) => x.json())
              .catch((e) => {
                  console.error('Could not load locale', environment.locale, e);
                  return enStrings;
              });
}
