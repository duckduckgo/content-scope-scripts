import { render, h } from 'preact';
import './shared/styles/global.css'; // global styles
import { App } from './v4/App.js';
import { SkipLink } from './shared/components/SkipLink.js';
import { GlobalProvider } from './global';
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider';
import { Settings } from './settings';
import { callWithRetry } from '../../../shared/call-with-retry';
import { TranslationProvider } from '../../../shared/components/TranslationsProvider';
import { SettingsProvider } from './shared/components/SettingsProvider';
import enStrings from '../public/locales/en/onboarding.json';

/**
 * @param {import('../src/index.js').OnboardingPage} onboarding
 * @param {import('../../../shared/environment').Environment} baseEnvironment
 */
export async function init(onboarding, baseEnvironment) {
    const result = await callWithRetry(() => onboarding.init());
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

    const strings =
        environment.locale === 'en'
            ? enStrings
            : await fetch(`./locales/${environment.locale}/onboarding.json`)
                  .then((x) => x.json())
                  .catch((e) => {
                      console.error('Could not load locale', environment.locale, e);
                      return enStrings;
                  });

    const settings = new Settings()
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))
        .withSteps(init.steps)
        .withSteps(environment.urlParams.getAll('steps'))
        .withStepDefinitions(init.stepDefinitions)
        .withExcludedScreens(init.exclude)
        .withExcludedScreens(environment.urlParams.getAll('exclude'))
        .withFirst(environment.urlParams.get('page'))
        .withTypingEffect(environment.urlParams.get('typingEffect'));

    const root = document.querySelector('#app');
    if (!root) throw new Error('could not render, root element missing');

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider debugState={environment.debugState} injectName={environment.injectName} willThrow={environment.willThrow}>
                <UpdateEnvironment search={window.location.search} />
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <SettingsProvider platform={settings.platform} typingEffect={settings.typingEffect}>
                        <GlobalProvider
                            messaging={onboarding}
                            order={settings.order}
                            stepDefinitions={settings.stepDefinitions}
                            firstPage={settings.first}
                        >
                            <App>{environment.env === 'development' && <SkipLink />}</App>
                        </GlobalProvider>
                    </SettingsProvider>
                </TranslationProvider>
            </EnvironmentProvider>,
            root,
        );
    }
}
