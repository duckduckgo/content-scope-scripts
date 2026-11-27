import { ExtensionMessagingConfig } from '../extension.js';
import { Messaging, MessagingContext } from '../../index.js';

/**
 * In an extension page (for example a special page served by the extension), notifications and
 * requests go to the extension's background service worker over a `chrome.runtime.Port` with this
 * name. The background listens with `chrome.runtime.onConnect` and checks `port.name`.
 *
 * The port closes whenever the service worker stops, and the next message reconnects. A request
 * whose port closes before the reply is rejected, not re-sent.
 */
const config = new ExtensionMessagingConfig({
    portName: 'specialPages',
});

const messagingContext = new MessagingContext({
    context: 'specialPages',
    featureName: 'hello-world',
    env: 'development',
});

/**
 * And then send notifications!
 */
const messaging = new Messaging(messagingContext, config);
messaging.notify('helloWorld');

/**
 * Or request some data. The background answers on the same port with
 * `{ context, featureName, id, result }` or `{ context, featureName, id, error: { message } }`.
 */
messaging.request('getData', { foo: 'bar' }).then(console.log).catch(console.error);

/**
 * Or subscribe for push messages. The background broadcasts them without a port:
 * `chrome.runtime.sendMessage({ context, featureName, subscriptionName, params })`.
 */
const unsubscribe = messaging.subscribe('onDataUpdated', (data) => console.log(data));

// later
unsubscribe();
