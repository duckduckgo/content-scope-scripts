import { h, render } from 'preact';
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js';

import { App } from './components/App.jsx';
import { Components } from './components/Components.jsx';

import enStrings from '../public/locales/en/history.json';
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js';
import { callWithRetry } from '../../../shared/call-with-retry.js';

import { MessagingContext, SettingsContext } from './types.js';
import { HistoryService, paramsToQuery } from './history.service.js';
import { HistoryServiceProvider } from './global-state/HistoryServiceProvider.js';
import { Settings } from './Settings.js';
import { eventToIntention, SelectionProvider } from './global-state/SelectionProvider.js';
import { QueryProvider } from './global-state/QueryProvider.js';
import { GlobalStateProvider } from './global-state/GlobalStateProvider.js'; // global styles

/**
 * @param {Element} root
 * @param {import("../src/index.js").HistoryPage} messaging
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
    const settings = new Settings({})
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))
        .withDebounce(baseEnvironment.urlParams.get('debounce'));

    console.log('initialSetup', init);
    console.log('environment', environment);
    console.log('settings', settings);

    const strings =
        environment.locale === 'en'
            ? enStrings
            : await fetch(`./locales/${environment.locale}/example.json`)
                  .then((resp) => {
                      if (!resp.ok) {
                          throw new Error('did not give a result');
                      }
                      return resp.json();
                  })
                  .catch((e) => {
                      console.error('Could not load locale', environment.locale, e);
                      return enStrings;
                  });

    const service = new HistoryService(messaging);
    const query = paramsToQuery(environment.urlParams);
    const initial = await service.getInitial(query);

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider debugState={environment.debugState} injectName={environment.injectName} willThrow={environment.willThrow}>
                <UpdateEnvironment search={window.location.search} />
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <MessagingContext.Provider value={messaging}>
                        <SettingsContext.Provider value={settings}>
                            <QueryProvider query={query.query}>
                                <HistoryServiceProvider service={service}>
                                    <GlobalStateProvider service={service} initial={initial}>
                                        <SelectionProvider>
                                            <App />
                                        </SelectionProvider>
                                    </GlobalStateProvider>
                                </HistoryServiceProvider>
                            </QueryProvider>
                        </SettingsContext.Provider>
                    </MessagingContext.Provider>
                </TranslationProvider>
            </EnvironmentProvider>,
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
