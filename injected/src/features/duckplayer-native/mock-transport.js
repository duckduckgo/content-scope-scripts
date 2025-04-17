import * as constants from './constants.js';
import { Logger } from './util.js';

const logger = new Logger({
    id: 'MOCK_TRANSPORT',
    shouldLog: () => true,
});

export class TestTransport {
    notify(_msg) {
        logger.log('Notifying', _msg.method);

        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = /** @type {any} */ (_msg);
        switch (msg.method) {
            case constants.MSG_NAME_CURRENT_TIMESTAMP:
                return;
            default: {
                logger.warn('unhandled notification', msg);
            }
        }
    }

    request(_msg) {
        logger.log('Requesting', _msg.method);

        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
        const msg = /** @type {any} */ (_msg);
        switch (msg.method) {
            case constants.MSG_NAME_INITIAL_SETUP: {
                return Promise.resolve({ locale: 'en' });
            }
            default:
                return Promise.resolve(null);
        }
    }

    subscribe(_msg, callback) {
        logger.log('Subscribing to', _msg.subscriptionName);

        window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });

        let response = null;
        let timeout = 1000;

        switch (_msg.subscriptionName) {
            case constants.MSG_NAME_MEDIA_CONTROL:
                response = { pause: true };
                break;
            case constants.MSG_NAME_MUTE_AUDIO:
                response = { mute: true };
                timeout = 1500;
                break;
            case constants.MSG_NAME_SERP_NOTIFY:
                timeout = 2000;
        }

        const callbackTimeout = setTimeout(() => {
            logger.log('Calling handler for', _msg.subscriptionName);
            callback(response);
        }, timeout);

        return () => {
            clearTimeout(callbackTimeout);
        };
    }
}

export function mockTransport() {
    return new TestTransport();
}
