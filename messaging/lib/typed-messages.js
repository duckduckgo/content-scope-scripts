/**
 * This utility can be used to convert an instance of the `Messaging` interface
 * into a strongly typed one.
 *
 * The first input is any class where you've added your typed messages,
 * and then the second input is any instance of Messaging, which gets converted
 * into only calls supported by your schema
 *
 * @template {Partial<import("./shared-types").MessagingBase>} BaseClass
 * @param {BaseClass} base - the class onto which you've added the properties from `MessagingBase`
 * @param {import("@duckduckgo/messaging").Messaging} messaging
 * @returns {BaseClass}
 */
export function createTypedMessages(base, messaging) {
    const asAny = /** @type {any} */ (messaging)
    return /** @type {BaseClass} */ (asAny)
}
