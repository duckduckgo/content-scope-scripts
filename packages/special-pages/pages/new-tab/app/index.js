import { render, h } from 'preact'
import './styles/global.css' // global styles
import { Layout } from './components/Layout'
import { Footer } from './components/Footer'
import { LayoutProvider } from './providers/layout.provider.js'
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js'
import enStrings from '../../duckplayer/src/locales/en/duckplayer.json'
import { Fallback } from '../../duckplayer/app/components/Fallback.jsx'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary.js'
import { Settings } from '../../duckplayer/app/settings.js'
import { SettingsProvider } from './providers/settings.provider.js'
import { MessagingContext } from './types'
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js'
import { WidgetList } from './components/WidgetList.js'

/**
 * @param {import("../src/js").NewTabPage} messaging
 * @param {import("../../../shared/environment").Environment} baseEnvironment
 */
export async function init (messaging, baseEnvironment) {
    const init = await messaging.init()

    if (!Array.isArray(init.layout?.widgets)) {
        throw new Error('missing critical initialSetup.layout.widgets array')
    }

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
        : await fetch(`./locales/${environment.locale}/onboarding.json`)
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
                            <LayoutProvider layout={init.layout}>
                                <Layout>
                                    <WidgetList />
                                    <Footer />
                                </Layout>
                            </LayoutProvider>
                        </TranslationProvider>
                    </SettingsProvider>
                </MessagingContext.Provider>
            </ErrorBoundary>
        </EnvironmentProvider>
        ,
        root
    )
}
