import { h, render, createContext } from 'preact'
import { useContext } from 'preact/hooks'
import { App } from './components/App.js'
import { Components } from './Components'
import { EnvironmentProvider } from '../../../shared/components/EnvironmentProvider'
import { TranslationProvider } from '../../../shared/components/TranslationProvider'
import { i18n } from './text'

import '../../../shared/styles/global.css' // global styles

export const MessagingContext = createContext({
    messages: /** @type {import('../src/js/index').ReleaseNotesPage | null} */(null)
})

export const useMessaging = () => useContext(MessagingContext)

export async function init (messages, baseEnvironment) {
    const init = await messages.initialSetup()

    const environment = baseEnvironment
        .withEnv(init.env)

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    const { platform, debugState, willThrow } = environment;

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider platform={platform} debugState={debugState} willThrow={willThrow}>
                <TranslationProvider text={i18n}>
                    <MessagingContext.Provider value={{ messages }}>
                        <App />
                    </MessagingContext.Provider>
                </TranslationProvider>
            </EnvironmentProvider>
            , root)
    }
    if (environment.display === 'components') {
        render(
            <EnvironmentProvider platform={platform} debugState={debugState} willThrow={willThrow}>
                <Components />
            </EnvironmentProvider>
            , root)
    }
}
