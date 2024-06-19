import {
    ExampleMessages, MessagingContext
} from './messages'
import { render, h } from 'preact'
import '../../../shared/styles/global.css' // global styles
import { App } from './components/App.js'
import { Components } from './Components'
import { createSpecialPageMessaging } from '../../../shared/create-special-page-messaging'
import {Environment, EnvironmentProvider} from "../../../shared/components/EnvironmentProvider";
import { TranslationProvider } from "../../../shared/components/TranslationProvider";
import { i18n } from "./text";

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env) // use the build's ENV

// share this in the app, it's an instance of `ExampleMessages` where all your native comms should be
const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: import.meta.env,
    pageName: 'example'
})

const exampleMessages = new ExampleMessages(messaging, baseEnvironment.platform)

async function init () {
    const init = await exampleMessages.initialSetup()

    const environment = baseEnvironment
        .withEnv(init.env)

    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    if (environment.display === 'app') {
        render(
            <EnvironmentProvider environment={environment}>
                <TranslationProvider text={i18n}>
                    <MessagingContext.Provider value={{messages: exampleMessages}}>
                        <App />
                    </MessagingContext.Provider>
                </TranslationProvider>
            </EnvironmentProvider>
        , root)
    }
    if (environment.display === 'components') {
        render(
            <EnvironmentProvider environment={environment}>
                <Components />
            </EnvironmentProvider>
            , root)
    }
}

init().catch(e => {
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    exampleMessages.reportInitException({ message: msg })
})
