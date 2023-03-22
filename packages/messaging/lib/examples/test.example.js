import { Messaging, MessagingContext, TestTransportConfig } from '../../index.js'

/**
 * Creates an ad-hoc messaging transport - useful for testing
 * @type {TestTransportConfig}
 */
const config = new TestTransportConfig({
    /**
     * @param {import("../../index.js").NotificationMessage} msg
     */
    notify (msg) {
        console.log(msg)
    },
    /**
     * @param {import("../../index.js").RequestMessage} msg
     * @returns {Promise<unknown>}
     */
    request: async (msg) => {
        if (msg.method === 'getUserValues') {
            return {
              foo: "bar"
            }
        }
        return null
    },
    /**
     * @param {import("../../index.js").Subscription} msg
     */
    subscribe (msg) {
        console.log(msg)
        return () => {
            console.log('teardown')
        }
    }
})

const messagingContext = new MessagingContext({
    context: 'contentScopeScripts',
    featureName: 'hello-world',
    env: 'development'
})

/**
 * And then send notifications!
 */
const messaging = new Messaging(messagingContext, config)
messaging.notify('helloWorld')

/**
 * Or request some data
 */
messaging.request('getData', { foo: 'bar' }).then(console.log).catch(console.error)

/**
 * Or subscribe for push messages
 */
const unsubscribe = messaging.subscribe('getData', (data) => console.log(data))

// later
unsubscribe()
