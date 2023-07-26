import { createMessaging } from './create-messaging.js'

/**
 * @class GlobalContext
 * @description Global context passed to all features
 */
export class GlobalContext {
    /** @type {import('../packages/messaging/index').Messaging | null} */
    debugMessaging = null

    /**
     * @param {import('./content-scope-features.js').LoadArgs} args
     */
    constructor (args) {
        if (args.platform.name === 'extension') {
            if (typeof import.meta.injectName === 'undefined') throw new Error('import.meta.injectName missing')
            this.debugMessaging = createMessaging({ name: 'debug', isDebug: false }, import.meta.injectName) // isDebug is not yet known when GlobalContext is created
        }
    }
}
