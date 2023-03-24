import { Messaging, MessagingContext, WebkitMessagingConfig } from '../../index.js'

/**
 * Webkit messaging involves calling methods on `window.webkit.messageHandlers`.
 *
 * For catalina support we support encryption which is the bulk of this configuration
 */
const config = new WebkitMessagingConfig({
  hasModernWebkitAPI: true,
  secret: 'SECRET',
  webkitMessageHandlerNames: ['helloWorld', 'sendPixel'],
})

const messagingContext = new MessagingContext({
  context: 'contentScopeScripts',
  featureName: 'hello-world',
  env: 'development'
})


/**
 * Send notifications!
 */
const messaging = new Messaging(messagingContext, config)
messaging.notify('sendPixel')

/**
 * Or request some data
 */
messaging.request('helloWorld', { foo: 'bar' }).then(console.log).catch(console.error)
