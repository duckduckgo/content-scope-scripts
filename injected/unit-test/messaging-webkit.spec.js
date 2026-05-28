import { MessagingContext, WebkitMessagingConfig, WebkitMessagingTransport } from '@duckduckgo/messaging';

/**
 * Sets up a minimal `window.webkit.messageHandlers` fake and returns
 * helpers for inspecting / mutating it during tests. Cleans up on done().
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
        /** Remove a specific handler (simulates per-handler hiding) */
        removeHandler(name) {
            delete (/** @type {any} */ (globalThis).window.webkit.messageHandlers[name]);
        },
        cleanup() {
            /** @type {any} */ (globalThis).window = originalWindow;
        },
    };
}

function makeContext() {
    return new MessagingContext({
        context: 'contentScopeScripts',
        featureName: 'webkit-transport-spec',
        env: 'development',
    });
}

describe('WebkitMessagingTransport', () => {
    /** @type {ReturnType<typeof setupWebkit>} */
    let env;

    afterEach(() => {
        env?.cleanup();
    });

    describe('modern WebKit (hasModernWebkitAPI: true)', () => {
        it('captures handler references at construction and routes wkSend through them', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: '',
                    hasModernWebkitAPI: true,
                }),
                makeContext(),
            );

            transport.wkSend('contentScopeScripts', { hello: 'world' });

            expect(env.postMessageSpies.contentScopeScripts).toHaveBeenCalledOnceWith({ hello: 'world' });
        });

        it('does NOT delete the original postMessage on the host handler', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: '',
                    hasModernWebkitAPI: true,
                }),
                makeContext(),
            );
            expect(transport).toBeDefined();

            // Modern WebKit must leave the host binding intact for any other code
            // that reads `window.webkit.messageHandlers.X.postMessage` directly.
            expect(typeof env.handlers.contentScopeScripts.postMessage).toBe('function');
        });

        it('continues to work after `window.webkit.messageHandlers` is replaced post-init', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: '',
                    hasModernWebkitAPI: true,
                }),
                makeContext(),
            );

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
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: '',
                    hasModernWebkitAPI: true,
                }),
                makeContext(),
            );

            expect(() => transport.wkSend('nonExistentHandler', {})).toThrowMatching(
                (e) => e?.name === 'MissingHandler' || /Missing webkit handler/.test(e?.message ?? ''),
            );
        });

        it('ignores Object.prototype pollution when an uncaptured handler is looked up', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: '',
                    hasModernWebkitAPI: true,
                }),
                makeContext(),
            );

            // Hostile page-scripted prototype pollution that would, with a
            // plain `{}` cache, resolve via the prototype chain and be invoked
            // as if it were a captured native handler.
            const malicious = jasmine.createSpy('pollutedPostMessage');
            // eslint-disable-next-line no-extend-native -- intentional: simulating page-side prototype pollution
            // @ts-expect-error - intentional ad-hoc property on Object.prototype to simulate page-side pollution
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
    });

    describe('legacy WebKit (hasModernWebkitAPI: false)', () => {
        it('captures handler references and deletes the original postMessage', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: 'shh',
                    hasModernWebkitAPI: false,
                }),
                makeContext(),
            );
            expect(transport).toBeDefined();

            // Legacy macOS behaviour: original postMessage is removed so page JS
            // cannot invoke the handler directly without the secure envelope.
            expect(env.handlers.contentScopeScripts.postMessage).toBeUndefined();
        });

        it('adds the secure messaging envelope (secret) to outgoing payloads', () => {
            env = setupWebkit({ handlerNames: ['contentScopeScripts'] });
            const transport = new WebkitMessagingTransport(
                new WebkitMessagingConfig({
                    webkitMessageHandlerNames: ['contentScopeScripts'],
                    secret: 'shh',
                    hasModernWebkitAPI: false,
                }),
                makeContext(),
            );

            transport.wkSend('contentScopeScripts', { hello: 'world' });

            expect(env.postMessageSpies.contentScopeScripts).toHaveBeenCalledOnceWith({
                hello: 'world',
                messageHandling: { secret: 'shh' },
            });
        });
    });
});
