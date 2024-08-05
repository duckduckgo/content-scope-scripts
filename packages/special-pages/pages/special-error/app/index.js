import { h, render } from 'preact'
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js'

import { App } from './components/App.jsx'
import { Components } from './components/Components.jsx'

import enStrings from '../src/locales/en/special-error.json'
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js'
import { ErrorDataProvider } from '../../release-notes/app/ErrorDataProvider.js'
import { MessagingProvider } from './MessagingProvider.js'
import { callWithRetry } from '../../../shared/call-with-retry.js'

import '../../../shared/styles/global.css' // global styles
import './styles/variables.css' // Page-specific variables

/**
 * @param {import("../src/js/index.js").SpecialErrorPage} messaging
 * @param {import("../../../shared/environment").Environment} baseEnvironment
 * @return {Promise<void>}
 */
export async function init (messaging, baseEnvironment) {
    const result = await callWithRetry(() => messaging.initialSetup())
    if ('error' in result) {
        throw new Error(result.error)
    }

    const init = result.value

    const { errorData } = init
    if (!errorData) {
        throw new Error('Missing error data')
    }

    // update the 'env' in case it was changed by native sides
    const environment = baseEnvironment
        .withEnv(init.env)
        .withLocale(init.locale)
        .withLocale(baseEnvironment.urlParams.get('locale'))
        .withTextLength(baseEnvironment.urlParams.get('textLength'))
        .withDisplay(baseEnvironment.urlParams.get('display'))

    const strings = environment.locale === 'en'
        ? enStrings
        : await fetch(`./locales/${environment.locale}/special-error.json`)
            .then(resp => {
                if (!resp.ok) {
                    throw new Error('did not give a result')
                }
                return resp.json()
            })
            .catch(e => {
                console.error('Could not load locale', environment.locale, e)
                return enStrings
            })

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider
                debugState={environment.debugState}
                platform={environment.platform}
                willThrow={environment.willThrow}
            >
                <UpdateEnvironment search={window.location.search}/>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <MessagingProvider messaging={messaging}>
                        <ErrorDataProvider errorData={errorData}>
                            <App/>
                        </ErrorDataProvider>
                    </MessagingProvider>
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    } else if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={false} platform={environment.platform}>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <Components />
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    }
}
