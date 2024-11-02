import { MessagingContext } from '../../index.js'
import { AndroidMessagingConfig } from '../android.js'

/**
 * This should match the string provided in the Android codebase
 * @type {string}
 */
const javascriptInterface = 'ContentScopeScripts'

/**
 * Create a *single* instance of AndroidMessagingConfig and share it.
 */
const config = new AndroidMessagingConfig({
    messageSecret: 'abc',
    messageCallback: 'callback_123', // the method that android will execute with responses
    target: globalThis, // where the global properties exist
    javascriptInterface,
    debug: false
})

/**
 * Context is per-feature;
 */
const messagingContext = new MessagingContext({
    context: javascriptInterface,
    featureName: 'hello-world',
    env: 'development'
})

/**
 * And then send notifications!
 */
const messaging = config.intoMessaging(messagingContext)
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

/**
 * Create messaging for 2 separate features
 */
const messagingContext1 = new MessagingContext({
    context: 'contentScopeScripts',
    featureName: 'hello-world',
    env: 'development'
})

/**
 * Just change the feature name for a second feature
 */
const messagingContext2 = { ...messagingContext1, featureName: 'duckPlayer' }

/**
 * Now, each feature has its own isolated messaging...
 */
const messaging1 = config.intoMessaging(messagingContext1)
messaging1.notify('helloWorld')

const messaging2 = config.intoMessaging(messagingContext2)
messaging2.notify('getUserValues')
