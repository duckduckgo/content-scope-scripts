import { render, h } from 'preact'
import { App } from './components/App.js'
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js'
import { Fallback } from '../../../shared/components/Fallback/Fallback.jsx'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary.js'
import { SettingsProvider } from './settings.provider.js'
import { MessagingContext } from './types'
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js'
import { WidgetConfigAPI } from './widget-list/widget-config.js'
import enStrings from '../src/locales/en/newtab.json'
import { WidgetConfigProvider } from './widget-list/widget-config.provider.js'
import { WidgetList } from './widget-list/WidgetList.js'
import { Settings } from './settings.js'
import { Components } from './components/Components.jsx'

/**
 * @param {import("../src/js").NewTabPage} messaging
 * @param {import("../../../shared/environment").Environment} baseEnvironment
 */
export async function init (messaging, baseEnvironment) {
    const init = await messaging.init()

    if (!Array.isArray(init.widgets)) {
        throw new Error('missing critical initialSetup.widgets array')
    }
    if (!Array.isArray(init.widgetConfig)) {
        throw new Error('missing critical initialSetup.widgetConfig array')
    }

    // Create an instance of the global widget api
    const widgetConfigAPI = new WidgetConfigAPI(messaging, init.widgetConfig)

    // update the 'env' in case it was changed by native sides
    const environment = baseEnvironment
        .withEnv(init.env)
        .withLocale(init.locale)
        .withLocale(baseEnvironment.urlParams.get('locale'))
        .withTextLength(baseEnvironment.urlParams.get('textLength'))
        .withDisplay(baseEnvironment.urlParams.get('display'))

    console.log('environment:', environment)
    console.log('locale:', environment.locale)

    const strings = environment.locale === 'en'
        ? enStrings
        : await fetch(`./locales/${environment.locale}/new-tab.json`)
            .then(x => x.json())
            .catch(e => {
                console.error('Could not load locale', environment.locale, e)
                return enStrings
            })

    const settings = new Settings({})
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))

    const didCatch = (error) => {
        const message = error?.message || error?.error || 'unknown'
        messaging.reportPageException({ message })
    }

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    document.body.dataset.platformName = settings.platform.name

    if (environment.display === 'components') {
        document.body.dataset.display = 'components'
        return render(
            <EnvironmentProvider
                debugState={environment.debugState}
                injectName={environment.injectName}
                willThrow={environment.willThrow}>
                <TranslationProvider translationObject={strings} fallback={strings} textLength={environment.textLength}>
                    <Components />
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    }

    render(
        <EnvironmentProvider
            debugState={environment.debugState}
            injectName={environment.injectName}
            willThrow={environment.willThrow}>
            <ErrorBoundary didCatch={didCatch} fallback={<Fallback showDetails={environment.env === 'development'}/>}>
                <UpdateEnvironment search={window.location.search}/>
                <MessagingContext.Provider value={messaging}>
                    <SettingsProvider settings={settings}>
                        <TranslationProvider translationObject={strings} fallback={strings} textLength={environment.textLength}>
                            <WidgetConfigProvider api={widgetConfigAPI} widgetConfig={init.widgetConfig} widgets={init.widgets}>
                                <App>
                                    <WidgetList />
                                </App>
                            </WidgetConfigProvider>
                        </TranslationProvider>
                    </SettingsProvider>
                </MessagingContext.Provider>
            </ErrorBoundary>
        </EnvironmentProvider>
        ,
        root
    )
}
