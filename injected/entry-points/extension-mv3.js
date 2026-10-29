/**
 * @module main world integration for Chrome MV3 and Firefox (enhanced) MV2
 */
import { load, init, update } from '../src/content-scope-features.js';
import { computeLimitedSiteObject, registerMessageSecret } from '../src/utils.js';
import { extensionConstructMessagingConfig, getSharedMessagingTransport } from '../src/sendmessage-transport.js';

const randomValue = /** @type {number} */ (crypto.getRandomValues(new Uint32Array(1))[0]);
const secret = (randomValue / 2 ** 32).toString().replace('0.', '');

// The message bridge listens from load, before the extension registers.
registerMessageSecret(secret);

load({
    platform: {
        name: 'extension',
    },
    site: computeLimitedSiteObject(),
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    bundledConfig: $BUNDLED_CONFIG$,
    messagingContextName: 'contentScopeScripts',
    messageSecret: secret,
    messagingConfig: extensionConstructMessagingConfig(),
});

// @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
window.addEventListener(secret, ({ detail: encodedMessage }) => {
    if (!encodedMessage) return;
    const message = JSON.parse(encodedMessage);

    switch (message.type) {
        case 'update':
            // Answers to the message bridge's requests can come before the register message.
            if (message.messageType === 'response') {
                getSharedMessagingTransport().onResponse(message);
            }
            update(message);
            break;
        case 'register':
            if (message.argumentsObject) {
                message.argumentsObject.messageSecret = secret;
                message.argumentsObject.messagingConfig = extensionConstructMessagingConfig();
                if (!message.argumentsObject?.site?.enabledFeatures) {
                    // Potentially corrupted site object, don't init
                    return;
                }
                init(message.argumentsObject);
            }
            break;
        default:
            // Messages with messageType are subscription responses from the extension.
            // Route them to the shared transport so all subscribed features receive them.
            if (message.messageType) {
                const transport = getSharedMessagingTransport();
                if (transport?.onResponse) {
                    transport.onResponse(message);
                }
            }
            break;
    }
});

window.dispatchEvent(
    new CustomEvent('ddg-secret', {
        detail: secret,
    }),
);
