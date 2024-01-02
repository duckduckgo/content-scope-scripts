import {
    createOnboardingMessaging
} from './messages'
import { render, h } from 'preact'
import './styles/style.css' // global styles
import { App } from './components/App.js'
import { GlobalProvider } from './global'
import { Components } from './Components'
import { SettingsProvider } from './settings'
import { PAGE_IDS } from './types'

// share this in the app, it's an instance of `OnboardingMessages` where all your native comms should be
const messaging = createOnboardingMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env
})

export function init () {
    const root = document.querySelector('#app')
    const env = new URLSearchParams(location.search).get('env') || 'components'
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches === true

    // can we skip to a page?
    let first = new URLSearchParams(location.search).get('page') || 'welcome'
    if (!PAGE_IDS.includes(/** @type {any} */(first))) {
        first = 'welcome'
        console.warn('tried to skip to an unsupported page')
    }

    if (!root) throw new Error('could not render, root element missing')
    if (env === 'app') {
        render(
            <SettingsProvider isReducedMotion={isReducedMotion}>
                <GlobalProvider messaging={messaging} firstPage={/** @type {import('./types').Step['id']} */(first)}>
                    <App />
                </GlobalProvider>
            </SettingsProvider>
            , root)
    }
    if (env === 'components') {
        render(
            <SettingsProvider isReducedMotion={isReducedMotion}>
                <Components />
            </SettingsProvider>
            , root)
    }
}

try {
    init()
} catch (e) {
    console.error(e)
    messaging.reportInitException({ message: e?.message || 'unknown init error' })
}
