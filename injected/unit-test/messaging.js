import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    RequestMessage,
    NotificationMessage,
    Subscription,
    MessageResponse,
    SubscriptionEvent,
} from '@duckduckgo/messaging';
import { AndroidMessagingConfig } from '@duckduckgo/messaging/lib/android.js';
import { ExtensionMessagingConfig } from '@duckduckgo/messaging/lib/extension.js';

describe('Messaging Transports', () => {
    it('calls transport with a RequestMessage', () => {
        const { messaging, transport } = createMessaging();

        const spy = spyOn(transport, 'request');

        messaging.request('helloWorld', { foo: 'bar' });

        // grab the auto-generated `id` field
        const [requestMessage] = spy.calls.first()?.args ?? [];
        expect(typeof requestMessage.id).toBe('string');
        expect(requestMessage.id.length).toBeGreaterThan(0);

        expect(spy).toHaveBeenCalledWith(
            new RequestMessage({
                context: 'contentScopeScripts',
                featureName: 'hello-world',
                id: requestMessage.id,
                method: 'helloWorld',
                params: { foo: 'bar' },
            }),
        );
    });
    it('calls transport with a NotificationMessage', () => {
        const { messaging, transport } = createMessaging();

        const spy = spyOn(transport, 'notify');

        messaging.notify('helloWorld', { foo: 'bar' });

        expect(spy).toHaveBeenCalledWith(
            new NotificationMessage({
                context: 'contentScopeScripts',
                featureName: 'hello-world',
                method: 'helloWorld',
                params: { foo: 'bar' },
            }),
        );
    });
    it("calls transport with a NotificationMessage and doesn't throw (but does log)", () => {
        const { messaging, transport } = createMessaging();
        const notifySpy = spyOn(transport, 'notify').and.throwError('Test error 1');
        const errorLoggingSpy = spyOn(console, 'error');

        try {
            messaging.notify('helloWorld', { foo: 'bar' });
        } catch (e) {
            fail('Should not throw');
        }

        expect(notifySpy).toHaveBeenCalledWith(
            new NotificationMessage({
                context: 'contentScopeScripts',
                featureName: 'hello-world',
                method: 'helloWorld',
                params: { foo: 'bar' },
            }),
        );

        expect(errorLoggingSpy.calls.first().args[0]).toContain('[Messaging] Failed to send notification:');
        expect(errorLoggingSpy.calls.first().args[1].message).toEqual('Test error 1');
    });
    it('calls transport with a NotificationMessage and handles rejected promises (but does log)', async () => {
        const { messaging, transport } = createMessaging();
        const asyncError = new Error('Test error 2');
        const notifySpy = spyOn(transport, 'notify').and.returnValue(Promise.reject(asyncError));
        const errorLoggingSpy = spyOn(console, 'error');

        messaging.notify('helloWorld', { foo: 'bar' });
        await Promise.resolve();

        expect(notifySpy).toHaveBeenCalledWith(
            new NotificationMessage({
                context: 'contentScopeScripts',
                featureName: 'hello-world',
                method: 'helloWorld',
                params: { foo: 'bar' },
            }),
        );

        expect(errorLoggingSpy.calls.first().args[0]).toContain('[Messaging] Failed to send notification:');
        expect(errorLoggingSpy.calls.first().args[1]).toEqual(asyncError);
    });
    it("doesn't throw when notification logging fails", () => {
        const { messaging, transport } = createMessaging();
        spyOn(transport, 'notify').and.throwError('Test error 3');
        spyOn(console, 'error').and.callFake(() => {
            throw new Error('Logger unavailable');
        });

        expect(() => {
            messaging.notify('helloWorld', { foo: 'bar' });
        }).not.toThrow();
    });
    it('calls transport with a Subscription', () => {
        const { messaging, transport } = createMessaging();

        const spy = spyOn(transport, 'subscribe');
        const callback = jasmine.createSpy();

        messaging.subscribe('helloWorld', callback);

        expect(spy).toHaveBeenCalledWith(
            new Subscription({
                context: 'contentScopeScripts',
                featureName: 'hello-world',
                subscriptionName: 'helloWorld',
            }),
            callback,
        );
    });
});

describe('Android', () => {
    /**
     * @param {Record<string, any>} target
     * @return {AndroidMessagingConfig}
     */
    function createConfig(target) {
        const config = new AndroidMessagingConfig({
            target,
            messageSecret: 'abc',
            javascriptInterface: 'AnyRandomValue',
            messageCallback: 'callback_abc_def',
            debug: false,
        });
        return config;
    }
    /**
     * @param {string} featureName
     * @param {AndroidMessagingConfig} config
     */
    function createContext(featureName, config) {
        const messageContextA = new MessagingContext({
            context: 'contentScopeScripts',
            featureName,
            env: 'development',
        });
        const messaging = new Messaging(messageContextA, config);
        return { messaging };
    }
    it('sends notification to 1 feature', () => {
        const spy = jasmine.createSpy();
        const target = {
            AnyRandomValue: {
                process: spy,
            },
        };
        const config = createConfig(target);
        const { messaging } = createContext('featureA', config);
        messaging.notify('helloWorld');
        const payload = '{"context":"contentScopeScripts","featureName":"featureA","method":"helloWorld","params":{}}';
        const secret = 'abc';
        expect(spy).toHaveBeenCalledWith(payload, secret);
    });
    it('sends notification to 2 separate features', () => {
        const spy = jasmine.createSpy();
        const target = {
            AnyRandomValue: {
                process: spy,
            },
        };
        const config = createConfig(target);
        const { messaging } = createContext('featureA', config);
        const { messaging: bMessaging } = createContext('featureB', config);
        messaging.notify('helloWorld');
        bMessaging.notify('helloWorld');
        const expected1 = '{"context":"contentScopeScripts","featureName":"featureA","method":"helloWorld","params":{}}';
        const expected2 = '{"context":"contentScopeScripts","featureName":"featureA","method":"helloWorld","params":{}}';
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith(expected1, 'abc');
        expect(spy).toHaveBeenCalledWith(expected2, 'abc');
    });
    it('sends request and gets response', async () => {
        const spy = jasmine.createSpy();
        /** @type {MessageResponse} */
        let msg;
        /** @type {string} */
        let token;
        const target = {
            AnyRandomValue: {
                process: (outgoing, _token) => {
                    msg = JSON.parse(outgoing);
                    token = _token;
                    spy(outgoing, _token);
                },
            },
        };
        const config = createConfig(target);
        const { messaging } = createContext('featureA', config);
        const request = messaging.request('helloWorld');

        // @ts-expect-error - unit-testing
        if (!msg) throw new Error('must have set msg by this point in the test');

        // simulate a valid response
        const response = new MessageResponse({
            id: msg.id,
            context: 'contentScopeScripts',
            featureName: msg.featureName,
            result: { foo: 'bar' },
        });

        // pretend to call back from native
        target[config.messageCallback](config.messageSecret, response);

        // wait for it to resolve
        const result = await request;

        const outgoingMessage = {
            context: 'contentScopeScripts',
            featureName: 'featureA',
            method: 'helloWorld',
            id: msg.id,
            params: {},
        };

        // Android messages are sent as a JSON string
        const asJsonString = JSON.stringify(outgoingMessage);
        expect(spy).toHaveBeenCalledWith(asJsonString, 'abc');

        // ensure the result is correct
        expect(result).toEqual({ foo: 'bar' });

        // @ts-expect-error - unit-testing
        expect(token).toEqual(config.messageSecret);
    });
    it('allows subscriptions', (done) => {
        const spy = jasmine.createSpy();
        const globalTarget = {
            AnyRandomValue: {
                process: spy,
            },
        };
        const config = createConfig(globalTarget);
        const { messaging } = createContext('featureA', config);

        // create the message as the native side would
        const subEvent1 = new SubscriptionEvent({
            context: 'contentScopeScripts',
            featureName: 'featureA',
            subscriptionName: 'onUpdate',
            params: { foo: 'bar' },
        });

        // subscribe to 'onUpdate'
        messaging.subscribe('onUpdate', (data) => {
            expect(data).toEqual(subEvent1.params);
            done();
        });

        // simulate native calling this method
        globalTarget[config.messageCallback](config.messageSecret, subEvent1);
    });
});

/**
 * Creates a test transport and Messaging instance for testing
 */
function createMessaging() {
    /** @type {import("@duckduckgo/messaging").MessagingTransport} */
    const transport = {
        notify(_) {
            // test
        },

        request: (_msg) => {
            // test
            return Promise.resolve(null);
        },

        subscribe(_msg) {
            // test
            return () => {
                // test teardown
            };
        },
    };

    const testTransportConfig = new TestTransportConfig(transport);

    const messagingContext = new MessagingContext({
        context: 'contentScopeScripts',
        featureName: 'hello-world',
        env: 'development',
    });

    const messaging = new Messaging(messagingContext, testTransportConfig);

    return { transport, messaging };
}

describe('Extension', () => {
    /**
     * A fake chrome.runtime. Each connect() opens a new port; fromPort and disconnect act on the latest one.
     * die closes the latest port without firing onDisconnect, so posting to it throws.
     * @type {{ posted: any[], fromPort: (msg: any) => void, disconnect: () => void, die: () => void, fromRuntime: (msg: any) => void, runtimeListeners: any[], connect: jasmine.Spy }}
     */
    let fake;

    beforeEach(() => {
        /** @type {any[]} */
        const posted = [];
        /** @type {((msg: any) => void)[]} */
        const runtimeListeners = [];
        /** @type {{ messageListeners: Set<(msg: any) => void>, disconnectListeners: Set<() => void>, dead: boolean }} */
        let latest = { messageListeners: new Set(), disconnectListeners: new Set(), dead: false };
        const connect = jasmine.createSpy('connect').and.callFake(() => {
            const port = { messageListeners: new Set(), disconnectListeners: new Set(), dead: false };
            latest = port;
            return {
                postMessage: (/** @type {any} */ msg) => {
                    if (port.dead) throw new Error('Attempting to use a disconnected port object');
                    posted.push(msg);
                },
                onMessage: { addListener: (/** @type {(msg: any) => void} */ fn) => port.messageListeners.add(fn) },
                onDisconnect: {
                    addListener: (/** @type {() => void} */ fn) => port.disconnectListeners.add(fn),
                    removeListener: (/** @type {() => void} */ fn) => port.disconnectListeners.delete(fn),
                },
            };
        });
        /** @type {any} */ (globalThis).chrome = {
            runtime: { connect, onMessage: { addListener: (/** @type {(msg: any) => void} */ fn) => runtimeListeners.push(fn) } },
        };
        fake = {
            posted,
            fromPort: (msg) => latest.messageListeners.forEach((fn) => fn(msg)),
            disconnect: () => latest.disconnectListeners.forEach((fn) => fn()),
            die: () => {
                latest.dead = true;
            },
            fromRuntime: (msg) => runtimeListeners.forEach((fn) => fn(msg)),
            runtimeListeners,
            connect,
        };
    });

    afterEach(() => {
        delete (/** @type {any} */ (globalThis).chrome);
    });

    /**
     * @param {string} featureName
     */
    function createMessaging(featureName) {
        const config = new ExtensionMessagingConfig({ portName: 'injected' });
        const context = new MessagingContext({ context: 'contentScopeScripts', featureName, env: 'development' });
        return new Messaging(context, config);
    }

    it('opens no port and adds no runtime listener until used', () => {
        createMessaging('featureA');
        expect(fake.connect).not.toHaveBeenCalled();
        expect(fake.runtimeListeners.length).toBe(0);
    });

    it('connects a port with the given name and posts notifications on it', () => {
        const messaging = createMessaging('featureA');
        messaging.notify('helloWorld', { a: 1 });
        expect(fake.connect).toHaveBeenCalledWith({ name: 'injected' });
        expect(fake.posted).toEqual([
            new NotificationMessage({ context: 'contentScopeScripts', featureName: 'featureA', method: 'helloWorld', params: { a: 1 } }),
        ]);
    });

    it('resolves a request with the result the background posts back on the port', async () => {
        const messaging = createMessaging('featureA');
        const request = messaging.request('helloWorld');
        const [outgoing] = fake.posted;
        fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: outgoing.id, result: { foo: 'bar' } });
        expect(await request).toEqual({ foo: 'bar' });
    });

    it('rejects a request with the error the background posts back on the port', async () => {
        const messaging = createMessaging('featureA');
        const request = messaging.request('helloWorld');
        const [outgoing] = fake.posted;
        fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: outgoing.id, error: { message: 'nope' } });
        await expectAsync(request).toBeRejectedWithError('nope');
    });

    it('rejects a request when its port disconnects, and does not re-send it on the next connection', async () => {
        const messaging = createMessaging('featureA');
        const request = messaging.request('helloWorld');
        fake.disconnect();
        await expectAsync(request).toBeRejectedWithError('helloWorld: disconnected before a response was received');

        messaging.notify('next');
        expect(fake.connect).toHaveBeenCalledTimes(2);
        expect(fake.posted.map((msg) => msg.method)).toEqual(['helloWorld', 'next']);
    });

    it('delivers each subscription event received on runtime.onMessage once, to its subscriber', () => {
        const messaging = createMessaging('featureA');
        const onUpdate = jasmine.createSpy('onUpdate');
        const onOther = jasmine.createSpy('onOther');
        messaging.subscribe('onUpdate', onUpdate);
        messaging.subscribe('onOther', onOther);
        fake.fromRuntime({ context: 'contentScopeScripts', featureName: 'featureA', subscriptionName: 'onUpdate', params: { foo: 'bar' } });
        expect(onUpdate).toHaveBeenCalledOnceWith({ foo: 'bar' });
        expect(onOther).not.toHaveBeenCalled();
    });

    it('ignores subscription events for another feature, context or subscription', () => {
        const messaging = createMessaging('featureA');
        const spy = jasmine.createSpy();
        messaging.subscribe('onUpdate', spy);
        fake.fromRuntime({ context: 'contentScopeScripts', featureName: 'featureB', subscriptionName: 'onUpdate', params: {} });
        fake.fromRuntime({ context: 'specialPages', featureName: 'featureA', subscriptionName: 'onUpdate', params: {} });
        fake.fromRuntime({ context: 'contentScopeScripts', featureName: 'featureA', subscriptionName: 'other', params: {} });
        expect(spy).not.toHaveBeenCalled();
    });

    it('stops delivering subscription events once unsubscribed', () => {
        const messaging = createMessaging('featureA');
        const spy = jasmine.createSpy();
        const unsubscribe = messaging.subscribe('onUpdate', spy);
        unsubscribe();
        fake.fromRuntime({ context: 'contentScopeScripts', featureName: 'featureA', subscriptionName: 'onUpdate', params: {} });
        expect(spy).not.toHaveBeenCalled();
    });

    it('resolves a request only with the reply for its own id, feature and context', async () => {
        const messaging = createMessaging('featureA');
        const request = messaging.request('helloWorld');
        const [outgoing] = fake.posted;
        const reply = { context: 'contentScopeScripts', featureName: 'featureA', id: outgoing.id };
        fake.fromPort({ ...reply, id: 'another-request', result: 'wrong' });
        fake.fromPort({ ...reply, featureName: 'featureB', result: 'wrong' });
        fake.fromPort({ ...reply, context: 'specialPages', result: 'wrong' });
        fake.fromPort({ ...reply, result: 'right' });
        expect(await request).toBe('right');
    });

    it('resolves a request with a falsy or missing result', async () => {
        const messaging = createMessaging('featureA');
        for (const result of [null, false, 0, '']) {
            const request = messaging.request('helloWorld');
            const outgoing = fake.posted[fake.posted.length - 1];
            fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: outgoing.id, result });
            expect(await request).toBe(result);
        }
        // an undefined result loses its key when the port serializes the reply
        const request = messaging.request('helloWorld');
        const outgoing = fake.posted[fake.posted.length - 1];
        fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: outgoing.id });
        expect(await request).toBeUndefined();
    });

    it('rejects an aborted request with AbortError, and ignores a later reply', async () => {
        const messaging = createMessaging('featureA');
        const controller = new AbortController();
        const msg = new RequestMessage({ context: 'contentScopeScripts', featureName: 'featureA', method: 'helloWorld', id: 'abort-me' });
        const request = messaging.transport.request(msg, { signal: controller.signal });
        controller.abort();
        await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ name: 'AbortError' }));
        expect(() =>
            fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: 'abort-me', result: 'late' }),
        ).not.toThrow();
    });

    it('rejects a request whose signal is already aborted without posting it', async () => {
        const messaging = createMessaging('featureA');
        const msg = new RequestMessage({ context: 'contentScopeScripts', featureName: 'featureA', method: 'helloWorld', id: 'too-late' });
        const request = messaging.transport.request(msg, { signal: AbortSignal.abort() });
        await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ name: 'AbortError' }));
        expect(fake.posted).toEqual([]);
    });

    it('reconnects and posts when the port died before onDisconnect fired', async () => {
        const messaging = createMessaging('featureA');
        messaging.notify('first');
        fake.die();
        const request = messaging.request('helloWorld');
        expect(fake.connect).toHaveBeenCalledTimes(2);
        expect(fake.posted.map((msg) => msg.method)).toEqual(['first', 'helloWorld']);
        fake.fromPort({ context: 'contentScopeScripts', featureName: 'featureA', id: fake.posted[1].id, result: 'ok' });
        expect(await request).toBe('ok');
    });
});
