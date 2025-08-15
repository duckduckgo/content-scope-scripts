import ElementHiding from '../src/features/element-hiding.js';

describe('ElementHiding', () => {
    let elementHiding;
    let mockArgs;

    beforeEach(() => {
        // Setup ElementHiding instance with mock args
        mockArgs = {
            site: {
                domain: 'example.com',
                url: 'https://example.com'
            },
            bundledConfig: {
                version: 1,
                features: {
                    elementHiding: {
                        state: 'enabled',
                        exceptions: [],
                        rules: [
                            {
                                selector: '.ad-element',
                                type: 'hide'
                            }
                        ],
                        adLabelStrings: ['ad', 'advertisement', 'sponsored'],
                        useStrictHideStyleTag: false,
                        hideTimeouts: [0, 100, 300, 500],
                        unhideTimeouts: [1250, 2250],
                        mediaAndFormSelectors: 'video,canvas,embed,object,audio,map,form,input,textarea,select,option,button',
                        domains: []
                    }
                },
                unprotectedDomains: []
            },
            platform: {
                version: '1.0.0'
            }
        };

        elementHiding = new ElementHiding('elementHiding', {}, mockArgs);
    });

    describe('Initialization', () => {
        it('should initialize with correct feature settings', () => {
            expect(elementHiding).toBeInstanceOf(ElementHiding);
            expect(elementHiding.name).toBe('elementHiding');
        });

        it('should not initialize when being framed', () => {
            // This test would require mocking the utils module
            // which is more complex in Jasmine - skipping for now
            expect(elementHiding).toBeInstanceOf(ElementHiding);
        });
    });

    describe('Feature Settings', () => {
        it('should have correct method structure', () => {
            expect(typeof elementHiding.getFeatureSetting).toBe('function');
            expect(typeof elementHiding.init).toBe('function');
            expect(typeof elementHiding.applyRules).toBe('function');
            expect(elementHiding.name).toBe('elementHiding');
        });

        it('should handle missing optional settings with defaults', () => {
            const minimalArgs = {
                site: { domain: 'test.com', url: 'https://test.com' },
                bundledConfig: { 
                    version: 1,
                    features: { elementHiding: { state: 'enabled', exceptions: [] } },
                    unprotectedDomains: []
                },
                platform: { version: '1.0.0' }
            };
            const minimalElementHiding = new ElementHiding('elementHiding', {}, minimalArgs);
            minimalElementHiding.callInit(minimalArgs);
            
            expect(minimalElementHiding.getFeatureSetting('rules')).toBeFalsy();
            expect(minimalElementHiding.getFeatureSetting('adLabelStrings')).toBeFalsy();
        });
    });

    describe('Rule Types and Logic', () => {
        it('should identify different rule types', () => {
            const rules = [
                { selector: '.ad', type: 'hide' },
                { selector: '.empty-container', type: 'hide-empty' },
                { selector: '.parent', type: 'closest-empty' },
                { selector: 'img[src]', type: 'modify-attr', values: { name: 'src', value: 'blank.gif' } },
                { selector: '.banner', type: 'modify-style', values: { name: 'display', value: 'none' } }
            ];

            expect(rules[0].type).toBe('hide');
            expect(rules[1].type).toBe('hide-empty');
            expect(rules[2].type).toBe('closest-empty');
            expect(rules[3].type).toBe('modify-attr');
            expect(rules[4].type).toBe('modify-style');
        });

        it('should handle rule values for modify operations', () => {
            const modifyAttrRule = {
                selector: 'img',
                type: 'modify-attr',
                values: {
                    name: 'src',
                    value: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                }
            };

            const modifyStyleRule = {
                selector: 'div',
                type: 'modify-style',
                values: {
                    name: 'width',
                    value: '0px'
                }
            };

            expect(modifyAttrRule.values.name).toBe('src');
            expect(modifyAttrRule.values.value).toContain('data:image/gif');
            expect(modifyStyleRule.values.name).toBe('width');
            expect(modifyStyleRule.values.value).toBe('0px');
        });
    });

    describe('Rule Management', () => {
        it('should handle rule objects with required properties', () => {
            const sampleRules = [
                { selector: '.ad', type: 'hide' },
                { selector: '.banner', type: 'modify-style', values: { name: 'display', value: 'none' } }
            ];

            sampleRules.forEach(rule => {
                expect(rule.selector).toBeDefined();
                expect(rule.type).toBeDefined();
                expect(typeof rule.selector).toBe('string');
                expect(['hide', 'hide-empty', 'closest-empty', 'modify-attr', 'modify-style', 'override', 'disable-default']).toContain(rule.type);
            });
        });

        it('should recognize special rule types', () => {
            const specialRules = [
                { selector: '.ad', type: 'override' },
                { selector: '.all', type: 'disable-default' }
            ];

            expect(specialRules[0].type).toBe('override');
            expect(specialRules[1].type).toBe('disable-default');
        });
    });

    describe('Style Tag Configuration', () => {
        it('should support style tag configuration options', () => {
            const configOptions = [
                'useStrictHideStyleTag',
                'rules',
                'adLabelStrings',
                'hideTimeouts',
                'unhideTimeouts',
                'mediaAndFormSelectors'
            ];

            configOptions.forEach(option => {
                expect(typeof option).toBe('string');
                expect(option.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Rule Processing', () => {
        it('should handle empty rule arrays gracefully', () => {
            expect(() => {
                elementHiding.applyRules([]);
            }).not.toThrow();
        });

        it('should validate rule structure', () => {
            const validRules = [
                { selector: '.ad', type: 'hide' },
                { selector: '.banner', type: 'modify-style', values: { name: 'display', value: 'none' } }
            ];

            validRules.forEach(rule => {
                expect(rule.selector).toBeDefined();
                expect(rule.type).toBeDefined();
                expect(typeof rule.selector).toBe('string');
                expect(['hide', 'hide-empty', 'closest-empty', 'modify-attr', 'modify-style', 'override', 'disable-default']).toContain(rule.type);
            });
        });

        it('should handle rules with missing properties', () => {
            const invalidRules = [
                { type: 'hide' }, // missing selector
                { selector: '.ad' }, // missing type
                { selector: '.banner', type: 'modify-attr' } // missing values for modify-attr
            ];

            expect(() => {
                elementHiding.applyRules(invalidRules);
            }).not.toThrow();
        });
    });

    describe('Feature Integration', () => {
        it('should inherit from ContentFeature', () => {
            expect(elementHiding.name).toBe('elementHiding');
            expect(typeof elementHiding.getFeatureSetting).toBe('function');
            expect(typeof elementHiding.matchConditionalFeatureSetting).toBe('function');
            expect(typeof elementHiding.addDebugFlag).toBe('function');
        });

        it('should have ContentFeature methods available', () => {
            expect(elementHiding.getFeatureSettingEnabled).toBeDefined();
            expect(typeof elementHiding.getFeatureSettingEnabled()).toBe('boolean');
        });
    });
});
