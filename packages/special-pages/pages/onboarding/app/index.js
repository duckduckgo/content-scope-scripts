import {
    OnboardingMessages
} from './messages'
import { render, h } from 'preact'
import './styles/global.css' // global styles
import { App, SkipLink } from './components/App.js'
import { GlobalProvider } from './global'
import { Components } from './Components'
import { SettingsProvider, UpdateSettings } from './settings'
import { PAGE_IDS, PLATFORMS } from './types'
import { stepDefinitions } from './data'
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging'

// share this in the app, it's an instance of `OnboardingMessages` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    pageName: 'onboarding',
})

const onboarding = new OnboardingMessages(messaging, import.meta.injectName);

async function init () {
    const init = await onboarding.init()

    for (const [key, value] of Object.entries(init?.stepDefinitions || {})) {
        if (PAGE_IDS.includes(/** @type {any} */(key))) {
            // this mutates the object in place, fine since we only use it once in the entire lifetime of the app
            Object.assign(stepDefinitions[key], value)
        }
    }

    const root = document.querySelector('#app')
    const params = new URLSearchParams(location.search)

    const env = params.get('env') || 'app'

    // can we skip to a page?
    let first = params.get('page') || 'welcome'
    if (!PAGE_IDS.includes(/** @type {any} */(first))) {
        first = 'welcome'
        console.warn('tried to skip to an unsupported page')
    }

    let platform = /** @type {any} */(document.documentElement.dataset.platform || 'windows')
    if (!PLATFORMS.includes(/** @type {any} */(platform))) {
        platform = 'windows'
    }

    // should we should some debugging overlays
    const debugState = params.has('debugState')

    // should we simulate a fatal exception (something we can't recover from)
    const willThrow = (params.get('willthrow') || params.get('willThrow')) === 'true'

    if (!root) throw new Error('could not render, root element missing')

    if (env === 'app') {
        render(
            <SettingsProvider
                debugState={debugState}
                platform={platform}
                willThrow={willThrow}
            >
                <UpdateSettings search={window.location.search} />
                <GlobalProvider
                    messaging={onboarding}
                    stepDefinitions={stepDefinitions}
                    firstPage={/** @type {import('./types').Step['id']} */(first)}>
                    <App>
                        {init.env === 'development' && <SkipLink />}
                    </App>
                </GlobalProvider>
            </SettingsProvider>
            , root)
    }
    if (env === 'components') {
        render(
            <SettingsProvider debugState={false} platform={platform}>
                <Components />
            </SettingsProvider>
            , root)
    }
}

init().catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    onboarding.reportInitException({ message: msg })
})
