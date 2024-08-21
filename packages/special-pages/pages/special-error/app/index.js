import { h, render } from 'preact'
import { EnvironmentProvider, UpdateEnvironment } from '../../../shared/components/EnvironmentProvider.js'

import { App } from './components/App.jsx'
import { Components } from './components/Components.jsx'

import enStrings from '../src/locales/en/special-error.json'
import { TranslationProvider } from '../../../shared/components/TranslationsProvider.js'
import { MessagingProvider } from './providers/MessagingProvider.js'
import { SettingsProvider } from './providers/SettingsProvider.jsx'
import { SpecialErrorProvider } from './providers/SpecialErrorProvider.js'
import { callWithRetry } from '../../../shared/call-with-retry.js'

import { Settings } from './settings.js'
import { SpecialError } from './specialError.js'

import '../../../shared/styles/global.css' // global styles
import './styles/variables.css'
import { decodeHtml } from '../../../../../src/dom-utils.js' // Page-specific variables

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
    const missingProperties = ['errorData', 'platform'].filter(prop => !init[prop])
    if (missingProperties.length > 0) {
        throw new Error(`Missing setup data: ${missingProperties.join(', ')}`)
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
        : await loadDynamic(init.localeStrings, environment.locale)

    const settings = new Settings({})
        .withPlatformName(baseEnvironment.injectName)
        .withPlatformName(init.platform?.name)
        .withPlatformName(baseEnvironment.urlParams.get('platform'))

    document.body.dataset.platformName = settings.platform?.name

    const specialError = new SpecialError({ errorData: init.errorData })
        .withSampleErrorId(baseEnvironment.urlParams.get('errorId'))

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider
                debugState={environment.debugState}
                injectName={environment.injectName}
                willThrow={environment.willThrow}
            >
                <UpdateEnvironment search={window.location.search}/>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <MessagingProvider messaging={messaging}>
                        <SettingsProvider settings={settings}>
                            <SpecialErrorProvider specialError={specialError}>
                                <App/>
                            </SpecialErrorProvider>
                        </SettingsProvider>
                    </MessagingProvider>
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    } else if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={false} injectName={environment.injectName}>
                <TranslationProvider translationObject={strings} fallback={enStrings} textLength={environment.textLength}>
                    <SettingsProvider settings={settings}>
                        <SpecialErrorProvider specialError={specialError}>
                            <Components />
                        </SpecialErrorProvider>
                    </SettingsProvider>
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    }
}

/**
 * @param {string|null|undefined} maybeString
 * @param {string} locale
 * @return {Promise<any>|any}
 */
function loadDynamic (maybeString, locale) {
    if (typeof maybeString === 'string') {
        try {
            return JSON.parse(maybeString)
        } catch (e) {
            console.log('could not use string', e)
            console.log('trying to load from disk...')
        }
    }
    const v = document.querySelector('[id="locale-strings"]')
    if (v) {
        try {
            console.log('raw', v.textContent)
            const decoded = decodeHtml(v.textContent)
            console.log('decoded', decoded)
            const json = JSON.parse(decoded)
            console.log('did load', json)
            return json
        } catch (e) {
            console.log('did not load', e)
            console.log('trying to load from disk...')
        }
    }

    return fetch(`./locales/${locale}/special-error.json`)
        // eslint-disable-next-line promise/prefer-await-to-then
        .then(resp => {
            if (!resp.ok) {
                throw new Error('did not give a result')
            }
            console.log('resp?', resp)
            return resp.json()
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch(e => {
            console.error('Could not load locale', locale, e)
            return enStrings
        })
}
