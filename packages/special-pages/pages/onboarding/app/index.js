import {
    OnboardingMessages
} from './messages'
import { render, h } from 'preact'
import './styles/global.css' // global styles
import { App, SkipLink } from './components/App.js'
import { GlobalProvider } from './global'
import { Components } from './Components'
import {Environment, EnvironmentProvider, UpdateEnvironment} from './environment'
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging'
import {Settings} from "./settings";

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env) // use the build's ENV

// share this in the app, it's an instance of `OnboardingMessages` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: baseEnvironment.env,
    pageName: 'onboarding'
})

const onboarding = new OnboardingMessages(messaging, baseEnvironment.platform)

async function init () {

    const init = await onboarding.init()

    // update the 'env' in case it was changed by native
    const environment = baseEnvironment.withEnv(init.env);

    const settings = new Settings()
        .withOrder(init.order)
        .withStepDefinitions(init.stepDefinitions)
        .withNamedOrder(environment.urlParams.get('order'))
        .withFirst(environment.urlParams.get('first'));

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider
                debugState={environment.debugState}
                platform={environment.platform}
                willThrow={environment.willThrow}
            >
                <UpdateEnvironment search={window.location.search} />
                <GlobalProvider
                    messaging={onboarding}
                    order={settings.order}
                    stepDefinitions={settings.stepDefinitions}
                    firstPage={settings.first}>
                    <App>
                        {environment.env === 'development' && <SkipLink />}
                    </App>
                </GlobalProvider>
            </EnvironmentProvider>
            , root)
    }
    if (environment.display === 'components') {
        render(
            <EnvironmentProvider debugState={false} platform={environment.platform}>
                <Components />
            </EnvironmentProvider>
            , root)
    }
}

init().catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    onboarding.reportInitException({ message: msg })
})
