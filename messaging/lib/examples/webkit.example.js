import { MessagingContext } from '../../index.js'
import { WebkitMessagingConfig } from '../webkit.js'

/**
 * Configuration for WebkitMessaging
 */
const config = new WebkitMessagingConfig({
    hasModernWebkitAPI: true,
    secret: 'SECRET',
    webkitMessageHandlerNames: ['contentScopeScripts']
})

/**
 * Context for messaging - this helps native platforms differentiate between senders
 */
const messagingContext = new MessagingContext({
    context: 'contentScopeScripts',
    featureName: 'hello-world',
    env: 'development'
})

/**
 * With config + context, now create an instance:
 */
const messaging = config.intoMessaging(messagingContext)

/**
 * send notifications (fire and forget)
 */
messaging.notify('sendPixel');

/**
 * request data
 */
(async () => {
    const result = await messaging.request('helloWorld', { foo: 'bar' })
    console.log(result)
})()
