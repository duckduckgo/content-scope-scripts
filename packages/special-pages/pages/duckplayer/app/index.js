import './index.css'
import { callWithRetry } from '../../../shared/call-with-retry.js'
import { h, render } from 'preact'
import { EnvironmentProvider, UpdateEnvironment, WillThrow } from '../../../shared/components/EnvironmentProvider.js'
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js'
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary.js'
import { EmbedSettings } from './embed-settings.js'
import enStrings from '../src/locales/en/duckplayer.json'
import { Settings } from './settings.js'
import { SettingsProvider } from './providers/SettingsProvider.jsx'
import { MessagingContext } from './types.js'
import { UserValuesProvider } from './providers/UserValuesProvider.jsx'
import { Fallback } from './components/Fallback.jsx'
import { App } from './components/App.jsx'
import { Components } from './components/Components.jsx'
import { OrientationProvider } from './providers/OrientationProvider.jsx'

/**
 * @param {import("../src/js/index.js").DuckplayerPage} messaging
 * @param {import("../../../shared/environment").Environment} baseEnvironment
 * @return {Promise<void>}
 */
export async function init (messaging, baseEnvironment) {
    const result = await callWithRetry(() => messaging.initialSetup())
    if ('error' in result) {
        throw new Error(result.error)
    }

    const init = result.value
    console.log('INITIAL DATA', init)

    // update the 'env' in case it was changed by native sides
    const environment = baseEnvironment
        .withEnv(init.env)
        .withLocale(init.locale)
        .withLocale(baseEnvironment.urlParams.get('locale'))
        .withTextLength(baseEnvironment.urlParams.get('textLength'))
        .withDisplay(baseEnvironment.urlParams.get('display'))

    console.log('environment:', environment)

    document.body.dataset.display = environment.display

    // This will be re-enabled in the mobile PR
    // const strings = environment.locale === 'en'
    //     ? enStrings
    //     : await fetch(`./locales/${environment.locale}/duckplayer.json`)
    //         .then(resp => {
    //             if (!resp.ok) {
    //                 throw new Error('did not give a result')
    //             }
    //             return resp.json()
    //         })
    //         .catch(e => {
    //             console.error('Could not load locale', environment.locale, e)
    //             return enStrings
    //         })

    const settings = new Settings({})
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))
        .withFeatureState('pip', init.settings.pip)
        .withFeatureState('autoplay', init.settings.autoplay)
        .withFeatureState('focusMode', init.settings.focusMode)
        .withDisabledFocusMode(baseEnvironment.urlParams.get('focusMode'))

    console.log(settings)

    const embed = createEmbedSettings(window.location.href, settings)

    const didCatch = (error) => {
        const message = error?.message || 'unknown'
        messaging.reportPageException({ message })
    }

    document.body.dataset.layout = settings.layout

    const root = document.querySelector('body')
    if (!root) throw new Error('could not render, root element missing')

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider
                debugState={environment.debugState}
                injectName={environment.injectName}
                willThrow={environment.willThrow}>
                <ErrorBoundary didCatch={didCatch} fallback={<Fallback showDetails={environment.env === 'development'}/>}>
                    <UpdateEnvironment search={window.location.search}/>
                    <TranslationProvider translationObject={enStrings} fallback={enStrings} textLength={environment.textLength}>
                        <MessagingContext.Provider value={messaging}>
                            <SettingsProvider settings={settings}>
                                <UserValuesProvider initial={init.userValues}>
                                    <OrientationProvider>
                                        <App embed={embed} />
                                    </OrientationProvider>
                                    <WillThrow />
                                </UserValuesProvider>
                            </SettingsProvider>
                        </MessagingContext.Provider>
                    </TranslationProvider>
                </ErrorBoundary>
            </EnvironmentProvider>
            , root)
    } else if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={false} injectName={environment.injectName}>
                <MessagingContext.Provider value={messaging}>
                    <TranslationProvider translationObject={enStrings} fallback={enStrings} textLength={environment.textLength}>
                        <Components />
                    </TranslationProvider>
                </MessagingContext.Provider>
            </EnvironmentProvider>
            , root)
    }
}

/**
 * @param {string} href
 * @param {import("./settings.js").Settings} settings
 * @return {EmbedSettings|null}
 */
function createEmbedSettings (href, settings) {
    const embed = EmbedSettings.fromHref(href)
    if (!embed) return null

    return embed
        .withAutoplay(settings.autoplay.state === 'enabled')
        .withMuted(settings.platform.name === 'ios')
}
