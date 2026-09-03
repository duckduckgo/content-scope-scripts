import { resetDom } from './helpers/install-dom-globals.js';
import { parseDetectors } from '../src/features/web-detection/parse.js';
import { evaluateMatch } from '../src/features/web-detection/matching.js';
import WebDetection from '../src/features/web-detection.js';
import WebEvents from '../src/features/web-events.js';

/**
 * @typedef {object} TestEnv
 * @property {object} [platform] - Platform config
 * @property {string} [domain] - Current domain
 * @property {boolean} [isTopFrame] - Whether we're in the top frame
 */

/**
 * Test harness for running detectors in controlled environment.
 * Handles setup/teardown of window mocks automatically.
 *
 * @param {object} detectorsConfig - The detectors config (group -> detector -> config)
 * @param {TestEnv} [env] - Environment options
 * @returns {import('../src/features/web-detection.js').DetectorResult[]}
 */
function runDetectorsInEnv(detectorsConfig, env = {}) {
    const { platform = {}, domain = 'example.com', isTopFrame = true } = env;

    // Mock window.self/top for frame detection
    const originalWindow = globalThis.window;
    const mockSelf = {};
    // @ts-expect-error - mocking for test
    globalThis.window = { self: mockSelf, top: isTopFrame ? mockSelf : { different: true } };

    try {
        const args = {
            site: { domain, url: `https://${domain}/page` },
            platform,
            featureSettings: { webDetection: { detectors: detectorsConfig } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };
        const instance = new WebDetection('webDetection', undefined, {}, args);
        instance.init();
        return instance.runDetectors({ trigger: 'breakageReport' });
    } finally {
        globalThis.window = originalWindow;
    }
}

/**
 * Run a single detector and return results.
 * Wraps detector in standard group/detector structure.
 *
 * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').DetectorConfig} detectorConfig
 * @param {TestEnv} [env]
 * @returns {import('../src/features/web-detection.js').DetectorResult[]}
 */
function runDetector(detectorConfig, env = {}) {
    return runDetectorsInEnv({ group: { detector: detectorConfig } }, env);
}

describe('WebDetection', () => {
    describe('parseDetectors', () => {
        it('should return empty object for invalid input', () => {
            // @ts-expect-error - null is not a valid input
            expect(parseDetectors(null)).toEqual({});
            expect(parseDetectors(undefined)).toEqual({});
        });

        it('should skip invalid group names', () => {
            const config = {
                '123invalid': { detector1: { match: { text: { pattern: 'test' } } } },
                'invalid-name': { detector2: { match: { text: { pattern: 'test' } } } },
                '': { detector3: { match: { text: { pattern: 'test' } } } },
            };
            const result = parseDetectors(config);
            expect(Object.keys(result)).toEqual([]);
        });

        it('should accept valid group and detector names', () => {
            const config = {
                ValidGroup: { Detector1: { match: {} } },
                validGroup: { detector1: { match: {} } },
                adwalls: {
                    generic: { match: {} },
                    specific1: { match: {} },
                },
                my_group_01: {
                    my_detector07: { match: {} },
                },
            };
            const result = parseDetectors(config);
            // correct group names
            expect(Object.keys(result).sort()).toEqual(['ValidGroup', 'adwalls', 'my_group_01', 'validGroup']);
            // correct detector names (get flattened list)
            expect(Object.keys(result).flatMap((group) => Object.keys(result[group]))).toEqual([
                'Detector1',
                'detector1',
                'generic',
                'specific1',
                'my_detector07',
            ]);
        });

        it('should apply defaults to detectors', () => {
            const config = {
                adwalls: {
                    generic: { match: { text: { pattern: 'adblocker' } } },
                },
            };
            const result = parseDetectors(config);
            const detector = result.adwalls.generic;

            expect(detector.state).toBe('enabled');
            expect(detector.triggers.breakageReport.state).toBe('enabled');
            expect(detector.triggers.breakageReport.runConditions).toEqual([{ context: { top: true } }]);
            expect(detector.actions.breakageReportData.state).toBe('enabled');
        });

        it('should allow custom runConditions to override defaults', () => {
            const config = {
                adwalls: {
                    iframeDetector: {
                        match: { text: { pattern: 'test' } },
                        triggers: {
                            breakageReport: {
                                runConditions: [],
                            },
                        },
                    },
                },
            };
            const result = parseDetectors(config);
            expect(result.adwalls.iframeDetector.triggers.breakageReport.runConditions).toEqual([]);
        });

        it('should allow domain-specific runConditions', () => {
            const config = {
                adwalls: {
                    domainSpecific: {
                        match: { text: { pattern: 'test' } },
                        triggers: {
                            breakageReport: {
                                runConditions: [{ domain: 'example.com' }],
                            },
                        },
                    },
                },
            };
            const result = parseDetectors(config);
            expect(result.adwalls.domainSpecific.triggers.breakageReport.runConditions).toEqual([{ domain: 'example.com' }]);
        });

        /**
         * @param {import('@duckduckgo/privacy-configuration/schema/features/web-detection').DetectorConfig} detectorConfig
         * @returns {import('../src/features/web-detection/parse.js').DetectorConfig}
         */
        const oneDetectorConfigParsed = (detectorConfig) => {
            const result = parseDetectors({
                group: {
                    detector: detectorConfig,
                },
            });
            return result.group.detector;
        };

        it('should allow disabling detector state', () => {
            const result = oneDetectorConfigParsed({
                state: 'disabled',
                match: { text: { pattern: 'test' } },
            });
            expect(result.state).toBe('disabled');
        });

        it('should allow disabling trigger state', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
                triggers: {
                    breakageReport: { state: 'disabled' },
                },
            });
            expect(result.triggers.breakageReport.state).toBe('disabled');
        });

        it('should allow disabling action state', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
                actions: {
                    breakageReportData: { state: 'disabled' },
                },
            });
            expect(result.actions.breakageReportData.state).toBe('disabled');
        });

        it('should preserve fireEvent action when present and default state to enabled', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
                actions: /** @type {any} - fireEvent not yet in published schema */ ({
                    fireEvent: { type: 'adwall' },
                }),
            });
            expect(result.actions.fireEvent).toEqual({ type: 'adwall', state: 'enabled' });
        });

        it('should preserve fireEvent state when configured', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
                actions: /** @type {any} */ ({
                    fireEvent: { type: 'adwall', state: 'disabled' },
                }),
            });
            expect(result.actions.fireEvent).toEqual({ type: 'adwall', state: 'disabled' });
        });

        it('should not have fireEvent when not configured', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
            });
            expect(result.actions.fireEvent).toBeUndefined();
        });

        it('should preserve both breakageReportData and fireEvent actions', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: 'test' } },
                actions: /** @type {any} - fireEvent not yet in published schema */ ({
                    breakageReportData: { state: 'enabled' },
                    fireEvent: { type: 'adwall' },
                }),
            });
            expect(result.actions.breakageReportData.state).toBe('enabled');
            expect(result.actions.fireEvent).toEqual({ type: 'adwall', state: 'enabled' });
        });

        /**
         *
         * @template T
         * @param {T | T[]} value
         * @returns {T}
         */
        const asSingle = (value) => {
            expect(Array.isArray(value)).toBe(false);
            // @ts-expect-error - we know it's not an array
            return value;
        };

        /**
         *
         * @template T
         * @param {T | T[]} value
         * @returns {T[]}
         */
        const asArray = (value) => {
            expect(Array.isArray(value)).toBe(true);
            // @ts-expect-error - we know it's an array
            return value;
        };

        it('should preserve match conditions from config', () => {
            const result = oneDetectorConfigParsed({
                match: { text: { pattern: ['adblocker', 'disable'] }, element: { selector: '.overlay', visibility: 'visible' } },
            });
            const leaf = /** @type {import('../src/features/web-detection/parse.js').MatchConditionSingle} */ (asSingle(result.match));
            expect(leaf.text).toEqual({ pattern: ['adblocker', 'disable'] });
            expect(leaf.element).toEqual({ selector: '.overlay', visibility: 'visible' });
        });

        it('should handle array of match conditions (OR)', () => {
            const result = oneDetectorConfigParsed({
                match: [{ text: { pattern: 'option1' } }, { element: { selector: '.option2' } }],
            });
            expect(asArray(result.match).length).toBe(2);
        });

        describe('auto trigger defaults', () => {
            it('should apply default state (disabled) to auto trigger', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            when: {
                                intervalMs: [100],
                            },
                        },
                    },
                });
                expect(result.triggers.auto.state).toBe('disabled');
            });

            it('should apply default runConditions to auto trigger', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            when: {
                                intervalMs: [100],
                            },
                        },
                    },
                });
                expect(result.triggers.auto.runConditions).toEqual([{ context: { top: true } }]);
            });

            it('should allow overriding state to enabled', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            state: 'enabled',
                            when: {
                                intervalMs: [100, 500],
                            },
                        },
                    },
                });
                expect(result.triggers.auto.state).toBe('enabled');
                expect(result.triggers.auto.when.intervalMs).toEqual([100, 500]);
            });

            it('should allow overriding runConditions', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            runConditions: [{ domain: 'example.com' }],
                            when: {
                                intervalMs: [100],
                            },
                        },
                    },
                });
                expect(result.triggers.auto.runConditions).toEqual([{ domain: 'example.com' }]);
            });

            it('should handle multiple intervals', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            when: {
                                intervalMs: [100, 500, 1000, 5000],
                            },
                        },
                    },
                });
                expect(result.triggers.auto.when.intervalMs).toEqual([100, 500, 1000, 5000]);
            });

            it('should apply default auto trigger when not specified in config', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                });
                // Defaults should be applied for auto trigger
                expect(result.triggers.auto).toBeDefined();
                expect(result.triggers.auto.state).toBe('disabled');
                expect(result.triggers.auto.runConditions).toEqual([{ context: { top: true } }]);
            });

            it('should not interfere with breakageReport trigger defaults', () => {
                const result = oneDetectorConfigParsed({
                    match: { text: { pattern: 'test' } },
                    triggers: {
                        auto: {
                            when: {
                                intervalMs: [100],
                            },
                        },
                    },
                });
                // breakageReport defaults should still be applied
                expect(result.triggers.breakageReport.state).toBe('enabled');
                expect(result.triggers.breakageReport.runConditions).toEqual([{ context: { top: true } }]);
            });
        });
    });

    describe('runDetectors', () => {
        it('should return empty array when no detectors configured', () => {
            expect(runDetectorsInEnv({})).toEqual([]);
        });

        it('should include matching detector (match: {} always matches)', () => {
            const results = runDetector({ match: {} });
            expect(results.length).toBe(1);
            expect(results[0].detectorId).toBe('group.detector');
            expect(results[0].detected).toBe(true);
        });

        it('should exclude non-matching detector (match: [] never matches)', () => {
            expect(runDetector({ match: [] })).toEqual([]);
        });

        it('should not run when detector state is disabled', () => {
            expect(runDetector({ state: 'disabled', match: {} })).toEqual([]);
        });

        it('should not run when trigger state is disabled', () => {
            expect(
                runDetector({
                    match: {},
                    triggers: { breakageReport: { state: 'disabled' } },
                }),
            ).toEqual([]);
        });

        it('should not run when breakageReportData action is disabled', () => {
            expect(
                runDetector({
                    match: {},
                    actions: { breakageReportData: { state: 'disabled' } },
                }),
            ).toEqual([]);
        });

        it('should not run in iframe when default runConditions require top frame', () => {
            expect(runDetector({ match: {} }, { isTopFrame: false })).toEqual([]);
        });

        it('should run in top frame when runConditions require top frame', () => {
            expect(runDetector({ match: {} }, { isTopFrame: true }).length).toBe(1);
        });

        it('should not run when domain runCondition does not match', () => {
            expect(
                runDetector(
                    {
                        match: {},
                        triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } },
                    },
                    { domain: 'other.com' },
                ),
            ).toEqual([]);
        });

        it('should run when domain runCondition matches', () => {
            expect(
                runDetector(
                    {
                        match: {},
                        triggers: { breakageReport: { runConditions: [{ domain: 'example.com' }] } },
                    },
                    { domain: 'example.com' },
                ).length,
            ).toBe(1);
        });

        it('should run internal detector when platform.internal is true', () => {
            expect(runDetector({ state: 'internal', match: {} }, { platform: { internal: true } }).length).toBe(1);
        });

        it('should not run internal detector when platform.internal is false', () => {
            expect(runDetector({ state: 'internal', match: {} }, { platform: { internal: false } })).toEqual([]);
        });

        it('should return multiple matching detectors from different groups', () => {
            const results = runDetectorsInEnv({
                adwalls: { generic: { match: {} }, specific: { match: {} } },
                paywalls: { detector1: { match: {} } },
            });
            expect(results.length).toBe(3);
            expect(results.map((r) => r.detectorId).sort()).toEqual(['adwalls.generic', 'adwalls.specific', 'paywalls.detector1']);
        });

        it('should only include enabled detectors from mixed set', () => {
            const results = runDetectorsInEnv({
                group: {
                    enabled1: { match: {} },
                    disabled1: { state: 'disabled', match: {} },
                    enabled2: { match: {} },
                    disabledTrigger: { match: {}, triggers: { breakageReport: { state: 'disabled' } } },
                },
            });
            expect(results.map((r) => r.detectorId).sort()).toEqual(['group.enabled1', 'group.enabled2']);
        });

        it('should return error for detector with invalid regex', () => {
            const results = runDetector({ match: { text: { pattern: '[invalid(regex' } } });
            expect(results.length).toBe(1);
            expect(results[0].detected).toBe('error');
        });

        it('should return error for detector with invalid selector', () => {
            const results = runDetector({ match: { element: { selector: '!!!invalid' } } });
            expect(results.length).toBe(1);
            expect(results[0].detected).toBe('error');
        });

        it('should return error when condition mixes operator keys with leaf fields', () => {
            const results = runDetector({
                match: /** @type {any} - intentionally invalid: mixes operator + leaf keys */ ({
                    text: { all: [{ pattern: 'foo' }], pattern: 'bar' },
                }),
            });
            expect(results.length).toBe(1);
            expect(results[0].detected).toBe('error');
        });

        it('should continue processing other detectors after error', () => {
            const results = runDetectorsInEnv({
                group: {
                    broken: { match: { text: { pattern: '[invalid' } } },
                    working: { match: {} },
                },
            });
            expect(results.length).toBe(2);
            expect(results.find((r) => r.detectorId === 'group.broken')?.detected).toBe('error');
            expect(results.find((r) => r.detectorId === 'group.working')?.detected).toBe(true);
        });
    });

    describe('_executeFireEvent', () => {
        /**
         * @returns {WebDetection}
         */
        function createInstance() {
            const args = {
                site: { domain: 'example.com', url: 'https://example.com/page' },
                platform: {},
                featureSettings: { webDetection: { detectors: {} } },
                bundledConfig: undefined,
                messagingContextName: 'test',
            };
            const originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
            try {
                const instance = new WebDetection('webDetection', undefined, {}, args);
                instance.init();
                return instance;
            } finally {
                globalThis.window = originalWindow;
            }
        }

        /**
         * @param {Partial<import('../src/features/web-detection/parse.js').DetectorActions>} overrides
         * @returns {import('../src/features/web-detection/parse.js').DetectorConfig}
         */
        const actionsConfig = (overrides) => /** @type {any} */ ({ actions: { breakageReportData: { state: 'enabled' }, ...overrides } });

        it('should fire when fireEvent state is enabled', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent(actionsConfig({ fireEvent: { type: 'adwall', state: 'enabled' } }), true);
            // @ts-expect-error - Jasmine spy type inference doesn't match callFeatureMethod's overloaded signature
            expect(instance.callFeatureMethod).toHaveBeenCalledWith('webEvents', 'fireEvent', { type: 'adwall' });
        });

        it('should not fire when fireEvent state is disabled', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent(actionsConfig({ fireEvent: { type: 'adwall', state: 'disabled' } }), true);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });

        it('should not fire when detected is false', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent(actionsConfig({ fireEvent: { type: 'adwall', state: 'enabled' } }), false);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });

        it('should not fire when fireEvent action is absent', async () => {
            const instance = createInstance();
            spyOn(instance, 'callFeatureMethod').and.resolveTo(undefined);
            await instance._executeFireEvent(actionsConfig({}), true);
            expect(instance.callFeatureMethod).not.toHaveBeenCalled();
        });
    });

    describe('fireEvent with webEvents feature lifecycle', () => {
        /** @type {typeof globalThis.window} */
        let originalWindow;

        beforeEach(() => {
            originalWindow = globalThis.window;
            const mockSelf = {};
            // @ts-expect-error - mocking for test
            globalThis.window = { self: mockSelf, top: mockSelf };
        });

        afterEach(() => {
            globalThis.window = originalWindow;
        });

        const defaultArgs = {
            site: { domain: 'example.com', url: 'https://example.com/page' },
            platform: {},
            featureSettings: { webDetection: { detectors: {} } },
            bundledConfig: undefined,
            messagingContextName: 'test',
        };

        /**
         * @param {Partial<import('../src/features/web-detection/parse.js').DetectorActions>} overrides
         * @returns {import('../src/features/web-detection/parse.js').DetectorConfig}
         */
        const actionsConfig = (overrides) => /** @type {any} */ ({ actions: { breakageReportData: { state: 'enabled' }, ...overrides } });

        const fireEventConfig = actionsConfig({ fireEvent: { type: 'adwall', state: 'enabled' } });

        it('should not fire when webEvents feature is not loaded', async () => {
            const instance = new WebDetection('webDetection', undefined, {}, defaultArgs);
            instance.init();

            // callFeatureMethod will return CallFeatureMethodError (feature not found)
            await instance._executeFireEvent(fireEventConfig, true);
            // Completes without error
        });

        it('should not fire when webEvents feature is skipped (disabled on page)', async () => {
            /** @type {Partial<import('../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = new WebEvents('webEvents', undefined, features, defaultArgs);
            features.webEvents = webEvents;
            webEvents.markFeatureAsSkipped('feature disabled for this site');
            const fireEventSpy = spyOn(webEvents, 'fireEvent');

            const instance = new WebDetection('webDetection', undefined, features, defaultArgs);
            instance.init();

            // callFeatureMethod will return CallFeatureMethodError (skipped)
            await instance._executeFireEvent(fireEventConfig, true);
            expect(fireEventSpy).not.toHaveBeenCalled();
        });

        it('should fire when webEvents feature is loaded and ready', async () => {
            /** @type {Partial<import('../src/features.js').FeatureMap>} */
            const features = {};
            const webEvents = new WebEvents('webEvents', undefined, features, defaultArgs);
            features.webEvents = webEvents;
            await webEvents.callInit(defaultArgs);
            const fireEventSpy = spyOn(webEvents, 'fireEvent');

            const instance = new WebDetection('webDetection', undefined, features, defaultArgs);
            instance.init();

            await instance._executeFireEvent(fireEventConfig, true);
            expect(fireEventSpy).toHaveBeenCalledWith({ type: 'adwall' });
        });
    });

    describe('evaluateMatch', () => {
        /**
         * Set up a DOM with given HTML and run evaluateMatch.
         * By default, all elements have non-zero dimensions (appear layouted).
         * Use `zeroSizeSelectors` to specify elements that should have 0x0 dimensions.
         *
         * @param {string} html
         * @param {import('../src/features/web-detection/parse.js').MatchCondition} match
         * @param {object} [options]
         * @param {string[]} [options.zeroSizeSelectors] - Selectors for elements with 0x0 dimensions
         * @returns {boolean}
         */
        function matchInDOM(html, match, options = {}) {
            // Captured DOM APIs are bound to the shared document and taken from its prototypes, so
            // markup and layout are replaced in place (see helpers/install-dom-globals.js).
            resetDom(html, options.zeroSizeSelectors);
            try {
                return evaluateMatch(match);
            } finally {
                resetDom();
            }
        }

        describe('query API capture', () => {
            /**
             * Replace every query method the feature could reach, run `run`, and return the
             * selectors the replacements saw.
             *
             * @param {() => void} run
             * @returns {string[]}
             */
            function selectorsObservedDuring(run) {
                /** @type {string[]} */
                const observed = [];
                /** @type {Array<() => void>} */
                const restore = [];
                for (const proto of [Document.prototype, Element.prototype]) {
                    for (const name of ['querySelector', 'querySelectorAll']) {
                        const original = proto[name];
                        restore.push(() => {
                            proto[name] = original;
                        });
                        proto[name] = function (/** @type {string} */ selectors) {
                            observed.push(selectors);
                            return original.call(this, selectors);
                        };
                    }
                }
                try {
                    run();
                } finally {
                    for (const undo of restore) undo();
                }
                return observed;
            }

            it('records selectors passed through a replaced query method', () => {
                const observed = selectorsObservedDuring(() => document.querySelectorAll('.replacement-is-live'));
                expect(observed).toEqual(['.replacement-is-live']);
            });

            it('hides element condition selectors from a replaced query method', () => {
                /** @type {boolean | undefined} */
                let matched;
                const observed = selectorsObservedDuring(() => {
                    matched = matchInDOM('<div class="g-recaptcha"></div>', { element: { selector: '.g-recaptcha' } });
                });
                expect(matched).toBe(true);
                expect(observed).toEqual([]);
            });

            it('hides text condition selectors from a replaced query method', () => {
                /** @type {boolean | undefined} */
                let matched;
                const observed = selectorsObservedDuring(() => {
                    matched = matchInDOM('<p class="wall">adblocker detected</p>', {
                        text: { pattern: 'adblocker detected', selector: '.wall' },
                    });
                });
                expect(matched).toBe(true);
                expect(observed).toEqual([]);
            });

            it('hides the selectors used when probing content of a matched element', () => {
                // `content` visibility inspects a detached DOMParser tree, which shares these prototypes
                /** @type {boolean | undefined} */
                let matched;
                const observed = selectorsObservedDuring(() => {
                    matched = matchInDOM('<div class="cf-turnstile"><iframe src="https://example.com/"></iframe></div>', {
                        element: { selector: '.cf-turnstile', visibility: 'content' },
                    });
                });
                expect(matched).toBe(true);
                expect(observed).toEqual([]);
            });
        });

        describe('empty conditions', () => {
            it('should match with empty object (no conditions)', () => {
                expect(matchInDOM('<p>content</p>', {})).toBe(true);
            });

            it('should not match with empty array (no alternatives)', () => {
                expect(matchInDOM('<p>content</p>', [])).toBe(false);
            });
        });

        describe('text matching', () => {
            it('should match text pattern in body', () => {
                expect(matchInDOM('<p>Please disable your adblocker</p>', { text: { pattern: 'adblocker' } })).toBe(true);
            });

            it('should not match when pattern not found', () => {
                expect(matchInDOM('<p>Welcome to our site</p>', { text: { pattern: 'adblocker' } })).toBe(false);
            });

            it('should match case-insensitively', () => {
                expect(matchInDOM('<p>ADBLOCKER detected</p>', { text: { pattern: 'adblocker' } })).toBe(true);
            });

            it('should match if ANY pattern matches (OR)', () => {
                // First pattern matches
                expect(matchInDOM('<p>Please disable your adblocker</p>', { text: { pattern: ['adblocker', 'paywall'] } })).toBe(true);

                // Second pattern matches
                expect(matchInDOM('<p>This is behind a paywall</p>', { text: { pattern: ['adblocker', 'paywall'] } })).toBe(true);

                // Neither matches
                expect(matchInDOM('<p>Welcome to our site</p>', { text: { pattern: ['adblocker', 'paywall'] } })).toBe(false);
            });

            it('should match regex patterns', () => {
                expect(matchInDOM('<p>Error code: 12345</p>', { text: { pattern: 'code:\\s*\\d+' } })).toBe(true);
            });

            it('should match text within specific selector', () => {
                expect(
                    matchInDOM('<div id="overlay">Disable adblocker</div><p>Normal content</p>', {
                        text: { pattern: 'adblocker', selector: '#overlay' },
                    }),
                ).toBe(true);

                expect(
                    matchInDOM('<div id="overlay">Normal content</div><p>Disable adblocker</p>', {
                        text: { pattern: 'adblocker', selector: '#overlay' },
                    }),
                ).toBe(false);
            });

            it('should match if ANY selector has matching text (OR)', () => {
                // First selector matches
                expect(
                    matchInDOM('<div class="a">adblocker</div><div class="b">other</div>', {
                        text: { pattern: 'adblocker', selector: ['.a', '.b'] },
                    }),
                ).toBe(true);

                // Second selector matches
                expect(
                    matchInDOM('<div class="a">other</div><div class="b">adblocker</div>', {
                        text: { pattern: 'adblocker', selector: ['.a', '.b'] },
                    }),
                ).toBe(true);

                // Neither selector has matching text
                expect(
                    matchInDOM('<div class="a">other</div><div class="b">content</div>', {
                        text: { pattern: 'adblocker', selector: ['.a', '.b'] },
                    }),
                ).toBe(false);
            });
            it('should match if ANY pattern in ANY selector (both OR)', () => {
                expect(
                    matchInDOM('<div class="a">foo</div><div class="b">other</div>', {
                        text: { pattern: ['foo', 'bar'], selector: ['.a', '.b'] },
                    }),
                ).toBe(true);

                expect(
                    matchInDOM('<div class="a">other</div><div class="b">bar</div>', {
                        text: { pattern: ['foo', 'bar'], selector: ['.a', '.b'] },
                    }),
                ).toBe(true);

                expect(
                    matchInDOM('<div class="a">none</div><div class="b">nope</div>', {
                        text: { pattern: ['foo', 'bar'], selector: ['.a', '.b'] },
                    }),
                ).toBe(false);
            });
        });

        describe('text matching with xpath', () => {
            // Excludes text that is in the DOM but never rendered, so a pattern appearing only
            // inside a <script> body does not match.
            const RENDERED_TEXT =
                '//body//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::template) and not(ancestor::noscript)]';

            /**
             * @param {string} html
             * @returns {boolean}
             */
            function matchRenderedText(html) {
                return matchInDOM(html, { text: { pattern: 'adblocker detected', xpath: RENDERED_TEXT } });
            }

            it('should not match when the pattern is absent', () => {
                expect(matchRenderedText('<p>Hello!</p>')).toBe(false);
            });

            it('should match text wrapped in elements', () => {
                expect(matchRenderedText('<div class="wall"><p>adblocker detected</p></div>')).toBe(true);
            });

            it('should match bare text in body', () => {
                expect(matchRenderedText('adblocker detected')).toBe(true);
            });

            it('should match bare text alongside a script without the pattern', () => {
                expect(matchRenderedText(`adblocker detected<script>console.log('Hello!');</script>`)).toBe(true);
            });

            it('should not match when the pattern only appears inside a script', () => {
                expect(matchRenderedText('<div><script>var msg = "adblocker detected"; showWall(msg);</script></div>')).toBe(false);
            });

            it('should match when the pattern appears in both a rendered subtree and a script', () => {
                expect(
                    matchRenderedText(
                        '<div class="wall"><p>adblocker detected</p></div><script>var msg = "adblocker detected"; log(msg);</script>',
                    ),
                ).toBe(true);
            });

            it('should match bare text that is a sibling of a script containing the pattern', () => {
                expect(matchRenderedText('adblocker detected<script>var msg = "adblocker detected"; log(msg);</script>')).toBe(true);
            });

            it('should match a pattern spanning inline element boundaries', () => {
                // Text of all selected nodes is concatenated, so patterns are not confined to one text node
                expect(matchRenderedText('<div>adblocker <b>detected</b></div>')).toBe(true);
            });

            it('should not match when the pattern only appears in a style element', () => {
                expect(matchRenderedText('<style>/* adblocker detected */</style>')).toBe(false);
            });

            it('should support ancestry-based scoping', () => {
                const match = { text: { pattern: 'adblocker', xpath: '//div[@id="wall"]//text()' } };
                expect(matchInDOM('<div id="wall"><span>adblocker</span></div>', match)).toBe(true);
                expect(matchInDOM('<div id="other"><span>adblocker</span></div>', match)).toBe(false);
            });

            it('should match if ANY expression matches (OR)', () => {
                const match = { text: { pattern: 'adblocker', xpath: ['//div[@id="a"]//text()', '//div[@id="b"]//text()'] } };
                expect(matchInDOM('<div id="a">adblocker</div><div id="b">other</div>', match)).toBe(true);
                expect(matchInDOM('<div id="a">other</div><div id="b">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="a">other</div><div id="b">none</div>', match)).toBe(false);
            });

            it('should not fall back to body when only xpath is provided', () => {
                // `body` is the implicit selector only when the condition names no source of its own
                expect(matchInDOM('<p>adblocker detected</p>', { text: { pattern: 'adblocker', xpath: '//div//text()' } })).toBe(false);
            });

            it('should combine with selector as a disjunction', () => {
                const match = { text: { pattern: 'adblocker', selector: '#viaSelector', xpath: '//div[@id="viaXpath"]//text()' } };
                expect(matchInDOM('<div id="viaSelector">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="viaXpath">adblocker</div>', match)).toBe(true);
                expect(matchInDOM('<div id="neither">adblocker</div>', match)).toBe(false);
            });

            it('should see content added between evaluations', () => {
                // Compiled expressions are reused across evaluations; the DOM they run against is not
                resetDom('<p>Loading...</p>');
                const match = { text: { pattern: 'adblocker detected', xpath: RENDERED_TEXT } };
                expect(evaluateMatch(match)).toBe(false);
                document.body.insertAdjacentHTML('beforeend', '<div class="wall">adblocker detected</div>');
                expect(evaluateMatch(match)).toBe(true);
            });

            it('should throw on an invalid expression, surfacing as a detector error', () => {
                expect(() => matchInDOM('<p>adblocker</p>', { text: { pattern: 'adblocker', xpath: '//[bad' } })).toThrow();
            });

            describe('chunked scanning', () => {
                /**
                 * Selected text is scanned in chunks rather than concatenated in full. Each case
                 * below sizes `chunkSize` to the fixture so flushes land at known offsets.
                 *
                 * @param {string} html
                 * @param {string} pattern
                 * @param {{ chunkSize?: number, chunkTail?: number }} [xpathConfig]
                 * @returns {boolean}
                 */
                function matchChunked(html, pattern, xpathConfig) {
                    return matchInDOM(html, { text: { pattern, xpath: RENDERED_TEXT, xpathConfig } });
                }

                it('should match across node boundaries when flushing on every node', () => {
                    // chunkSize below the length of a single node, so every node triggers a test.
                    // chunkTail is set explicitly because the derived default would floor to 0 here.
                    expect(
                        matchChunked('<div>adblocker <b>detected</b></div>', 'adblocker detected', { chunkSize: 4, chunkTail: 20 }),
                    ).toBe(true);
                });

                it('should derive a chunkTail of 0 from a chunkSize below the tail ratio', () => {
                    // floor(4 / 16) is 0, so nothing is retained and the straddling match is lost.
                    // Config CI keeps chunkSize well above this; pinned so the arithmetic is explicit.
                    expect(matchChunked('<div>adblocker <b>detected</b></div>', 'adblocker detected', { chunkSize: 4 })).toBe(false);
                });

                it('should match a pattern straddling a flush boundary', () => {
                    // First node is exactly one chunk, so the flush lands mid-phrase
                    const html = `<span>${'z'.repeat(90)}adblocker </span><span>detected</span>`;
                    expect(matchChunked(html, 'adblocker detected', { chunkSize: 100, chunkTail: 20 })).toBe(true);
                });

                it('should miss a straddling match longer than the retained tail', () => {
                    // Documented limitation: the tail bounds the longest match that survives a
                    // boundary. Remedied from config by raising chunkTail or disabling chunking.
                    const html = `<span>${'z'.repeat(90)}adblocker </span><span>detected</span>`;
                    expect(matchChunked(html, 'adblocker detected', { chunkSize: 100, chunkTail: 2 })).toBe(false);
                    expect(matchChunked(html, 'adblocker detected', { chunkSize: 0 })).toBe(true);
                });

                it('should not let a word-boundary pattern assert at a mid-word chunk cut', () => {
                    // Cutting at length - chunkTail would start the buffer at "adblocker", where \b
                    // asserts against the start of the string. The real preceding character is a
                    // word character, so the walk-back extends the tail to include it.
                    const html = `<span>${'z'.repeat(91)}adblocker</span>`;
                    expect(matchChunked(html, '\\badblocker', { chunkSize: 100, chunkTail: 9 })).toBe(false);
                    expect(matchChunked(html, '\\badblocker', { chunkSize: 0 })).toBe(false);
                });

                it('should still find a word-boundary match that the walk-back keeps intact', () => {
                    const html = `<span>${'z'.repeat(90)} adblocker</span>`;
                    expect(matchChunked(html, '\\badblocker', { chunkSize: 100, chunkTail: 9 })).toBe(true);
                });

                it('should cap the walk-back at chunkTail when that is the smaller ceiling', () => {
                    // The node ends in an unbroken run of word characters, so the walk-back runs
                    // until it hits its ceiling. That fixes the retained text at exactly 2 * chunkTail.
                    const html = `<span>${'z'.repeat(75)}0123456789abcdefghijklmno</span><span>detected</span>`;
                    const config = { chunkSize: 100, chunkTail: 10 };
                    // Needs exactly the 20 retained characters
                    expect(matchChunked(html, '56789abcdefghijklmnodetected', config)).toBe(true);
                    // Needs 21, one past the ceiling
                    expect(matchChunked(html, '456789abcdefghijklmnodetected', config)).toBe(false);
                });

                it('should cap the walk-back at the word-length limit for a large chunkTail', () => {
                    // Same unbroken run, but a tail past the 64 character word-length ceiling, so
                    // the walk stops there instead: 100 retained plus at most 64 walked back.
                    const run = 'abcdefghij'.repeat(20);
                    const html = `<span>${'z'.repeat(800)}${run}</span><span>detected</span>`;
                    const config = { chunkSize: 1000, chunkTail: 100 };
                    // Needs exactly the 164 retained characters
                    expect(matchChunked(html, run.slice(36) + 'detected', config)).toBe(true);
                    // Needs 165, one past the ceiling
                    expect(matchChunked(html, run.slice(35) + 'detected', config)).toBe(false);
                });

                it('should honour chunkTail: 0 rather than promoting it to a floor', () => {
                    const html = `<span>${'z'.repeat(90)}adblocker </span><span>detected</span>`;
                    expect(matchChunked(html, 'adblocker detected', { chunkSize: 100, chunkTail: 0 })).toBe(false);
                });

                it('should terminate and stay correct when chunkTail far exceeds chunkSize', () => {
                    // Pins the structural progress property: flushing is driven by characters added
                    // since the last test, so an oversized tail cannot stall the scan. Flushing on
                    // total buffer length instead would re-test the whole buffer for every node.
                    const html = `<span>${'z'.repeat(200)}adblocker </span><span>detected</span>`;
                    expect(matchChunked(html, 'adblocker detected', { chunkSize: 10, chunkTail: 1000 })).toBe(true);
                    expect(matchChunked(html, 'absent phrase', { chunkSize: 10, chunkTail: 1000 })).toBe(false);
                });

                it('should use the built-in defaults when xpathConfig is omitted', () => {
                    // Smaller than the default chunk, so this is a single test either way
                    expect(matchChunked('<div>adblocker <b>detected</b></div>', 'adblocker detected')).toBe(true);
                    expect(matchChunked('<div>adblocker <b>detected</b></div>', 'adblocker detected', {})).toBe(true);
                });

                it('should produce concat-identical results across the fixture set with chunkSize: 0', () => {
                    const fixtures = [
                        '<p>Hello!</p>',
                        '<div class="wall"><p>adblocker detected</p></div>',
                        'adblocker detected',
                        `adblocker detected<script>console.log('Hello!');</script>`,
                        '<div><script>var msg = "adblocker detected"; showWall(msg);</script></div>',
                        '<div>adblocker <b>detected</b></div>',
                        '<style>/* adblocker detected */</style>',
                    ];
                    for (const html of fixtures) {
                        expect(matchChunked(html, 'adblocker detected', { chunkSize: 0 })).toBe(matchRenderedText(html));
                    }
                });
            });
        });

        describe('element matching', () => {
            describe('visibility: any', () => {
                it('should match when element exists', () => {
                    expect(matchInDOM('<div class="overlay">content</div>', { element: { selector: '.overlay', visibility: 'any' } })).toBe(
                        true,
                    );
                });

                it('should not match when element does not exist', () => {
                    expect(matchInDOM('<div class="other">content</div>', { element: { selector: '.overlay', visibility: 'any' } })).toBe(
                        false,
                    );
                });

                it('should match even if element is hidden', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="display: none">content</div>', {
                            element: { selector: '.overlay', visibility: 'any' },
                        }),
                    ).toBe(true);
                });
            });

            describe('visibility: any (implict when not specified)', () => {
                it('should match when element exists', () => {
                    expect(matchInDOM('<div class="overlay">content</div>', { element: { selector: '.overlay' } })).toBe(true);
                });

                it('should not match when element does not exist', () => {
                    expect(matchInDOM('<div class="other">content</div>', { element: { selector: '.overlay' } })).toBe(false);
                });

                it('should match even if element is hidden', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="display: none">content</div>', { element: { selector: '.overlay' } }),
                    ).toBe(true);
                });
            });

            describe('visibility: hidden', () => {
                it('should match element with display: none', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="display: none">content</div>', {
                            element: { selector: '.overlay', visibility: 'hidden' },
                        }),
                    ).toBe(true);
                });

                it('should match element with visibility: hidden style', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="visibility: hidden">content</div>', {
                            element: { selector: '.overlay', visibility: 'hidden' },
                        }),
                    ).toBe(true);
                });

                it('should match element with opacity: 0', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="opacity: 0">content</div>', {
                            element: { selector: '.overlay', visibility: 'hidden' },
                        }),
                    ).toBe(true);
                });

                it('should match element with zero dimensions', () => {
                    expect(
                        matchInDOM(
                            '<div class="overlay">content</div>',
                            { element: { selector: '.overlay', visibility: 'hidden' } },
                            { zeroSizeSelectors: ['.overlay'] },
                        ),
                    ).toBe(true);
                });

                it('should not match visible element', () => {
                    expect(
                        matchInDOM('<div class="overlay">content</div>', { element: { selector: '.overlay', visibility: 'hidden' } }),
                    ).toBe(false);
                });

                it('should not match when element does not exist', () => {
                    expect(
                        matchInDOM('<div class="other">content</div>', { element: { selector: '.overlay', visibility: 'hidden' } }),
                    ).toBe(false);
                });
            });

            describe('visibility: visible', () => {
                it('should match visible element', () => {
                    expect(
                        matchInDOM('<div class="overlay">content</div>', { element: { selector: '.overlay', visibility: 'visible' } }),
                    ).toBe(true);
                });

                it('should not match element with display: none', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="display: none">content</div>', {
                            element: { selector: '.overlay', visibility: 'visible' },
                        }),
                    ).toBe(false);
                });

                it('should not match element with visibility: hidden style', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="visibility: hidden">content</div>', {
                            element: { selector: '.overlay', visibility: 'visible' },
                        }),
                    ).toBe(false);
                });

                it('should not match element with opacity: 0', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="opacity: 0">content</div>', {
                            element: { selector: '.overlay', visibility: 'visible' },
                        }),
                    ).toBe(false);
                });

                it('should not match element with zero dimensions', () => {
                    expect(
                        matchInDOM(
                            '<div class="overlay">content</div>',
                            { element: { selector: '.overlay', visibility: 'visible' } },
                            { zeroSizeSelectors: ['.overlay'] },
                        ),
                    ).toBe(false);
                });

                it('should not match when element does not exist', () => {
                    expect(
                        matchInDOM('<div class="other">content</div>', { element: { selector: '.overlay', visibility: 'visible' } }),
                    ).toBe(false);
                });
            });

            describe('visibility: content (layout-free)', () => {
                it('should match when element has text content', () => {
                    expect(
                        matchInDOM('<div class="overlay">Verifying you are human</div>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should match content-filled element even when display:none (unlike visible)', () => {
                    expect(
                        matchInDOM('<div class="overlay" style="display: none">challenge</div>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should match when element contains a real (cross-origin) iframe', () => {
                    expect(
                        matchInDOM(
                            '<div class="overlay"><iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge"></iframe></div>',
                            {
                                element: { selector: '.overlay', visibility: 'content' },
                            },
                        ),
                    ).toBe(true);
                });

                it('should match when element contains a form control', () => {
                    expect(
                        matchInDOM('<div class="overlay"><input type="checkbox"></div>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should not match an empty element', () => {
                    expect(matchInDOM('<div class="overlay">   </div>', { element: { selector: '.overlay', visibility: 'content' } })).toBe(
                        false,
                    );
                });

                it('should not count about:blank iframes as content', () => {
                    expect(
                        matchInDOM('<div class="overlay"><iframe src="about:blank"></iframe></div>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(false);
                });

                it('should not count metadata-only content (script/style)', () => {
                    expect(
                        matchInDOM('<div class="overlay"><style>.x{color:red}</style><script>var a=1;</script></div>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(false);
                });

                it('should match when the element itself is a real (cross-origin) iframe', () => {
                    expect(
                        matchInDOM('<iframe class="overlay" src="https://challenges.cloudflare.com/cdn-cgi/challenge"></iframe>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should not match when the element itself is an about:blank iframe', () => {
                    expect(
                        matchInDOM('<iframe class="overlay" src="about:blank"></iframe>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(false);
                });

                it('should not match when the element itself is an iframe with no src', () => {
                    expect(
                        matchInDOM('<iframe class="overlay"></iframe>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(false);
                });

                it('should match when the element itself is a media/form element', () => {
                    expect(
                        matchInDOM('<canvas class="overlay"></canvas>', {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should match substantial text without serialize+parse (size cap)', () => {
                    const bigText = 'a'.repeat(50001);
                    expect(
                        matchInDOM(`<div class="overlay">${bigText}</div>`, {
                            element: { selector: '.overlay', visibility: 'content' },
                        }),
                    ).toBe(true);
                });

                it('should not match when element does not exist', () => {
                    expect(
                        matchInDOM('<div class="other">content</div>', { element: { selector: '.overlay', visibility: 'content' } }),
                    ).toBe(false);
                });
            });

            describe('multiple selectors (OR)', () => {
                it('should match if ANY selector matches', () => {
                    // First selector matches
                    expect(matchInDOM('<div class="a"></div>', { element: { selector: ['.a', '.b'], visibility: 'any' } })).toBe(true);

                    // Second selector matches
                    expect(matchInDOM('<div class="b"></div>', { element: { selector: ['.a', '.b'], visibility: 'any' } })).toBe(true);

                    // Both match
                    expect(
                        matchInDOM('<div class="a"></div><div class="b"></div>', {
                            element: { selector: ['.a', '.b'], visibility: 'any' },
                        }),
                    ).toBe(true);

                    // Neither matches
                    expect(matchInDOM('<div class="c"></div>', { element: { selector: ['.a', '.b'], visibility: 'any' } })).toBe(false);
                });

                it('should support CSS selector lists', () => {
                    expect(matchInDOM('<div class="a"></div>', { element: { selector: '.a, .b' } })).toBe(true);
                    expect(matchInDOM('<div class="a"></div>', { element: { selector: '.b, .a' } })).toBe(true);
                });
            });
        });

        describe('combined conditions (AND)', () => {
            it('should require both text and element to match', () => {
                expect(
                    matchInDOM('<div class="overlay">Disable adblocker</div>', {
                        text: { pattern: 'adblocker' },
                        element: { selector: '.overlay', visibility: 'any' },
                    }),
                ).toBe(true);

                // Text matches but element doesn't
                expect(
                    matchInDOM('<p>Disable adblocker</p>', {
                        text: { pattern: 'adblocker' },
                        element: { selector: '.overlay', visibility: 'any' },
                    }),
                ).toBe(false);

                // Element matches but text doesn't
                expect(
                    matchInDOM('<div class="overlay">Welcome</div>', {
                        text: { pattern: 'adblocker' },
                        element: { selector: '.overlay', visibility: 'any' },
                    }),
                ).toBe(false);
            });
        });

        describe('OR conditions (array of alternatives)', () => {
            it('should match if any alternative matches', () => {
                // First alternative matches
                expect(matchInDOM('<p>adblocker</p>', [{ text: { pattern: 'adblocker' } }, { text: { pattern: 'paywall' } }])).toBe(true);

                // Second alternative matches
                expect(matchInDOM('<p>paywall</p>', [{ text: { pattern: 'adblocker' } }, { text: { pattern: 'paywall' } }])).toBe(true);

                // Neither matches
                expect(matchInDOM('<p>welcome</p>', [{ text: { pattern: 'adblocker' } }, { text: { pattern: 'paywall' } }])).toBe(false);
            });

            it('should support OR within text conditions', () => {
                expect(
                    matchInDOM('<p>content</p>', {
                        text: [{ pattern: 'adblocker' }, { pattern: 'content' }],
                    }),
                ).toBe(true);
            });

            it('should support OR within element conditions', () => {
                expect(
                    matchInDOM('<div class="modal"></div>', {
                        element: [
                            { selector: '.overlay', visibility: 'any' },
                            { selector: '.modal', visibility: 'any' },
                        ],
                    }),
                ).toBe(true);
            });
        });

        describe('all operator', () => {
            it('should require every condition to match', () => {
                expect(matchInDOM('<p>foo bar</p>', { text: { all: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(true);
                expect(matchInDOM('<p>foo</p>', { text: { all: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(false);
                expect(matchInDOM('<p>bar</p>', { text: { all: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(false);
            });

            it('should accept singleton form (object instead of array)', () => {
                expect(matchInDOM('<p>foo</p>', { text: { all: { pattern: 'foo' } } })).toBe(true);
                expect(matchInDOM('<p>baz</p>', { text: { all: { pattern: 'foo' } } })).toBe(false);
            });

            it('should be vacuously true on empty array', () => {
                expect(matchInDOM('<p>x</p>', { text: { all: [] } })).toBe(true);
            });
        });

        describe('any operator', () => {
            it('should match if at least one condition matches', () => {
                expect(matchInDOM('<p>foo</p>', { text: { any: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(true);
                expect(matchInDOM('<p>bar</p>', { text: { any: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(true);
                expect(matchInDOM('<p>baz</p>', { text: { any: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(false);
            });

            it('should be equivalent to bare-array OR form', () => {
                const html = '<p>foo</p>';
                const opForm = { text: { any: [{ pattern: 'foo' }, { pattern: 'bar' }] } };
                const arrayForm = { text: [{ pattern: 'foo' }, { pattern: 'bar' }] };
                expect(matchInDOM(html, opForm)).toBe(matchInDOM(html, arrayForm));
            });

            it('should be vacuously false on empty array', () => {
                expect(matchInDOM('<p>x</p>', { text: { any: [] } })).toBe(false);
            });
        });

        describe('none operator', () => {
            it('should match when no nested condition matches', () => {
                expect(matchInDOM('<p>welcome</p>', { text: { none: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(true);
            });

            it('should fail when any nested condition matches', () => {
                expect(matchInDOM('<p>foo</p>', { text: { none: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(false);
                expect(matchInDOM('<p>bar</p>', { text: { none: [{ pattern: 'foo' }, { pattern: 'bar' }] } })).toBe(false);
            });

            it('should accept singleton form', () => {
                expect(matchInDOM('<p>welcome</p>', { text: { none: { pattern: 'foo' } } })).toBe(true);
                expect(matchInDOM('<p>foo</p>', { text: { none: { pattern: 'foo' } } })).toBe(false);
            });

            it('should be vacuously true on empty array', () => {
                expect(matchInDOM('<p>x</p>', { text: { none: [] } })).toBe(true);
            });
        });

        describe('sibling operators (AND)', () => {
            it('should AND-combine all + none', () => {
                // text contains foo (all) and does not contain bad (none)
                expect(matchInDOM('<p>foo good</p>', { text: { all: [{ pattern: 'foo' }], none: [{ pattern: 'bad' }] } })).toBe(true);
                // contains foo but also contains bad -> none fails
                expect(matchInDOM('<p>foo bad</p>', { text: { all: [{ pattern: 'foo' }], none: [{ pattern: 'bad' }] } })).toBe(false);
                // missing foo -> all fails
                expect(matchInDOM('<p>good</p>', { text: { all: [{ pattern: 'foo' }], none: [{ pattern: 'bad' }] } })).toBe(false);
            });

            it('should AND-combine any + none', () => {
                expect(
                    matchInDOM('<p>foo good</p>', { text: { any: [{ pattern: 'foo' }, { pattern: 'baz' }], none: [{ pattern: 'bad' }] } }),
                ).toBe(true);
                expect(
                    matchInDOM('<p>foo bad</p>', { text: { any: [{ pattern: 'foo' }, { pattern: 'baz' }], none: [{ pattern: 'bad' }] } }),
                ).toBe(false);
            });
        });

        describe('operators at top-level match', () => {
            it('should support all at the match level', () => {
                expect(
                    matchInDOM('<div class="overlay">disable adblocker</div>', {
                        all: [{ text: { pattern: 'adblocker' } }, { element: { selector: '.overlay', visibility: 'any' } }],
                    }),
                ).toBe(true);
            });

            it('should support any at the match level', () => {
                expect(
                    matchInDOM('<p>welcome</p>', {
                        any: [{ text: { pattern: 'adblocker' } }, { text: { pattern: 'welcome' } }],
                    }),
                ).toBe(true);
            });

            it('should support none at the match level', () => {
                expect(matchInDOM('<p>welcome</p>', { none: [{ text: { pattern: 'adblocker' } }] })).toBe(true);
                expect(matchInDOM('<p>adblocker</p>', { none: [{ text: { pattern: 'adblocker' } }] })).toBe(false);
            });
        });

        describe('nested operators', () => {
            it('should evaluate deeply nested operator trees', () => {
                // (any[a, b]) AND (none[c])
                const condition = {
                    text: {
                        all: [{ any: [{ pattern: 'a' }, { pattern: 'b' }] }, { none: [{ pattern: 'c' }] }],
                    },
                };
                expect(matchInDOM('<p>a</p>', condition)).toBe(true);
                expect(matchInDOM('<p>b</p>', condition)).toBe(true);
                expect(matchInDOM('<p>a c</p>', condition)).toBe(false);
                expect(matchInDOM('<p>x</p>', condition)).toBe(false);
            });
        });

        describe('operator children of mixed shape (operator-block and leaf siblings)', () => {
            // Each child of any/all/none is its own ConditionNode and may independently be
            // either an operator block or a leaf — they just can't be mixed *within the same object*.

            it('should allow all to mix an operator-block child and a leaf child at match level', () => {
                // all[ any[ text=foo, text=bar ], element=.overlay ]
                const condition = {
                    all: [
                        { any: [{ text: { pattern: 'foo' } }, { text: { pattern: 'bar' } }] },
                        { element: { selector: '.overlay', visibility: 'any' } },
                    ],
                };
                expect(matchInDOM('<div class="overlay">foo</div>', condition)).toBe(true);
                expect(matchInDOM('<div class="overlay">bar</div>', condition)).toBe(true);
                // text matches but element doesn't
                expect(matchInDOM('<p>foo</p>', condition)).toBe(false);
                // element matches but text doesn't
                expect(matchInDOM('<div class="overlay">welcome</div>', condition)).toBe(false);
            });

            it('should allow any to mix an operator-block child and a leaf child at per-type level', () => {
                // text: any[ none[pattern=bad], pattern=foo ]
                const condition = {
                    text: {
                        any: [{ none: [{ pattern: 'bad' }] }, { pattern: 'foo' }],
                    },
                };
                // none[bad] satisfied (welcome doesn't contain bad) -> any matches
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(true);
                // pattern=foo matches -> any matches
                expect(matchInDOM('<p>foo</p>', condition)).toBe(true);
                // pattern=bad present (none fails) and pattern=foo missing -> any fails
                expect(matchInDOM('<p>bad</p>', condition)).toBe(false);
                // both children satisfied
                expect(matchInDOM('<p>foo good</p>', condition)).toBe(true);
            });

            it('should allow none to mix an operator-block child and a leaf child', () => {
                // text: none[ all[pattern=foo, pattern=bar], pattern=danger ]
                const condition = {
                    text: {
                        none: [{ all: [{ pattern: 'foo' }, { pattern: 'bar' }] }, { pattern: 'danger' }],
                    },
                };
                // neither child matches -> none satisfied
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(true);
                // only foo present -> all[foo,bar] fails, danger absent -> none satisfied
                expect(matchInDOM('<p>foo</p>', condition)).toBe(true);
                // foo+bar -> all matches -> none fails
                expect(matchInDOM('<p>foo bar</p>', condition)).toBe(false);
                // danger leaf matches -> none fails
                expect(matchInDOM('<p>danger</p>', condition)).toBe(false);
            });

            it('should allow leaf and operator-block siblings inside a bare-array OR', () => {
                // text: [ all[pattern=foo, pattern=bar], pattern=quick ]
                const condition = {
                    text: [{ all: [{ pattern: 'foo' }, { pattern: 'bar' }] }, { pattern: 'quick' }],
                };
                // operator-block child satisfied
                expect(matchInDOM('<p>foo bar</p>', condition)).toBe(true);
                // leaf child satisfied
                expect(matchInDOM('<p>quick</p>', condition)).toBe(true);
                // neither
                expect(matchInDOM('<p>welcome</p>', condition)).toBe(false);
            });
        });

        // Captcha vendor detectors. These mirror the per-provider `captcha` detectors in
        // privacy-configuration/features/web-detection.json — keep the selectors in sync.
        // The metric counts *visible* captcha challenges per navigation, so every detector
        // uses visibility: 'visible'. Window-property signals (window.grecaptcha etc.) are
        // intentionally NOT used: a loaded captcha library is not a visible challenge and
        // would inflate the per-navigation ratio.
        describe('captcha vendor detectors', () => {
            /** @type {Record<string, import('../src/features/web-detection/parse.js').MatchCondition>} */
            const captcha = {
                recaptcha: {
                    element: {
                        selector: ['.g-recaptcha', "iframe[src*='recaptcha']", "iframe[title*='recaptcha' i]"],
                        visibility: 'visible',
                    },
                },
                hcaptcha: {
                    element: {
                        selector: ['.h-captcha', "iframe[src*='hcaptcha.com']", "iframe[title*='hcaptcha' i]"],
                        visibility: 'visible',
                    },
                },
                turnstile: {
                    element: {
                        // :not(#turnstile-wrapper) excludes the Cloudflare interstitial's own Turnstile wrapper
                        // (<div id="turnstile-wrapper" class="cf-turnstile">), so an interstitial counts as `cloudflare`, not `turnstile`.
                        selector: ['.cf-turnstile:not(#turnstile-wrapper)', '.cf-turnstile:not(#turnstile-wrapper) iframe'],
                        visibility: 'visible',
                    },
                },
                cloudflare: {
                    element: {
                        selector: [
                            '#challenge-form',
                            '#cf-wrapper',
                            '.cf-browser-verification',
                            '#challenge-running',
                            '#cf-challenge-running',
                            '#challenge-stage',
                        ],
                        visibility: 'visible',
                    },
                },
                other: {
                    text: {
                        pattern: [
                            'press (and|&) hold to (confirm|verify)',
                            'slide( right)? to (verify|complete)',
                            'complete the security check to (access|continue)',
                        ],
                    },
                },
            };

            // Representative visible markup per vendor.
            const fixtures = {
                recaptcha:
                    '<div class="g-recaptcha"></div><iframe src="https://www.google.com/recaptcha/api2/anchor" title="reCAPTCHA"></iframe>',
                hcaptcha:
                    '<div class="h-captcha"></div><iframe src="https://newassets.hcaptcha.com/captcha/v1/frame" title="hCaptcha"></iframe>',
                turnstile:
                    '<div class="cf-turnstile"><iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/turnstile"></iframe></div>',
                // The current Cloudflare interstitial embeds Turnstile via <div id="turnstile-wrapper" class="cf-turnstile">,
                // so it carries a .cf-turnstile element. It must match `cloudflare` (via #cf-wrapper/#challenge-*) but NOT
                // `turnstile` — which is why the turnstile selector excludes #turnstile-wrapper.
                cloudflare:
                    '<div id="cf-wrapper"><div id="challenge-running">Checking your browser before accessing the site.</div><div id="challenge-stage"><div id="turnstile-wrapper" class="cf-turnstile"><iframe src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile"></iframe></div></div></div>',
                other: '<main><p>Please press and hold to confirm you are human.</p></main>',
            };

            const vendors = ['recaptcha', 'hcaptcha', 'turnstile', 'cloudflare', 'other'];

            describe('matches its own visible fixture', () => {
                for (const vendor of vendors) {
                    it(`${vendor}`, () => {
                        expect(matchInDOM(fixtures[vendor], captcha[vendor])).toBe(true);
                    });
                }
            });

            describe('does not match other vendors (no double counting)', () => {
                for (const vendor of vendors) {
                    for (const fixtureVendor of vendors) {
                        if (vendor === fixtureVendor) continue;
                        it(`${fixtureVendor} fixture does not match ${vendor}`, () => {
                            expect(matchInDOM(fixtures[fixtureVendor], captcha[vendor])).toBe(false);
                        });
                    }
                }
            });

            describe('does not match when absent', () => {
                const clean = '<main><h1>Welcome</h1><p>Just an ordinary article with nothing to verify.</p></main>';
                for (const vendor of vendors) {
                    it(`${vendor}`, () => {
                        expect(matchInDOM(clean, captcha[vendor])).toBe(false);
                    });
                }
            });

            describe('visibility gating (only visible challenges count)', () => {
                it('hidden recaptcha (display:none) does not match', () => {
                    expect(matchInDOM('<div class="g-recaptcha" style="display: none"></div>', captcha.recaptcha)).toBe(false);
                });

                it('zero-size hcaptcha does not match', () => {
                    expect(matchInDOM('<div class="h-captcha"></div>', captcha.hcaptcha, { zeroSizeSelectors: ['.h-captcha'] })).toBe(
                        false,
                    );
                });

                it('hidden turnstile widget (display:none) does not match', () => {
                    expect(matchInDOM('<div class="cf-turnstile" style="display: none"></div>', captcha.turnstile)).toBe(false);
                });
            });

            it('other does not fire on reCAPTCHA\'s "I\'m not a robot" label', () => {
                expect(matchInDOM('<div class="g-recaptcha">I\'m not a robot</div>', captcha.other)).toBe(false);
            });
        });
    });
});
