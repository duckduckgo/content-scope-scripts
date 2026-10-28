import { TestTransportConfig } from '@duckduckgo/messaging';
import { MessageBridge } from '../src/features/message-bridge.js';
import { InstallProxy, ProxyRequest } from '../src/features/message-bridge/schema.js';

const SECRET = 'secret';
const FORM_DOMAIN = 'internalapps.duckduckgo.com';

/**
 * @param {string} bridgeState
 */
function bundledConfigWithBridge(bridgeState) {
    return {
        unprotectedTemporary: [],
        features: {
            navigatorInterface: {
                state: 'enabled',
                exceptions: [],
                settings: {
                    privilegedDomains: [{ domain: 'duckduckgo.com' }],
                },
            },
            messageBridge: {
                state: bridgeState,
                exceptions: [],
                settings: {
                    internalFeedback: 'disabled',
                    conditionalChanges: [
                        { domain: FORM_DOMAIN, patchSettings: [{ op: 'replace', path: '/internalFeedback', value: 'enabled' }] },
                    ],
                },
            },
        },
    };
}

/**
 * @param {{ domain?: string, platform?: string, bridgeState?: string }} [options]
 */
function setUp({ domain = FORM_DOMAIN, platform = 'extension', bridgeState = 'enabled' } = {}) {
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
        bundledConfig: bundledConfigWithBridge(bridgeState),
        messageSecret: SECRET,
        messagingConfig,
        messagingContextName: 'contentScopeScripts',
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

    return { bridge, args, send, replies, requestsToPlatform };
}

const install = new InstallProxy({ featureName: 'internalFeedback', id: 'install-1' });
const request = new ProxyRequest({ featureName: 'internalFeedback', method: 'getDeviceInfo', id: 'request-1' });

describe('MessageBridge at load', () => {
    beforeAll(() => {
        globalThis.isSecureContext = true;
    });
    afterAll(() => {
        Reflect.deleteProperty(globalThis, 'isSecureContext');
    });

    it('installs and answers in the extension when the bundled config enables the feature on the page', async () => {
        const { bridge, args, send, replies, requestsToPlatform } = setUp();
        bridge.load(args);

        send(install);
        expect(replies).toEqual([jasmine.objectContaining({ id: 'install-1' })]);

        send(request);
        await new Promise((resolve) => setTimeout(resolve));
        expect(requestsToPlatform).toEqual([jasmine.objectContaining({ featureName: 'internalFeedback', method: 'getDeviceInfo' })]);
        expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', result: { platform: 'windows' } }));
    });

    it('listens on a privileged domain where the config enables no feature, and installs nothing there', () => {
        const { bridge, args, send, replies } = setUp({ domain: 'duckduckgo.com' });
        bridge.load(args);
        expect(bridge.installed).toBeTrue();
        send(install);
        expect(replies).toEqual([]);
    });

    it('does not listen outside the privileged domains', () => {
        const { bridge, args } = setUp({ domain: 'example.com' });
        bridge.load(args);
        expect(bridge.installed).toBeFalse();
    });

    it('does not listen when the bundled config disables the bridge', () => {
        const { bridge, args } = setUp({ bridgeState: 'disabled' });
        bridge.load(args);
        expect(bridge.installed).toBeFalse();
    });

    it('does not listen outside the extension', () => {
        const { bridge, args } = setUp({ platform: 'windows' });
        bridge.load(args);
        expect(bridge.installed).toBeFalse();
    });

    it('keeps answering through a proxy installed at load after the remote config arrives', async () => {
        const { bridge, args, send, replies, requestsToPlatform } = setUp();
        bridge.load(args);
        send(install);

        await bridge.callInit({ ...args, featureSettings: { messageBridge: { internalFeedback: 'disabled' } } });
        send(request);
        await new Promise((resolve) => setTimeout(resolve));

        expect(requestsToPlatform).toEqual([jasmine.objectContaining({ featureName: 'internalFeedback', method: 'getDeviceInfo' })]);
        expect(replies[1]).toEqual(jasmine.objectContaining({ id: 'request-1', result: { platform: 'windows' } }));
    });

    it('decides later installs by the remote config', async () => {
        const { bridge, args, send, replies } = setUp();
        bridge.load(args);

        await bridge.callInit({ ...args, featureSettings: { messageBridge: { internalFeedback: 'disabled', aiChat: 'enabled' } } });
        send(install);
        send(new InstallProxy({ featureName: 'aiChat', id: 'install-2' }));

        expect(replies).toEqual([jasmine.objectContaining({ id: 'install-2' })]);
    });

    it('answers each install once when init follows load', async () => {
        const { bridge, args, send, replies } = setUp();
        bridge.load(args);
        await bridge.callInit(args);

        send(install);
        expect(replies.length).toBe(1);
    });
});
