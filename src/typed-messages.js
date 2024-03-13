/**
 * @template {import("./shared-types").MessagingBase} BaseClass
 * @param {BaseClass} base - the class onto which you've added the properties from `MessagingBase`
 * @param {import("@duckduckgo/messaging").Messaging} messaging
 */
export function createTypedMessages (base, messaging) {
    return {
        /**
         * @type {BaseClass['notify']}
         */
        notify: (...args) => {
            const [name, params] = args
            if (name && params) {
                messaging.notify(name, params)
            } else {
                messaging.notify(name)
            }
        },
        /**
         * @type {BaseClass['request']}
         */
        request: (...args) => {
            const [name, params] = args
            if (name && params) {
                return messaging.request(args[0], params)
            }
            return messaging.request(args[0])
        }
    }
}
