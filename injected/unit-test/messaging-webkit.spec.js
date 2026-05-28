import { MessagingContext, WebkitMessagingConfig, WebkitMessagingTransport } from '@duckduckgo/messaging';

/**
 * Sets up a minimal `window.webkit.messageHandlers` fake and returns
 * helpers for inspecting / mutating it during tests. Cleans up via env.cleanup().
 */
function setupWebkit({ handlerNames = ['contentScopeScripts'] } = {}) {
    const originalWindow = /** @type {any} */ (globalThis).window;

    /** @type {Record<string, jasmine.Spy>} */
    const postMessageSpies = {};
    /** @type {Record<string, any>} */
    const handlers = {};
    for (const name of handlerNames) {
        const spy = jasmine.createSpy(`${name}.postMessage`).and.returnValue(Promise.resolve('{}'));
        postMessageSpies[name] = spy;
        handlers[name] = { postMessage: spy };
    }

    /** @type {any} */ (globalThis).window = {
        webkit: { messageHandlers: handlers },
    };

    return {
        postMessageSpies,
        handlers,
        /** Replace messageHandlers wholesale (simulates apiManipulation nullify-style hardening) */
        nullifyMessageHandlers() {
            /** @type {any} */ (globalThis).window.webkit.messageHandlers = undefined;
        },
        cleanup() {
            /** @type {any} */ (globalThis).window = originalWindow;
        },
    };
}

function makeTransport(handlerNames = ['contentScopeScripts']) {
    return new WebkitMessagingTransport(
        new WebkitMessagingConfig({ webkitMessageHandlerNames: handlerNames }),
        new MessagingContext({
            context: 'contentScopeScripts',
            featureName: 'webkit-transport-spec',
            env: 'development',
        }),
    );
}

describe('WebkitMessagingTransport', () => {
    /** @type {ReturnType<typeof setupWebkit>} */
    let env;

    afterEach(() => {
        env?.cleanup();
    });

    it('captures handler references at construction and routes wkSend through them', () => {
        env = setupWebkit();
        const transport = makeTransport();

        transport.wkSend('contentScopeScripts', { hello: 'world' });

        expect(env.postMessageSpies.contentScopeScripts).toHaveBeenCalledOnceWith({ hello: 'world' });
    });

    it('leaves the original `postMessage` on the host handler in place', () => {
        env = setupWebkit();
        const transport = makeTransport();
        expect(transport).toBeDefined();

        // Other code that reads `window.webkit.messageHandlers.X.postMessage` directly
        // must continue to see the host binding's normal shape.
        expect(typeof env.handlers.contentScopeScripts.postMessage).toBe('function');
    });

    it('continues to work after `window.webkit.messageHandlers` is replaced post-init', () => {
        env = setupWebkit();
        const transport = makeTransport();

        // Simulate site-level hardening removing the namespace after the
        // transport has been constructed (e.g. via apiManipulation defining
        // a `messageHandlers` getter that returns undefined on the
        // WebKitNamespace prototype).
        env.nullifyMessageHandlers();

        // The captured reference should still reach native (the spy on the
        // original handler object).
        transport.wkSend('contentScopeScripts', { after: 'nullify' });

        expect(env.postMessageSpies.contentScopeScripts).toHaveBeenCalledOnceWith({ after: 'nullify' });
    });

    it('throws MissingHandler when a handler was never registered', () => {
        env = setupWebkit();
        const transport = makeTransport();

        expect(() => transport.wkSend('nonExistentHandler', {})).toThrowMatching(
            (e) => e?.name === 'MissingHandler' || /Missing webkit handler/.test(e?.message ?? ''),
        );
    });

    it('ignores Object.prototype pollution when an uncaptured handler is looked up', () => {
        env = setupWebkit();
        const transport = makeTransport();

        // Hostile page-scripted prototype pollution that would, with a
        // plain `{}` cache, resolve via the prototype chain and be invoked
        // as if it were a captured native handler.
        const malicious = jasmine.createSpy('pollutedPostMessage');
        // @ts-expect-error - intentional ad-hoc property on Object.prototype to simulate page-side pollution
        // eslint-disable-next-line no-extend-native -- intentional: simulating page-side prototype pollution
        Object.prototype.hostilePollutionHandler = malicious;

        try {
            expect(() => transport.wkSend('hostilePollutionHandler', { secret: 'data' })).toThrowMatching(
                (e) => e?.name === 'MissingHandler' || /Missing webkit handler/.test(e?.message ?? ''),
            );
            expect(malicious).not.toHaveBeenCalled();
        } finally {
            // @ts-expect-error - test-only cleanup of the ad-hoc property added above
            delete Object.prototype.hostilePollutionHandler;
        }
    });

    it('cache is not derived from a tampered `Object.create`', () => {
        // Simulate page JS replacing Object.create *before* the transport is
        // constructed (which can happen because Messaging is lazy on
        // ContentFeature). The cache must still be a true null-prototype
        // object, not one synthesised by the tampered Object.create.
        const originalCreate = Object.create;
        const tampered = jasmine.createSpy('tamperedObjectCreate').and.callFake(() => ({ polluted: true }));
        Object.create = /** @type {any} */ (tampered);

        try {
            env = setupWebkit();
            const transport = makeTransport();

            // If the cache went through the tampered Object.create, looking up
            // `polluted` would resolve to `true` (the tampered factory injected
            // it as an own property). With `{ __proto__: null }` literal, it
            // doesn't.
            expect(() => transport.wkSend('polluted', {})).toThrowMatching(
                (e) => e?.name === 'MissingHandler' || /Missing webkit handler/.test(e?.message ?? ''),
            );
        } finally {
            Object.create = originalCreate;
        }
    });

    it('stores handler and postMessage as a separate pair, not a single bound function', () => {
        // Storing a `{ handler, postMessage }` pair rather than the result of
        // `handler.postMessage.bind(handler)` is what lets wkSend dispatch via
        // captured ReflectApply without going through Function.prototype.bind
        // — which is critical because page JS can replace
        // Function.prototype.bind before lazy transport construction
        // (Messaging is lazy on ContentFeature.messaging). The structural
        // check below proves the cache holds the raw references rather than a
        // bound copy: a bound function would not be reference-equal to the
        // original `postMessage`.
        env = setupWebkit();
        const transport = makeTransport();

        const stored = transport.capturedWebkitHandlers.contentScopeScripts;

        expect(stored.handler).toBe(env.handlers.contentScopeScripts);
        expect(stored.postMessage).toBe(env.handlers.contentScopeScripts.postMessage);
    });

    it('dispatches through the captured handler with the correct `this` even without `.bind`', () => {
        // Replace the host handler's postMessage with one that asserts on its
        // `this`. If wkSend dispatched via a bare call (`postMessage(data)`)
        // rather than ReflectApply against the captured handler, `this` would
        // be wrong (undefined in strict mode) and the call would not preserve
        // host-binding semantics.
        env = setupWebkit();
        const handler = env.handlers.contentScopeScripts;
        const observed = { thisValue: /** @type {any} */ (undefined) };
        handler.postMessage = function postMessage(/** @type {any} */ _data) {
            observed.thisValue = this;
            return Promise.resolve('{}');
        };
        const transport = makeTransport();

        transport.wkSend('contentScopeScripts', { hello: 'world' });

        expect(observed.thisValue).toBe(handler);
    });
});
