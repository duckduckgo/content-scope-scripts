/**
 * @module Debug Tools
 * @category Special Pages
 *
 * @description
 *
 * A JavaScript application that provides common debugging utilities for DuckDuckGo Browsers
 */
import 'urlpattern-polyfill'
import { DebugToolsMessages, GlobalContext } from './DebugToolsMessages.mjs'
import { createSpecialPagesMessaging } from '../../../../shared/create-messaging'
import { createRoot } from 'react-dom/client'
import { inspect } from '@xstate/inspect'
import { appMachine } from './app/app.machine-impl'
import { MockImpl } from './mock-transport'
import { App, AppMachineContext } from './app/components/app'
import { lazy } from 'react'
import { createHashHistory } from 'history'

/**
 * xstate debugging - add the `?inspect` param
 */
if ((new URLSearchParams(window.location.search)).has('inspect')) {
    inspect({
        iframe: false
    })
}

/**
 * Global Setup for Monaco
 */
// @ts-expect-error - global
globalThis.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return './js/editor/json.js'
        }
        return './js/editor/editor.js'
    }
}

/**
 * Communications
 */
const messagingInstance = createSpecialPagesMessaging({
    injectName: import.meta.injectName,
    env: import.meta.env,
    featureName: 'debugToolsPage',
    mockImpl: () => new MockImpl()
})
const messages = new DebugToolsMessages(messagingInstance)

/**
 * History instance for navigation
 */
const history = createHashHistory(window)

/**
 * Setup global state
 */
const withContext = appMachine.withContext({
    error: null,
    features: null,
    params: null,
    match: null,
    page: null,
    messages,
    search: new URLSearchParams(),
    history,
    routes: {
        // eslint-disable-next-line promise/prefer-await-to-then
        '/remoteResources/:id': {
            loader: lazy(() => import('./remote-resources/remote-resources.page')),
            title: 'Remote Resources',
            feature: 'remoteResources'
        },
        '/remoteResources/**': {
            loader: lazy(() => import('./remote-resources/remote-resources.page')),
            title: 'Remote Resources',
            feature: 'remoteResources'
        },
        // eslint-disable-next-line promise/prefer-await-to-then
        '/userScripts/**': {
            loader: lazy(() => import('./components/user-scripts')),
            title: 'User Scripts',
            feature: 'userScripts'
        },
        '**': {
            loader: lazy(() => import('./components/not-found')),
            title: 'Not Found',
            feature: 'notFound'
        }
    }
})

/**
 * Now try to render
 */
const appNode = document.querySelector('#app')
const root = createRoot(appNode)

root.render(
    <GlobalContext.Provider value={{ messages, history }}>
        <AppMachineContext.Provider machine={() => withContext}>
            <App />
        </AppMachineContext.Provider>
    </GlobalContext.Provider>
)

export { DebugToolsMessages }
