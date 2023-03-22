export class ExamplePageMessages {
    /**
     * @param {import("@duckduckgo/messaging").Messaging} messaging
     * @internal
     */
    constructor (messaging) {
        this.messaging = messaging
    }

    requests = {
        /**
         * @returns {Promise<boolean>}
         */
        getOptions: async () => {
            return this.messaging.request('hello', { world: 'here' })
        }
    }

    notifications = {
        /**
         * @param {import("./pixels.js").Pixel} knownPixel
         */
        sendPixel: (knownPixel) => {
            this.messaging.notify(knownPixel.name(), knownPixel.params())
        }
    }
}
