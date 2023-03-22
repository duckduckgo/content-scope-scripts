import { Messaging, WebkitMessagingConfig } from '../../index.js'

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

/**
 * Send notifications!
 */
const messaging = new Messaging(config)
messaging.notify('sendPixel')

/**
 * Or request some data
 */
messaging.request('helloWorld', { foo: 'bar' }).then(console.log).catch(console.error)
