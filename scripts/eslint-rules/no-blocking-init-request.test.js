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
    ],
});
