import ContentFeature from '../src/content-feature.js';

/**
 * Test the additionalCheck conditional logic in content-scope-features.js
 *
 * This tests the logic at lines 60-62 and 82-84:
 * if (!featureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled')) {
 *     return;
 * }
 */
describe('content-scope-features additionalCheck conditional', () => {
    class BaseTestFeature extends ContentFeature {
        constructor(featureName, importConfig, args) {
            super(featureName, importConfig, {}, args);
        }
    }
    describe('additionalCheck feature setting with conditional patching', () => {
        it('should return false when additionalCheck is disabled via conditional patching', () => {
            // Setup: Create new feature instance with conditional patching that disables additionalCheck
            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'enabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            domain: 'example.com',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'disabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance with conditional patching
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting is enabled after conditional patching
            const isEnabled = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');

            // Assert: Should be false due to conditional patching
            expect(isEnabled).toBe(false);
        });

        it('should return true when additionalCheck is enabled via conditional patching', () => {
            // Setup: Create new feature instance with conditional patching that enables additionalCheck
            const args = {
                site: {
                    domain: 'trusted-site.com',
                    url: 'http://trusted-site.com',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'disabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            domain: 'trusted-site.com',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'enabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance with conditional patching
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting is enabled after conditional patching
            const isEnabled = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');

            // Assert: Should be true due to conditional patching
            expect(isEnabled).toBe(true);
        });

        it('should handle URL pattern based conditional patching', () => {
            // Setup: Create new feature instance with URL pattern conditional patching
            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com/sensitive/path',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'enabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            urlPattern: 'http://example.com/sensitive/*',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'disabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance with conditional patching
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting is disabled by URL pattern
            const isEnabled = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');

            // Assert: Should be false due to URL pattern match
            expect(isEnabled).toBe(false);
        });

        it('should not match URL pattern when path does not match', () => {
            // Setup: Create new feature instance with different path that shouldn't match
            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com/public/path',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'enabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            urlPattern: 'http://example.com/sensitive/*',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'disabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance with conditional patching
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting remains enabled
            const isEnabled = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');

            // Assert: Should be true because URL pattern doesn't match
            expect(isEnabled).toBe(true);
        });

        it('should use default value when additionalCheck setting does not exist', () => {
            // Setup: Create new feature instance without additionalCheck setting
            const args = {
                site: {
                    domain: 'example.com',
                    url: 'http://example.com',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                someOtherSetting: 'value',
                                // No additionalCheck setting
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance without additionalCheck
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting uses default value
            const isEnabledWithDefault = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');
            const isDisabledWithDefault = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'disabled');

            // Assert: Should use the default values
            expect(isEnabledWithDefault).toBe(true); // Default 'enabled' -> true
            expect(isDisabledWithDefault).toBe(false); // Default 'disabled' -> false
        });

        it('should handle multiple conditions with domain and URL pattern', () => {
            // Setup: Create new feature instance with complex conditional patching
            const args = {
                site: {
                    domain: 'trusted-site.com',
                    url: 'http://trusted-site.com/app/dashboard',
                },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'disabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: [
                                            {
                                                domain: 'trusted-site.com',
                                            },
                                            {
                                                urlPattern: 'http://trusted-site.com/app/*',
                                            },
                                        ],
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'enabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            // Create feature instance with conditional patching
            const testFeatureInstance = new BaseTestFeature('testFeature', {}, args);

            // Act: Check if the feature setting is enabled
            const isEnabled = testFeatureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled');

            // Assert: Should be true because conditions match
            expect(isEnabled).toBe(true);
        });
    });

    describe('simulated load/init behavior', () => {
        it('should demonstrate how additionalCheck gates feature loading', async () => {
            // This test demonstrates the pattern used in content-scope-features.js
            // Lines 60-62: if (!featureInstance.getFeatureSettingEnabled('additionalCheck', 'enabled')) { return; }

            class MockFeature extends BaseTestFeature {
                constructor(featureName, importConfig, args) {
                    super(featureName, importConfig, args);
                    this.loadCalled = false;
                    this.initCalled = false;
                }

                callLoad() {
                    // Simulate the additionalCheck gate in content-scope-features.js load function
                    if (!this.getFeatureSettingEnabled('additionalCheck', 'enabled')) {
                        return; // Early return when disabled
                    }
                    this.loadCalled = true;
                }

                init() {
                    // Simulate the additionalCheck gate in content-scope-features.js init function
                    if (!this.getFeatureSettingEnabled('additionalCheck', 'enabled')) {
                        return; // Early return when disabled
                    }
                    this.initCalled = true;
                }
            }

            // Test case 1: additionalCheck disabled
            const disabledArgs = {
                site: { domain: 'blocked-site.com', url: 'http://blocked-site.com' },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'enabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            domain: 'blocked-site.com',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'disabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            const disabledFeature = new MockFeature('testFeature', {}, disabledArgs);
            disabledFeature.callLoad();
            await disabledFeature.callInit(disabledArgs);

            expect(disabledFeature.loadCalled).toBe(false); // Should not load
            expect(disabledFeature.initCalled).toBe(false); // Should not init

            // Test case 2: additionalCheck enabled
            const enabledArgs = {
                site: { domain: 'trusted-site.com', url: 'http://trusted-site.com' },
                platform: { name: 'test' },
                bundledConfig: {
                    features: {
                        testFeature: {
                            state: 'enabled',
                            exceptions: [],
                            settings: {
                                additionalCheck: 'disabled', // Base setting
                                conditionalChanges: [
                                    {
                                        condition: {
                                            domain: 'trusted-site.com',
                                        },
                                        patchSettings: [{ op: 'replace', path: '/additionalCheck', value: 'enabled' }],
                                    },
                                ],
                            },
                        },
                    },
                    unprotectedTemporary: [],
                },
            };

            const enabledFeature = new MockFeature('testFeature', {}, enabledArgs);
            enabledFeature.callLoad();
            await enabledFeature.callInit(enabledArgs);

            expect(enabledFeature.loadCalled).toBe(true); // Should load
            expect(enabledFeature.initCalled).toBe(true); // Should init
        });
    });
});
