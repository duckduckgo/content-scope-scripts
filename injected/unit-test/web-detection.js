import { JSDOM } from 'jsdom';
import { parseDetectors } from '../src/features/web-detection/parse.js';
import { evaluateMatch } from '../src/features/web-detection/matching.js';
import WebDetection from '../src/features/web-detection.js';

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
            expect(asSingle(result.match).text).toEqual({ pattern: ['adblocker', 'disable'] });
            expect(asSingle(result.match).element).toEqual({ selector: '.overlay', visibility: 'visible' });
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
            const { zeroSizeSelectors = [] } = options;
            const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
            const originalDocument = globalThis.document;
            const originalGetComputedStyle = globalThis.getComputedStyle;
            globalThis.document = dom.window.document;

            // Wrap getComputedStyle to return browser-like defaults (JSDOM returns "" for opacity)
            const jsdomGetComputedStyle = dom.window.getComputedStyle;
            globalThis.getComputedStyle = (el, pseudoElt) => {
                const style = jsdomGetComputedStyle(el, pseudoElt);
                return new Proxy(style, {
                    get(target, prop) {
                        const value = target[prop];
                        // JSDOM returns "" for opacity, browsers return "1"
                        if (prop === 'opacity' && value === '') return '1';
                        return value;
                    },
                });
            };

            // Patch Element prototype to mock getBoundingClientRect based on selectors
            const ElementProto = dom.window.Element.prototype;
            const originalGetBoundingClientRect = ElementProto.getBoundingClientRect;
            ElementProto.getBoundingClientRect = function () {
                const isZeroSize = zeroSizeSelectors.some((sel) => this.matches(sel));
                return {
                    width: isZeroSize ? 0 : 100,
                    height: isZeroSize ? 0 : 50,
                    top: 0,
                    left: 0,
                    right: isZeroSize ? 0 : 100,
                    bottom: isZeroSize ? 0 : 50,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                };
            };

            try {
                return evaluateMatch(match);
            } finally {
                globalThis.document = originalDocument;
                globalThis.getComputedStyle = originalGetComputedStyle;
                ElementProto.getBoundingClientRect = originalGetBoundingClientRect;
            }
        }

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
    });
});
