import ContentFeature, { CallFeatureMethodError } from '../src/content-feature.js';

describe('ContentFeature class', () => {
    class BaseTestFeature extends ContentFeature {
        constructor(featureName, importConfig, args) {
            super(featureName, importConfig, {}, args);
        }
    }
    it('Should trigger getFeatureSettingEnabled for the correct domain', () => {
        let didRun = false;
        class MyTestFeature extends BaseTestFeature {
            init() {
                expect(this.getFeatureSetting('test')).toBe('enabled3');
                expect(this.getFeatureSetting('otherTest')).toBe('enabled');
                expect(this.getFeatureSetting('otherOtherTest')).toBe('ding');
                expect(this.getFeatureSetting('arrayTest')).toBe('enabledArray');
                // Following key doesn't exist so it should return false
                expect(this.getFeatureSettingEnabled('someNonExistantKey')).toBe(false);
                expect(this.getFeatureSettingEnabled('someNonExistantKey', 'enabled')).toBe(true);
                expect(this.getFeatureSettingEnabled('someNonExistantKey', 'disabled')).toBe(false);
                expect(this.getFeatureSettingEnabled('disabledStatus')).toBe(false);
                expect(this.getFeatureSettingEnabled('internalStatus')).toBe(false);
                expect(this.getFeatureSettingEnabled('enabledStatus')).toBe(true);
                expect(this.getFeatureSettingEnabled('enabledStatus', 'enabled')).toBe(true);
                expect(this.getFeatureSettingEnabled('enabledStatus', 'disabled')).toBe(true);
                expect(this.getFeatureSettingEnabled('overridenStatus')).toBe(false);
                expect(this.getFeatureSettingEnabled('disabledOverridenStatus')).toBe(true);
                expect(this.getFeatureSettingEnabled('statusObject')).toBe(true);
                expect(this.getFeatureSettingEnabled('statusDisabledObject')).toBe(false);
                didRun = true;
            }
        }

        const args = {
            site: {
                domain: 'beep.example.com',
                url: 'http://beep.example.com',
            },
            featureSettings: {
                test: {
                    test: 'enabled',
                    otherTest: 'disabled',
                    otherOtherTest: 'ding',
                    arrayTest: 'enabled',
                    disabledStatus: 'disabled',
                    internalStatus: 'internal', // not currently supported
                    enabledStatus: 'enabled',
                    overridenStatus: 'enabled',
                    disabledOverridenStatus: 'disabled',
                    statusObject: {
                        state: 'enabled',
                        bloop: true,
                    },
                    statusDisabledObject: {
                        state: 'disabled',
                        bloop2: true,
                    },
                    domains: [
                        {
                            domain: 'example.com',
                            patchSettings: [
                                { op: 'replace', path: '/test', value: 'enabled2' },
                                { op: 'replace', path: '/otherTest', value: 'enabled' },
                                { op: 'replace', path: '/overridenStatus', value: 'disabled' },
                                { op: 'replace', path: '/disabledOverridenStatus', value: 'enabled' },
                            ],
                        },
                        {
                            domain: 'beep.example.com',
                            patchSettings: [{ op: 'replace', path: '/test', value: 'enabled3' }],
                        },
                        {
                            domain: ['meep.com', 'example.com'],
                            patchSettings: [{ op: 'replace', path: '/arrayTest', value: 'enabledArray' }],
                        },
                    ],
                },
            },
        };
        const me = new MyTestFeature('test', {}, args);
        me.callInit(args);
        expect(didRun).withContext('Should run').toBeTrue();
    });

    it('Should trigger getFeatureSettingEnabled for the correct domain', () => {
        let didRun = false;
        class MyTestFeature2 extends BaseTestFeature {
            init() {
                expect(this.getFeatureSetting('test')).toBe('enabled3');
                expect(this.getFeatureSetting('otherTest')).toBe('enabled');
                expect(this.getFeatureSetting('otherOtherTest')).toBe('ding');
                expect(this.getFeatureSetting('arrayTest')).toBe('enabledArray');
                expect(this.getFeatureSetting('pathTest')).toBe('beep');
                expect(this.getFeatureSetting('pathTestNotApply')).toBe('nope');
                expect(this.getFeatureSetting('pathTestShort')).toBe('beep');
                expect(this.getFeatureSetting('pathTestAsterix')).toBe('comic');
                expect(this.getFeatureSetting('pathTestPlaceholder')).toBe('place');
                expect(this.getFeatureSetting('domainWildcard')).toBe('wildwest');
                expect(this.getFeatureSetting('domainWildcardNope')).toBe('nope');
                expect(this.getFeatureSetting('invalidCheck')).toBe('nope');
                didRun = true;
            }
        }

        const args = {
            site: {
                domain: 'beep.example.com',
                url: 'http://beep.example.com/path/path/me',
            },
            featureSettings: {
                test: {
                    test: 'enabled',
                    otherTest: 'disabled',
                    otherOtherTest: 'ding',
                    arrayTest: 'enabled',
                    pathTest: 'nope',
                    pathTestNotApply: 'nope',
                    pathTestShort: 'nope',
                    pathTestAsterix: 'nope',
                    pathTestPlaceholder: 'nope',
                    domainWildcard: 'nope',
                    domainWildcardNope: 'nope',
                    invalidCheck: 'nope',
                    conditionalChanges: [
                        {
                            domain: 'example.com',
                            patchSettings: [
                                { op: 'replace', path: '/test', value: 'enabled2' },
                                { op: 'replace', path: '/otherTest', value: 'enabled' },
                            ],
                        },
                        {
                            domain: 'beep.example.com',
                            patchSettings: [{ op: 'replace', path: '/test', value: 'enabled3' }],
                        },
                        {
                            domain: ['meep.com', 'example.com'],
                            patchSettings: [{ op: 'replace', path: '/arrayTest', value: 'enabledArray' }],
                        },
                        {
                            condition: {
                                urlPattern: {
                                    path: '/path/path/me',
                                },
                            },
                            patchSettings: [{ op: 'replace', path: '/pathTest', value: 'beep' }],
                        },
                        {
                            condition: {
                                urlPattern: {
                                    hostname: 'beep.nope.com',
                                    path: '/path/path/me',
                                },
                            },
                            patchSettings: [{ op: 'replace', path: '/pathTestNotApply', value: 'yep' }],
                        },
                        {
                            condition: {
                                urlPattern: 'http://beep.example.com/path/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/pathTestShort', value: 'beep' }],
                        },
                        {
                            condition: {
                                urlPattern: 'http://beep.example.com/*/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/pathTestAsterix', value: 'comic' }],
                        },
                        {
                            condition: {
                                urlPattern: 'http://beep.example.com/:something/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/pathTestPlaceholder', value: 'place' }],
                        },
                        {
                            condition: {
                                urlPattern: 'http://beep.*.com/*/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/domainWildcard', value: 'wildwest' }],
                        },
                        {
                            condition: {
                                urlPattern: 'http://nope.*.com/*/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/domainWildcardNope', value: 'wildwest' }],
                        },
                        {
                            condition: {
                                somethingInvalid: true,
                                urlPattern: 'http://beep.example.com/*/path/me',
                            },
                            patchSettings: [{ op: 'replace', path: '/invalidCheck', value: 'neverhappened' }],
                        },
                    ],
                },
            },
        };
        const me = new MyTestFeature2('test', {}, args);
        me.callInit(args);
        expect(didRun).withContext('Should run').toBeTrue();
    });

    it('Should trigger getFeatureSetting for the correct conditions', () => {
        let didRun = false;
        class MyTestFeature3 extends BaseTestFeature {
            init() {
                expect(this.getFeatureSetting('test')).toBe('enabled');
                expect(this.getFeatureSetting('otherTest')).toBe('disabled');
                expect(this.getFeatureSetting('test2')).toBe('noop');
                expect(this.getFeatureSetting('otherTest2')).toBe('me');
                expect(this.getFeatureSetting('test3')).toBe('yep');
                expect(this.getFeatureSetting('otherTest3')).toBe('expected');
                expect(this.getFeatureSetting('test4')).toBe('yep');
                expect(this.getFeatureSetting('otherTest4')).toBe('expected');
                expect(this.getFeatureSetting('test5')).toBe('yep');
                expect(this.getFeatureSetting('otherTest5')).toBe('expected');
                expect(this.getFeatureSetting('notPresent')).toBeUndefined();
                didRun = true;
            }
        }

        const args = {
            site: {
                domain: 'beep.example.com',
                url: 'http://beep.example.com/path/path/me',
            },
            featureSettings: {
                test: {
                    test: 'enabled',
                    otherTest: 'disabled',
                    test4: 'yep',
                    otherTest4: 'expected',
                    conditionalChanges: [
                        {
                            condition: {
                                // This array case is unsupported currently.
                                domain: ['example.com'],
                            },
                            patchSettings: [
                                { op: 'add', path: '/test', value: 'enabled2' },
                                { op: 'add', path: '/otherTest', value: 'bloop' },
                            ],
                        },
                        {
                            condition: [
                                {
                                    domain: 'example.com',
                                },
                                {
                                    domain: 'other.com',
                                },
                            ],
                            patchSettings: [
                                { op: 'add', path: '/test2', value: 'noop' },
                                { op: 'add', path: '/otherTest2', value: 'me' },
                            ],
                        },
                        {
                            condition: [
                                {
                                    urlPattern: '*://*.example.com',
                                },
                                {
                                    urlPattern: '*://other.com',
                                },
                            ],
                            patchSettings: [
                                { op: 'add', path: '/test3', value: 'yep' },
                                { op: 'add', path: '/otherTest3', value: 'expected' },
                            ],
                        },
                        {
                            condition: [
                                {
                                    // This is at the apex so should not match
                                    urlPattern: '*://example.com',
                                },
                                {
                                    urlPattern: '*://other.com',
                                },
                            ],
                            patchSettings: [
                                { op: 'add', path: '/test4', value: 'nope' },
                                { op: 'add', path: '/otherTest4', value: 'notexpected' },
                            ],
                        },
                        {
                            condition: [
                                {
                                    urlPattern: {
                                        hostname: '*.example.com',
                                    },
                                },
                            ],
                            patchSettings: [
                                { op: 'add', path: '/test5', value: 'yep' },
                                { op: 'add', path: '/otherTest5', value: 'expected' },
                                // This should not be added as replace state
                                { op: 'replace', path: '/notPresent', value: 'notpresent' },
                            ],
                        },
                    ],
                },
            },
        };
        const me = new MyTestFeature3('test', {}, args);
        me.callInit(args);
        expect(didRun).withContext('Should run').toBeTrue();
    });
    it('Should respect minSupportedVersion as a condition', () => {
        let didRun = false;
        class MyTestFeature3 extends BaseTestFeature {
            init() {
                expect(this.getFeatureSetting('aiChat')).toBe('enabled');
                expect(this.getFeatureSetting('subscriptions')).toBe('disabled');
                didRun = true;
            }
        }

        const args = {
            site: {
                domain: 'example.com',
                url: 'http://example.com',
            },
            platform: {
                version: '1.1.0',
            },
            bundledConfig: {
                features: {
                    test: {
                        state: 'enabled',
                        exceptions: [],
                        settings: {
                            aiChat: 'disabled',
                            subscriptions: 'disabled',
                            conditionalChanges: [
                                {
                                    condition: {
                                        domain: 'example.com',
                                        minSupportedVersion: '1.1.0',
                                    },
                                    patchSettings: [
                                        {
                                            op: 'replace',
                                            path: '/aiChat',
                                            value: 'enabled',
                                        },
                                    ],
                                },
                                {
                                    condition: {
                                        domain: 'example.com',
                                        minSupportedVersion: '1.2.0',
                                    },
                                    patchSettings: [
                                        {
                                            op: 'replace',
                                            path: '/subscriptions',
                                            value: 'enabled',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                unprotectedTemporary: [],
            },
        };
        const me = new MyTestFeature3('test', {}, args);
        me.callInit(args);
        expect(didRun).withContext('Should run').toBeTrue();
    });

    it('Should respect maxSupportedVersion as a condition', () => {
        let didRun = false;
        class MyTestFeature4 extends BaseTestFeature {
            init() {
                expect(this.getFeatureSetting('aiChat')).toBe('enabled');
                expect(this.getFeatureSetting('subscriptions')).toBe('disabled');
                didRun = true;
            }
        }

        const args = {
            site: {
                domain: 'example.com',
                url: 'http://example.com',
            },
            platform: {
                version: '1.1.0',
            },
            bundledConfig: {
                features: {
                    test: {
                        state: 'enabled',
                        exceptions: [],
                        settings: {
                            aiChat: 'disabled',
                            subscriptions: 'disabled',
                            conditionalChanges: [
                                {
                                    condition: {
                                        domain: 'example.com',
                                        maxSupportedVersion: '1.1.0',
                                    },
                                    patchSettings: [
                                        {
                                            op: 'replace',
                                            path: '/aiChat',
                                            value: 'enabled',
                                        },
                                    ],
                                },
                                {
                                    condition: {
                                        domain: 'example.com',
                                        maxSupportedVersion: '1.0.0',
                                    },
                                    patchSettings: [
                                        {
                                            op: 'replace',
                                            path: '/subscriptions',
                                            value: 'enabled',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        };

        const me = new MyTestFeature4('test', {}, args);
        me.callInit(args);
        expect(didRun).withContext('Should run').toBeTrue();
    });

    describe('addDebugFlag', () => {
        class MyTestFeature extends BaseTestFeature {
            // eslint-disable-next-line
            // @ts-ignore partial mock
            messaging = {
                notify(_name, _data) {},
            };
        }
        let feature;
        beforeEach(() => {
            feature = new MyTestFeature('someFeatureName', {}, {});
        });

        it('should not send duplicate flags', () => {
            // send some flag
            feature.addDebugFlag('someflag');
            // send it again
            const spyNotify = spyOn(feature.messaging, 'notify');
            feature.addDebugFlag('someflag');
            expect(spyNotify).not.toHaveBeenCalled();
        });

        it('should send an empty suffix by default', () => {
            const spyNotify = spyOn(feature.messaging, 'notify');
            feature.addDebugFlag();
            expect(spyNotify).toHaveBeenCalledWith('addDebugFlag', {
                flag: 'someFeatureName',
            });
        });
    });

    describe('defineProperty', () => {
        class MyTestFeature extends BaseTestFeature {
            addDebugFlag() {
                this.debugFlagAdded = true;
            }
        }
        let feature;
        beforeEach(() => {
            feature = new MyTestFeature('someFeatureName', {}, {});
        });

        it('should add debug flag to value descriptors', () => {
            const object = {};
            feature.defineProperty(object, 'someProp', {
                value: () => 'someValue',
                writable: true,
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeUndefined();
            expect(object.someProp()).toBe('someValue');
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp');
            expect(newDesc).toBeDefined();
            // @ts-expect-error - this must be defined
            newDesc.value = null;
            expect(newDesc).toEqual({
                value: null,
                writable: true,
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeTrue();
        });

        it('should add debug flag to get descriptors', () => {
            const object = {};
            feature.defineProperty(object, 'someProp', {
                get: () => 'someValue',
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeUndefined();
            expect(object.someProp).toBe('someValue');
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp');
            expect(newDesc).toBeDefined();
            // @ts-expect-error - this must be defined, and setting to null for test
            newDesc.get = null;
            // @ts-expect-error testing edge case with null value
            expect(newDesc).toEqual({
                get: null,
                set: undefined,
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeTrue();
        });

        it('should add debug flag to set descriptors', () => {
            const object = {};
            feature.defineProperty(object, 'someProp', {
                set: () => {},
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeUndefined();
            expect((object.someProp = 'someValue')).toBe('someValue');
            const newDesc = Object.getOwnPropertyDescriptor(object, 'someProp');
            expect(newDesc).toBeDefined();
            // @ts-expect-error - this must be defined, and setting to null for test
            newDesc.set = null;
            // @ts-expect-error testing edge case with null value
            expect(newDesc).toEqual({
                get: undefined,
                set: null,
                enumerable: true,
                configurable: true,
            });
            expect(feature.debugFlagAdded).toBeTrue();
        });

        it('should not change toString()', () => {
            const object = {};
            const fn = () => 'someValue';
            feature.defineProperty(object, 'someProp', {
                value: fn,
                writable: true,
                enumerable: true,
                configurable: true,
            });
            expect(object.someProp()).toBe('someValue');
            expect(object.someProp.toString()).toBe(fn.toString());
            expect(Object.prototype.toString.apply(object.someProp)).toBe(Object.prototype.toString.apply(fn));
            expect(`${object.someProp}`).toBe(`${fn}`);
            expect(object.someProp.toString.toString()).toBe(fn.toString.toString());
            // we don't expect it to wrap toString() more than 2 levels deep
            expect(object.someProp.toString.toString.toString()).not.toBe(fn.toString.toString.toString());
        });
    });

    describe('injectName condition', () => {
        it('should match when injectName condition is met', () => {
            class MyTestFeature extends BaseTestFeature {
                /** @returns {'apple-isolated'} */
                get injectName() {
                    return 'apple-isolated';
                }

                testMatchInjectNameConditional(conditionBlock) {
                    return this._matchInjectNameConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInjectNameConditional({
                injectName: 'apple-isolated',
            });
            expect(result).toBe(true);
        });

        it('should not match when injectName condition is not met', () => {
            class MyTestFeature extends BaseTestFeature {
                /** @returns {'apple-isolated'} */
                get injectName() {
                    return 'apple-isolated';
                }

                testMatchInjectNameConditional(conditionBlock) {
                    return this._matchInjectNameConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInjectNameConditional({
                injectName: 'firefox',
            });
            expect(result).toBe(false);
        });

        it('should handle undefined injectName gracefully', () => {
            class MyTestFeature extends BaseTestFeature {
                /** @returns {undefined} */
                get injectName() {
                    return undefined;
                }

                testMatchInjectNameConditional(conditionBlock) {
                    return this._matchInjectNameConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInjectNameConditional({
                injectName: 'apple-isolated',
            });
            expect(result).toBe(false);
        });

        it('should handle missing injectName condition', () => {
            class MyTestFeature extends BaseTestFeature {
                /** @returns {'apple-isolated'} */
                get injectName() {
                    return 'apple-isolated';
                }

                testMatchInjectNameConditional(conditionBlock) {
                    return this._matchInjectNameConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInjectNameConditional({});
            expect(result).toBe(false);
        });
    });

    describe('maxSupportedVersion condition', () => {
        it('should match when current version is less than max', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchMaxSupportedVersion(conditionBlock) {
                    return this._matchMaxSupportedVersion(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    version: '1.5.0',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchMaxSupportedVersion({
                maxSupportedVersion: '2.0.0',
            });
            expect(result).toBe(true);
        });

        it('should match when current version equals max', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchMaxSupportedVersion(conditionBlock) {
                    return this._matchMaxSupportedVersion(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    version: '1.5.0',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchMaxSupportedVersion({
                maxSupportedVersion: '1.5.0',
            });
            expect(result).toBe(true);
        });

        it('should not match when current version is greater than max', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchMaxSupportedVersion(conditionBlock) {
                    return this._matchMaxSupportedVersion(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    version: '1.5.0',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchMaxSupportedVersion({
                maxSupportedVersion: '1.0.0',
            });
            expect(result).toBe(false);
        });

        it('should handle integer versions', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchMaxSupportedVersion(conditionBlock) {
                    return this._matchMaxSupportedVersion(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    version: 99,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchMaxSupportedVersion({
                maxSupportedVersion: 100,
            });
            expect(result).toBe(true);
        });

        it('should handle missing maxSupportedVersion condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchMaxSupportedVersion(conditionBlock) {
                    return this._matchMaxSupportedVersion(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    version: '1.5.0',
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchMaxSupportedVersion({});
            expect(result).toBe(false);
        });
    });

    describe('internal condition', () => {
        it('should match when internal is true and condition is true', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: true,
            });
            expect(result).toBe(true);
        });

        it('should match when internal is false and condition is false', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: false,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: false,
            });
            expect(result).toBe(true);
        });

        it('should not match when internal is true but condition is false', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: false,
            });
            expect(result).toBe(false);
        });

        it('should not match when internal is false but condition is true', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: false,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: true,
            });
            expect(result).toBe(false);
        });

        it('should handle undefined internal state gracefully', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    // internal not set
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: true,
            });
            expect(result).toBe(false);
        });

        it('should handle missing internal condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({});
            expect(result).toBe(false);
        });

        it('should handle truthy values for internal condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: 1, // truthy value
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: true,
            });
            expect(result).toBe(true);
        });

        it('should handle falsy values for internal condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchInternalConditional(conditionBlock) {
                    return this._matchInternalConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    internal: 0, // falsy value
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchInternalConditional({
                internal: false,
            });
            expect(result).toBe(true);
        });
    });

    describe('preview condition', () => {
        it('should match when preview is true and condition is true', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: true,
            });
            expect(result).toBe(true);
        });

        it('should match when preview is false and condition is false', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: false,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: false,
            });
            expect(result).toBe(true);
        });

        it('should not match when preview is true but condition is false', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: false,
            });
            expect(result).toBe(false);
        });

        it('should not match when preview is false but condition is true', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: false,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: true,
            });
            expect(result).toBe(false);
        });

        it('should handle undefined preview state gracefully', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    // preview not set
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: true,
            });
            expect(result).toBe(false);
        });

        it('should handle missing preview condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: true,
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({});
            expect(result).toBe(false);
        });

        it('should handle truthy values for preview condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: 1, // truthy value
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: true,
            });
            expect(result).toBe(true);
        });

        it('should handle falsy values for preview condition', () => {
            class MyTestFeature extends BaseTestFeature {
                testMatchPreviewConditional(conditionBlock) {
                    return this._matchPreviewConditional(conditionBlock);
                }
            }

            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: {
                    name: 'test',
                    preview: 0, // falsy value
                },
            };

            const feature = new MyTestFeature('test', {}, args);
            const result = feature.testMatchPreviewConditional({
                preview: false,
            });
            expect(result).toBe(true);
        });
    });

    describe('inter-feature communication', () => {
        /**
         * Creates a feature class with specified exposed methods
         * @param {string} name
         * @param {Record<string, Function>} methods
         * @param {string[]} exposedMethodNames
         */
        function createFeatureClass(name, methods, exposedMethodNames) {
            return class extends ContentFeature {
                /**
                 *
                 * @param {Record<string, any>} [features={}]
                 */
                constructor(features = {}) {
                    super(name, {}, features, {});
                    // Add methods to instance
                    for (const [methodName, fn] of Object.entries(methods)) {
                        this[methodName] = fn.bind(this);
                    }
                    this._exposedMethods = this._declareExposedMethods(exposedMethodNames);
                }

                /**
                 * Redefining to avoid TypeScript errors in the tests.
                 *
                 * Because we're adding methods to the instance dynamically in
                 * the test, the available methods aren't known when
                 * type-checking.
                 *
                 * @param {string[]} methodNames
                 */
                // @ts-expect-error - ignore for tests
                _declareExposedMethods(methodNames) {
                    // @ts-expect-error - ignore for tests
                    return super._declareExposedMethods(methodNames);
                }

                /**
                 * Redefining to avoid TypeScript errors in the tests.
                 *
                 * The FeatureMap (which dictates the allowed `featureName`
                 * values) is defined to reflect real features defined in
                 * `injected/src/features`, so our fake test features aren't
                 * known to the typechecker.
                 *
                 * @param {string} featureName
                 * @param {string} methodName
                 * @param  {...any} args
                 * @returns {any}
                 */
                callFeatureMethod(featureName, methodName, ...args) {
                    // @ts-expect-error - ignore for tests
                    return super.callFeatureMethod(featureName, methodName, ...args);
                }

                prop1 = 'test';
            };
        }

        describe('_declareExposedMethods', () => {
            it('should throw an error if method does not exist on the class', () => {
                const FeatureA = createFeatureClass('featureA', {}, []);
                const feature = new FeatureA();
                expect(() => {
                    feature._declareExposedMethods(['unknownMethod']);
                }).toThrowError("'unknownMethod' is not a method of feature 'featureA'");
            });

            it('should throw an error if name is a property on the class', () => {
                const FeatureA = createFeatureClass('featureA', {}, []);
                const feature = new FeatureA();
                expect(() => {
                    feature._declareExposedMethods(['prop1']);
                }).toThrowError("'prop1' is not a method of feature 'featureA'");
            });

            it('should succeed if name is a method on the class', () => {
                const FeatureA = createFeatureClass('featureA', { method1: () => {} }, []);
                const feature = new FeatureA();
                expect(() => {
                    feature._declareExposedMethods(['method1']);
                }).not.toThrow();
            });
        });

        describe('callFeatureMethod', () => {
            /**
             * @param {Record<string, Function>} methods
             * @param {string[]} exposedMethods
             * @param {{ initFeature?: boolean }} [options]
             */
            const buildCallerFeature = async (methods, exposedMethods, options = {}) => {
                const { initFeature = true } = options;
                const TargetFeature = createFeatureClass('targetFeature', methods, exposedMethods);
                const CallerFeature = createFeatureClass('callerFeature', {}, []);

                const targetFeature = new TargetFeature();
                if (initFeature) {
                    await targetFeature.callInit({});
                }
                const features = { targetFeature };

                return { callerFeature: new CallerFeature(features), targetFeature };
            };

            it('should return an error when the target feature does not exist', async () => {
                const CallerFeature = createFeatureClass('callerFeature', {}, []);
                const callerFeature = new CallerFeature();

                const result = await callerFeature.callFeatureMethod('nonExistentFeature', 'someMethod');
                expect(result).toBeInstanceOf(CallFeatureMethodError);
                expect(result.message).toBe("Feature not found: 'nonExistentFeature'");
            });

            it('should return an error when the method is not in the exposed methods list', async () => {
                const { callerFeature } = await buildCallerFeature(
                    {
                        exposedMethod: () => {},
                        privateMethod: () => {},
                    },
                    ['exposedMethod'],
                );

                const result = await callerFeature.callFeatureMethod('targetFeature', 'privateMethod');
                expect(result).toBeInstanceOf(CallFeatureMethodError);
                expect(result.message).toBe("'privateMethod' is not exposed by feature 'targetFeature'");
            });

            it('should successfully call an exposed method on another feature', async () => {
                const targetMethod = jasmine.createSpy('targetMethod').and.returnValue('success');
                const { callerFeature } = await buildCallerFeature({ exposedMethod: targetMethod }, ['exposedMethod']);

                const result = await callerFeature.callFeatureMethod('targetFeature', 'exposedMethod');

                expect(targetMethod).toHaveBeenCalled();
                expect(result).toBe('success');
            });

            it('should handle async methods correctly', async () => {
                const asyncMethod = jasmine.createSpy('asyncMethod').and.returnValue(Promise.resolve('async result'));
                const { callerFeature } = await buildCallerFeature({ asyncMethod }, ['asyncMethod']);

                const result = await callerFeature.callFeatureMethod('targetFeature', 'asyncMethod');

                expect(result).toBe('async result');
            });

            it('should pass arguments to the target method', async () => {
                const targetMethod = jasmine.createSpy('targetMethod').and.callFake((a, b, c) => a + b + c);
                const { callerFeature } = await buildCallerFeature({ sum: targetMethod }, ['sum']);

                const result = await callerFeature.callFeatureMethod('targetFeature', 'sum', 1, 2, 3);

                expect(targetMethod).toHaveBeenCalledWith(1, 2, 3);
                expect(result).toBe(6);
            });

            it('should return the value from the target method', async () => {
                const { callerFeature } = await buildCallerFeature({ getValue: () => ({ data: 'test' }) }, ['getValue']);

                const result = await callerFeature.callFeatureMethod('targetFeature', 'getValue');

                expect(result).toEqual({ data: 'test' });
            });

            it('should allow multiple features to communicate', async () => {
                const FeatureA = createFeatureClass('featureA', { getData: () => 'data from A' }, ['getData']);
                const FeatureB = createFeatureClass('featureB', { process: (input) => `processed: ${input}` }, ['process']);
                const CallerFeature = createFeatureClass('callerFeature', {}, []);

                const featureA = new FeatureA();
                featureA.callInit({});
                const featureB = new FeatureB();
                featureB.callInit({});
                const features = { featureA, featureB };
                const callerFeature = new CallerFeature(features);

                const dataFromA = await callerFeature.callFeatureMethod('featureA', 'getData');
                const processedByB = await callerFeature.callFeatureMethod('featureB', 'process', dataFromA);

                expect(processedByB).toBe('processed: data from A');
            });

            it('should maintain correct this context when calling target method', async () => {
                class TargetFeature extends ContentFeature {
                    constructor() {
                        super('targetFeature', {}, {}, {});
                        this._exposedMethods = this._declareExposedMethods(['getFeatureName']);
                        this.customProperty = 'custom value';
                    }
                    getFeatureName() {
                        return this.name;
                    }
                }
                const CallerFeature = createFeatureClass('callerFeature', {}, []);

                const targetFeature = new TargetFeature();
                targetFeature.callInit({});
                const features = { targetFeature };
                const callerFeature = new CallerFeature(features);

                const result = await callerFeature.callFeatureMethod('targetFeature', 'getFeatureName');

                expect(result).toBe('targetFeature');
            });

            describe('waiting for feature ready', () => {
                it('should wait for target feature to be initialized before calling method', async () => {
                    const targetMethod = jasmine.createSpy('targetMethod').and.returnValue('success');
                    const { callerFeature, targetFeature } = await buildCallerFeature({ exposedMethod: targetMethod }, ['exposedMethod'], {
                        initFeature: false,
                    });

                    // Start the call before the feature is initialized
                    const resultPromise = callerFeature.callFeatureMethod('targetFeature', 'exposedMethod');

                    // Method should not be called yet
                    expect(targetMethod).not.toHaveBeenCalled();

                    // Initialize the feature
                    targetFeature.callInit({});

                    // Now await the result
                    const result = await resultPromise;

                    expect(targetMethod).toHaveBeenCalled();
                    expect(result).toBe('success');
                });

                it('should resolve immediately if target feature is already initialized', async () => {
                    const targetMethod = jasmine.createSpy('targetMethod').and.returnValue('success');
                    const { callerFeature } = await buildCallerFeature({ exposedMethod: targetMethod }, ['exposedMethod'], {
                        initFeature: true,
                    });

                    const result = await callerFeature.callFeatureMethod('targetFeature', 'exposedMethod');

                    expect(targetMethod).toHaveBeenCalled();
                    expect(result).toBe('success');
                });

                it('should return error if target feature init throws an error', async () => {
                    class FailingFeature extends ContentFeature {
                        constructor() {
                            super('failingFeature', {}, {}, {});
                            this._exposedMethods = this._declareExposedMethods(['someMethod']);
                        }
                        init() {
                            throw new Error('init failed');
                        }
                        someMethod() {
                            return 'should not reach';
                        }
                    }
                    const CallerFeature = createFeatureClass('callerFeature', {}, []);

                    const failingFeature = new FailingFeature();
                    const features = { failingFeature };
                    const callerFeature = new CallerFeature(features);

                    // Start the call before init
                    const resultPromise = callerFeature.callFeatureMethod('failingFeature', 'someMethod');

                    // Try to initialize (this will throw)
                    await expectAsync(failingFeature.callInit({})).toBeRejectedWithError('init failed');

                    // The callFeatureMethod should return an error (not reject)
                    const result = await resultPromise;
                    expect(result).toBeInstanceOf(CallFeatureMethodError);
                    expect(result.message).toContain("Initialisation of feature 'failingFeature' failed");
                    expect(result.message).toContain('init failed');
                });

                it('should handle multiple callers waiting for the same feature', async () => {
                    const targetMethod = jasmine.createSpy('targetMethod').and.returnValue('shared result');
                    const TargetFeature = createFeatureClass('targetFeature', { getData: targetMethod }, ['getData']);
                    const CallerFeature = createFeatureClass('callerFeature', {}, []);

                    const targetFeature = new TargetFeature();
                    const features = { targetFeature };
                    const caller1 = new CallerFeature(features);
                    const caller2 = new CallerFeature(features);

                    // Both callers start waiting
                    const promise1 = caller1.callFeatureMethod('targetFeature', 'getData');
                    const promise2 = caller2.callFeatureMethod('targetFeature', 'getData');

                    // Method shouldn't be called yet
                    expect(targetMethod).not.toHaveBeenCalled();

                    // Initialize the feature
                    targetFeature.callInit({});

                    // Both should resolve
                    const [result1, result2] = await Promise.all([promise1, promise2]);

                    expect(result1).toBe('shared result');
                    expect(result2).toBe('shared result');
                    expect(targetMethod).toHaveBeenCalledTimes(2);
                });

                it('should return error when target feature was skipped', async () => {
                    const targetMethod = jasmine.createSpy('targetMethod').and.returnValue('success');
                    const TargetFeature = createFeatureClass('targetFeature', { exposedMethod: targetMethod }, ['exposedMethod']);
                    const CallerFeature = createFeatureClass('callerFeature', {}, []);

                    const targetFeature = new TargetFeature();
                    const features = { targetFeature };
                    const callerFeature = new CallerFeature(features);

                    // Mark the feature as skipped (simulating isFeatureBroken returning true)
                    targetFeature.markFeatureAsSkipped('feature is broken on this site');

                    // callFeatureMethod should return an error, not hang
                    const result = await callerFeature.callFeatureMethod('targetFeature', 'exposedMethod');

                    expect(result).toBeInstanceOf(CallFeatureMethodError);
                    expect(result.message).toContain("Initialisation of feature 'targetFeature' was skipped");
                    expect(result.message).toContain('feature is broken on this site');
                    expect(targetMethod).not.toHaveBeenCalled();
                });
            });
        });
    });
});
