export class SSLErrorPageMessages {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        /**
         * @internal
         */
        this.messaging = messaging
    }

    notify (message) {
        return this.messaging.notify(message)
    }
}
