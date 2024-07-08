import { createTypedMessages } from '@duckduckgo/messaging'
import { Environment } from '../../../../shared/environment.js'
import { createSpecialPageMessaging } from '../../../../shared/create-special-page-messaging.js'
import { init } from '../../app/index.js'

export class ExamplePage {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     */
    constructor (messaging) {
        this.messaging = createTypedMessages(this, messaging)
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     */
    initialSetup () {
        return this.messaging.request('initialSetup')
    }

    /**
     * This will be sent if the application has loaded, but a client-side error
     * has occurred that cannot be recovered from
     * @param {{message: string}} params
     */
    reportPageException (params) {
        this.messaging.notify('reportPageException', params)
    }

    /**
     * This will be sent if the application fails to load.
     * @param {{message: string}} params
     */
    reportInitException (params) {
        this.messaging.notify('reportInitException', params)
    }
}

const baseEnvironment = new Environment()
    .withPlatform(document.documentElement.dataset.platform)
    .withEnv(import.meta.env)

const messaging = createSpecialPageMessaging({
    injectName: baseEnvironment.platform,
    env: baseEnvironment.env,
    pageName: /** @type {string} */(import.meta.pageName)
})

const example = new ExamplePage(messaging)

init(example, baseEnvironment).catch(e => {
    // messages.
    console.error(e)
    const msg = typeof e?.message === 'string' ? e.message : 'unknown init error'
    example.reportInitException({ message: msg })
})
