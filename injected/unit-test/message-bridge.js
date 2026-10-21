import { TestTransportConfig } from '@duckduckgo/messaging';
import { MessageBridge } from '../src/features/message-bridge.js';
import { getSharedMessagingTransport } from '../src/sendmessage-transport.js';
import { InstallProxy, ProxyRequest } from '../src/features/message-bridge/schema.js';

const SECRET = 'secret';
const FORM_DOMAIN = 'internalapps.duckduckgo.com';

/**
 * @param {{ domain?: string, platform?: string }} [options]
 */
function setUp({ domain = FORM_DOMAIN, platform = 'extension' } = {}) {
    /** @type {unknown[]} */
    const requestsToPlatform = [];
    const messagingConfig = new TestTransportConfig({
        notify() {},
        request(msg) {
            requestsToPlatform.push(msg);
            return Promise.resolve({ platform: 'windows' });
        },
        subscribe() {
            return () => {};
        },
    });
    const args = {
        platform: { name: platform },
        site: { domain, url: `https://${domain}/` },
        messageSecret: SECRET,
        messagingConfig,
        messagingContextName: 'contentScopeScripts',
        featureSettings: {},
    };
    const bridge = new MessageBridge('messageBridge', {}, {}, args);
    const page = new EventTarget();
    bridge.captured = {
        addEventListener: page.addEventListener.bind(page),
        dispatchEvent: page.dispatchEvent.bind(page),
        CustomEvent,
    };

    /** @type {Record<string, any>[]} */
    const replies = [];
    /**
     * @param {InstallProxy | ProxyRequest} message
     */
    const send = (message) => {
        page.addEventListener(`${message.name === InstallProxy.NAME ? 'DID_INSTALL' : 'PROXY_RESPONSE'}-${message.id}-${SECRET}`, (e) =>
            replies.push(/** @type {CustomEvent} */ (e).detail),
        );
        page.dispatchEvent(new CustomEvent(`${message.name}-${SECRET}`, { detail: { ...message } }));
    };
    /**
     * @param {string} feedbackSetting
     */
    const remoteConfigArrives = (feedbackSetting) =>
        bridge.callInit({ ...args, featureSettings: { messageBridge: { internalFeedback: feedbackSetting } } });

    return { bridge, args, send, replies, requestsToPlatform, remoteConfigArrives };
}

const install = new InstallProxy({ featureName: 'internalFeedback', id: 'install-1' });
const request = new ProxyRequest({ featureName: 'internalFeedback', method: 'getDeviceInfo', id: 'request-1' });

describe('MessageBridge before the remote config arrives in the extension', () => {
    beforeAll(() => {
        globalThis.isSecureContext = true;
    });
    afterAll(() => {
        Reflect.deleteProperty(globalThis, 'isSecureContext');
    });

    it('confirms the feedback form install at once and delivers its held request once the remote config allows it', async () => {
        const { bridge, args, send, replies, requestsToPlatform, remoteConfigArrives } = setUp();
        bridge.load(args);

        send(install);
        expect(replies).toEqual([jasmine.objectContaining({ id: 'install-1' })]);

        send(request);
        expect(requestsToPlatform).toEqual([]);

        await remoteConfigArrives('enabled');
        await new Promise((resolve) => setTimeout(resolve));
        expect(requestsToPlatform).toEqual([jasmine.objectContaining({ featureName: 'internalFeedback', method: 'getDeviceInfo' })]);
        expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', result: { platform: 'windows' } }));
    });

    it('fails the held request when the remote config does not enable the feature', async () => {
        const { bridge, args, send, replies, requestsToPlatform, remoteConfigArrives } = setUp();
        bridge.load(args);
        send(install);
        send(request);

        await remoteConfigArrives('disabled');

        expect(requestsToPlatform).toEqual([]);
        expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', error: jasmine.any(Object) }));
    });

    it('fails the held request when the bridge is skipped', () => {
        const { bridge, args, send, replies } = setUp();
        bridge.load(args);
        send(install);
        send(request);

        bridge.markFeatureAsSkipped('feature is broken or disabled on this site');

        expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', error: jasmine.any(Object) }));
    });

    it('fails the held request when the remote config never arrives', () => {
        jasmine.clock().install();
        try {
            const { bridge, args, send, replies } = setUp();
            bridge.load(args);
            send(install);
            send(request);

            jasmine.clock().tick(10_000);

            expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', error: jasmine.any(Object) }));
        } finally {
            jasmine.clock().uninstall();
        }
    });

    it('confirms no install for another domain or feature', () => {
        const other = setUp({ domain: 'duckduckgo.com' });
        other.bridge.load(other.args);
        other.send(install);
        expect(other.replies).toEqual([]);

        const form = setUp();
        form.bridge.load(form.args);
        form.send(new InstallProxy({ featureName: 'serp', id: 'install-2' }));
        expect(form.replies).toEqual([]);
    });

    it('does not listen at load outside the extension', () => {
        const { bridge, args, send, replies } = setUp({ platform: 'windows' });
        bridge.load(args);
        send(install);
        expect(replies).toEqual([]);
    });
});

describe('MessageBridge in the extension', () => {
    it('routes the extension responses to the shared transport', () => {
        const bridge = new MessageBridge('messageBridge', {}, {}, { platform: { name: 'extension' } });
        const onResponse = spyOn(getSharedMessagingTransport(), 'onResponse');
        const response = { type: 'update', messageType: 'response', responseMessageType: 'getDeviceInfo', response: {} };

        bridge.update(response);
        bridge.update({ type: 'update', messageType: 'other' });

        expect(onResponse.calls.allArgs()).toEqual([[response]]);
    });
});
