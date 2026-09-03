import { RuleTester } from 'eslint';
import { describe, it } from 'node:test';
import { noBlockingInitRequest } from './no-blocking-init-request.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

ruleTester.run('no-blocking-init-request', noBlockingInitRequest, {
    valid: [
        // Gating on config instead of a round trip
        `class F extends ContentFeature {
            init() {
                if (!this.getFeatureSettingEnabled('someToggle')) return;
                this.listen();
            }
        }`,
        // Fire-and-forget notify
        `class F extends ContentFeature {
            init() {
                this.notify('somethingHappened', {});
            }
        }`,
        // The repo-idiomatic escape hatch: init returns, a separate method waits
        `class F extends ContentFeature {
            init() {
                void this.setupFromClient();
            }
            async setupFromClient() {
                try {
                    this.applyState(await this.request('getState', {}));
                } catch (e) {}
            }
        }`,
        // Request sent from init but not awaited - init does not wait for the reply
        `class F extends ContentFeature {
            init() {
                this.request('getState', {}).then((state) => this.apply(state)).catch(() => {});
            }
        }`,
        // Request inside a listener registered by init
        `class F extends ContentFeature {
            init() {
                document.addEventListener('click', async () => {
                    const result = await this.request('clicked', {});
                    this.apply(result);
                });
            }
        }`,
        // Awaiting something that isn't a client round trip
        `class F extends ContentFeature {
            async init() {
                await this.whenReady();
            }
        }`,
        // A request awaited in another method is fine
        `class F extends ContentFeature {
            init() {
                this.setup();
            }
            async setup() {
                await this.request('getState', {});
            }
        }`,
        // A `request` method on an unrelated local object
        `class F extends ContentFeature {
            async init() {
                await someClient.request('getState', {});
            }
        }`,
        // An object built from something that isn't this.messaging
        `class F extends ContentFeature {
            async init() {
                const helper = new Helper(this.platform);
                await helper.initialSetup();
            }
        }`,
        // A class member that has nothing to do with messaging
        `class F extends ContentFeature {
            helper = new Helper(this.platform);
            async init() {
                await this.helper.load();
            }
        }`,
        // A messaging wrapper is fine as long as init doesn't wait on it
        `class F extends ContentFeature {
            init() {
                const messages = new FeatureMessages(this.messaging);
                messages.subscribeToChanges(() => this.recompute());
                void initOverlays(messages);
            }
        }`,
        // load() installing its wrappers synchronously, which is the point of load()
        `class F extends ContentFeature {
            load() {
                this.wrapProperty('Navigator.prototype.someApi', {});
            }
        }`,
        // A request sent from load() but not waited on
        `class F extends ContentFeature {
            load() {
                this.request('getState', {}).then((state) => this.applyState(state)).catch(() => {});
            }
        }`,
    ],
    invalid: [
        {
            // The pattern this rule exists to stop: gating init on a native reply
            code: `class F extends ContentFeature {
                async init() {
                    const { enabled } = await this.request('isEnabled', {});
                    if (!enabled) return;
                    this.listen();
                }
            }`,
            errors: [{ messageId: 'blockingInit', data: { name: 'this.request' } }],
        },
        {
            code: `class F extends ContentFeature {
                async init() {
                    const state = await this.messaging.request('getState');
                    this.apply(state);
                }
            }`,
            errors: [{ messageId: 'blockingInit', data: { name: 'this.messaging.request' } }],
        },
        {
            // Returning the promise blocks callInit() just the same
            code: `class F extends ContentFeature {
                init() {
                    return this.request('getState', {});
                }
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            code: `class F extends ContentFeature {
                init = async () => {
                    await this.request('getState', {});
                };
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            code: `class F extends ContentFeature {
                init = async () => this.request('getState', {});
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            // Wrapped in try/catch, still blocking
            code: `class F extends ContentFeature {
                async init() {
                    try {
                        await this.request('isEnabled', {});
                    } catch (e) {
                        return;
                    }
                }
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            // Hidden behind Promise.all
            code: `class F extends ContentFeature {
                async init() {
                    const [a, b] = await Promise.all([this.request('one', {}), this.request('two', {})]);
                }
            }`,
            errors: [{ messageId: 'blockingInit' }, { messageId: 'blockingInit' }],
        },
        {
            // Awaiting the tail of a promise chain
            code: `class F extends ContentFeature {
                async init() {
                    await this.request('getState', {}).catch(() => null);
                }
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            // Extra method names can be configured per project area
            code: `class F extends ContentFeature {
                async init() {
                    await this.messages.initialSetup();
                }
            }`,
            options: [{ methodNames: ['request', 'initialSetup'] }],
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            // load() splits in half around the await: the wrapper lands too late
            code: `class F extends ContentFeature {
                async load() {
                    const { enabled } = await this.request('isEnabled', {});
                    if (enabled) this.wrapProperty('Navigator.prototype.someApi', {});
                }
            }`,
            errors: [{ messageId: 'blockingLoad', data: { name: 'this.request' } }],
        },
        {
            code: `class F extends ContentFeature {
                async load() {
                    const state = await this.messaging.request('getState');
                    this.applyState(state);
                }
            }`,
            errors: [{ messageId: 'blockingLoad', data: { name: 'this.messaging.request' } }],
        },
        {
            code: `class F extends ContentFeature {
                load() {
                    return this.request('getState', {});
                }
            }`,
            errors: [{ messageId: 'blockingLoad' }],
        },
        {
            // Each phase reports against its own message
            code: `class F extends ContentFeature {
                async load() {
                    await this.request('getState', {});
                }
                async init() {
                    await this.request('isEnabled', {});
                }
            }`,
            errors: [{ messageId: 'blockingLoad' }, { messageId: 'blockingInit' }],
        },
        {
            // A round trip one layer down, through a messages class built from this.messaging
            code: `class F extends ContentFeature {
                async init() {
                    const messages = new FeatureMessages(this.messaging, env);
                    const settings = await messages.initialSetup();
                    this.applySettings(settings);
                }
            }`,
            errors: [{ messageId: 'blockingInit', data: { name: 'messages.initialSetup' } }],
        },
        {
            // ...and where the wrapper is a getter on the class, under default options
            code: `class F extends ContentFeature {
                async init() {
                    await this.messages.initialSetup();
                }
                get messages() {
                    return new FeatureMessages(this.messaging);
                }
            }`,
            errors: [{ messageId: 'blockingInit', data: { name: 'this.messages.initialSetup' } }],
        },
        {
            // ...or a class field
            code: `class F extends ContentFeature {
                messages = new FeatureMessages(this.messaging);
                async init() {
                    await this.messages.initialSetup();
                }
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
        {
            // `return await` is reached via both the return and the await - report once
            code: `class F extends ContentFeature {
                async init() {
                    return await this.request('getState', {});
                }
            }`,
            errors: [{ messageId: 'blockingInit' }],
        },
    ],
});
