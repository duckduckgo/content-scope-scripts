import { h, render, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { App } from './components/App';
import { Components } from './Components';
import { EnvironmentProvider } from '../../../shared/components/EnvironmentProvider';
import { TranslationProvider } from '../../../shared/components/TranslationsProvider';
import { callWithRetry } from '../../../shared/call-with-retry.js';
import enStrings from '../public/locales/en/release-notes.json';

import '../../../shared/styles/global.css'; // global styles

export const MessagingContext = createContext({
    messages: /** @type {import('../src/index.js').ReleaseNotesPage | null} */ (null),
});

export const useMessaging = () => useContext(MessagingContext);

export async function init(messages, baseEnvironment) {
    const result = await callWithRetry(() => messages.initialSetup());

    if ('error' in result) {
        throw new Error(result.error);
    }

    const init = result.value;

    const environment = baseEnvironment
        .withEnv(init.env)
        .withLocale(init.locale)
        .withLocale(baseEnvironment.urlParams.get('locale'))
        .withTextLength(baseEnvironment.urlParams.get('textLength'))
        .withDisplay(baseEnvironment.urlParams.get('display'));

    const strings =
        environment.locale === 'en'
            ? enStrings
            : await fetch(`./locales/${environment.locale}/release-notes.json`)
                  .then((x) => x.json())
                  .catch((e) => {
                      console.error('Could not load locale', environment.locale, e);
                      return enStrings;
                  });

    const root = document.querySelector('#app');
    if (!root) throw new Error('could not render, root element missing');

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider debugState={environment.debugState} injectName={environment.injectName} willThrow={environment.willThrow}>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <MessagingContext.Provider value={{ messages }}>
                        <App />
                    </MessagingContext.Provider>
                </TranslationProvider>
            </EnvironmentProvider>,
            root,
        );
    }
    if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={environment.debugState} injectName={environment.injectName} willThrow={environment.willThrow}>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <MessagingContext.Provider value={{ messages }}>
                        <Components />
                    </MessagingContext.Provider>
                </TranslationProvider>
            </EnvironmentProvider>,
            root,
        );
    }
}
