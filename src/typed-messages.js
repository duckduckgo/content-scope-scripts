/**
 * @template {import("./shared-types").MessagingBase} BaseClass
 * @param {BaseClass} base - the class onto which you've added the properties from `MessagingBase`
 * @param {import("@duckduckgo/messaging").Messaging} messaging
 * @returns {{notify: BaseClass['notify']; request: BaseClass['request']}}
 */
export function createTypedMessages (base, messaging) {
    return /** @type {any} */({
        notify: messaging.notify,
        request: messaging.request
    })
}
