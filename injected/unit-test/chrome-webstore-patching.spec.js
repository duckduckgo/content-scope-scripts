import {
    getWebstorePrivate,
    hasRuntimeLastError,
    parseExtensionId,
    readCuratedCatalog,
    readStatusSets,
} from '../src/features/chrome-webstore-patching/helpers.js';
import { isStateEnabled } from '../src/utils.js';

const CURATED_ID = 'nngceckbapebfimnlniiiahkandclblb';
const INTERNAL_ID = 'aeblfdkhhhdcdjpifhhbdiojplfjncoa';

// Only the pure helpers are unit tested: the feature module imports SVG assets,
// which plain Node can't load. Copy resolution and the chrome.webstorePrivate
// calls are covered by the integration specs instead.
describe('chromeWebstorePatching helpers', () => {
    // The real platform-aware check, the same one ConfigFeature#_isStateEnabled
    // wraps, so these specs pin the actual contract rather than a stand-in
    const enabledFor = () => (/** @type {any} */ state) => isStateEnabled(state, { internal: true });

    /**
     * bundledConfig shape carrying a curatedExtensions catalog
     * @param {object} [overrides] applied to the curatedExtensions sub-feature
     * @param {string | null} [parentState]
     */
    function configWithCatalog(overrides = {}, parentState = 'internal') {
        return {
            features: {
                extensionManagement: {
                    state: parentState,
                    features: {
                        curatedExtensions: {
                            state: 'internal',
                            settings: { catalog: [{ id: CURATED_ID }] },
                            ...overrides,
                        },
                    },
                },
            },
            unprotectedTemporary: [],
        };
    }

    describe('parseExtensionId', () => {
        const cases = [
            ['/detail/bitwarden-password-manage/' + CURATED_ID, CURATED_ID],
            ['/detail/' + CURATED_ID, CURATED_ID],
            ['/detail/slug/' + CURATED_ID + '/', CURATED_ID],
            ['/detail/slug/' + CURATED_ID + '?hl=en', CURATED_ID],
            ['/detail/slug/' + CURATED_ID + '#reviews', CURATED_ID],
            ['/detail/slug/tooshort', null],
            // 32 chars but outside a-p alphabet
            ['/detail/slug/zzgceckbapebfimnlniiiahkandclblz', null],
            ['/', null],
            ['/category/extensions', null],
            ['', null],
        ];
        for (const [input, expected] of cases) {
            it(`${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
                expect(parseExtensionId(/** @type {string} */ (input))).toBe(expected);
            });
        }
    });

    // Every empty result here is a launch guarantee: an unreadable catalog must
    // read as "nothing is installable", never as "everything is curated"
    describe('readCuratedCatalog', () => {
        it('returns catalog ids on the happy path', () => {
            expect(readCuratedCatalog(configWithCatalog(), enabledFor())).toEqual([CURATED_ID]);
        });

        it('accepts enabled state', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: 'enabled' }), enabledFor())).toEqual([CURATED_ID]);
        });

        // Internal builds read catalogInternal so extensions still being trialled
        // can be offered internally while the public catalog stays narrower
        it('reads catalogInternal on an internal build', () => {
            const config = configWithCatalog({ settings: { catalog: [{ id: CURATED_ID }], catalogInternal: [{ id: INTERNAL_ID }] } });
            expect(readCuratedCatalog(config, enabledFor(), true)).toEqual([INTERNAL_ID]);
            expect(readCuratedCatalog(config, enabledFor(), false)).toEqual([CURATED_ID]);
        });

        it('falls back to catalog when catalogInternal is absent or malformed', () => {
            const absent = configWithCatalog({ settings: { catalog: [{ id: CURATED_ID }] } });
            expect(readCuratedCatalog(absent, enabledFor(), true)).toEqual([CURATED_ID]);
            const malformed = configWithCatalog({ settings: { catalog: [{ id: CURATED_ID }], catalogInternal: 'nope' } });
            expect(readCuratedCatalog(malformed, enabledFor(), true)).toEqual([CURATED_ID]);
        });

        it('returns [] when curatedExtensions is disabled', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: 'disabled' }), enabledFor())).toEqual([]);
        });

        it('returns [] when state is missing', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: undefined }), enabledFor())).toEqual([]);
        });

        it('returns [] when settings are missing', () => {
            expect(readCuratedCatalog(configWithCatalog({ settings: undefined }), enabledFor())).toEqual([]);
        });

        it('returns [] when catalog is not an array', () => {
            expect(readCuratedCatalog(configWithCatalog({ settings: { catalog: 'nope' } }), enabledFor())).toEqual([]);
        });

        // Not reachable from a config fixture: the schema requires an id on
        // every entry, so this shape can only be exercised here
        it('filters entries without a string id', () => {
            const config = configWithCatalog({
                settings: { catalog: [{ id: CURATED_ID }, { name: 'no id' }, { id: 42 }, null] },
            });
            expect(readCuratedCatalog(config, enabledFor())).toEqual([CURATED_ID]);
        });

        it('returns [] when the parent extensionManagement feature is disabled', () => {
            expect(readCuratedCatalog(configWithCatalog({}, 'disabled'), enabledFor())).toEqual([]);
        });

        it('returns [] when the parent state is missing', () => {
            // null survives the default parameter (undefined would not)
            expect(readCuratedCatalog(configWithCatalog({}, null), enabledFor())).toEqual([]);
        });

        it('returns [] when extensionManagement is absent', () => {
            expect(readCuratedCatalog({ features: {} }, enabledFor())).toEqual([]);
        });

        it('returns [] with an empty features object', () => {
            expect(readCuratedCatalog({ features: {}, unprotectedTemporary: [] }, enabledFor())).toEqual([]);
        });

        it('returns [] when there is no config at all', () => {
            expect(readCuratedCatalog(undefined, enabledFor())).toEqual([]);
            expect(readCuratedCatalog(null, enabledFor())).toEqual([]);
        });
    });

    describe('getWebstorePrivate', () => {
        it('returns the API when getExtensionStatus is callable', () => {
            const getExtensionStatus = () => {};
            expect(getWebstorePrivate({ webstorePrivate: { getExtensionStatus } })?.getExtensionStatus).toBe(getExtensionStatus);
        });

        for (const [label, value] of [
            ['no chrome global', undefined],
            ['chrome is not an object', 'nope'],
            ['no webstorePrivate', {}],
            ['webstorePrivate without the method', { webstorePrivate: {} }],
            ['getExtensionStatus is not callable', { webstorePrivate: { getExtensionStatus: 'nope' } }],
        ]) {
            it(`returns null when ${label}`, () => {
                expect(getWebstorePrivate(value)).toBeNull();
            });
        }
    });

    describe('hasRuntimeLastError', () => {
        it('is true when runtime.lastError is set', () => {
            expect(hasRuntimeLastError({ runtime: { lastError: { message: 'boom' } } })).toBeTrue();
        });

        it('is false when the error is absent or the shape is wrong', () => {
            expect(hasRuntimeLastError({ runtime: {} })).toBeFalse();
            expect(hasRuntimeLastError({ runtime: { lastError: undefined } })).toBeFalse();
            expect(hasRuntimeLastError({})).toBeFalse();
            expect(hasRuntimeLastError(undefined)).toBeFalse();
        });
    });

    describe('readStatusSets', () => {
        it("prefers the API's own enum so we track Chromium", () => {
            const chromeGlobal = {
                webstorePrivate: {
                    getExtensionStatus: () => {},
                    ExtensionInstallStatus: { INSTALLABLE: 'installable_v2', ENABLED: 'enabled_v2' },
                },
            };
            const { installable, installed } = readStatusSets(chromeGlobal);
            expect(installable).toEqual(['installable_v2']);
            expect(installed).toEqual(['enabled_v2']);
        });

        it('falls back to the bundled lists when the enum is missing', () => {
            const { installable, installed } = readStatusSets(undefined);
            expect(installable).toEqual(['installable', 'can_request']);
            expect(installed).toEqual(['enabled', 'disabled', 'force_installed', 'terminated']);
        });

        it('ignores non-string enum members', () => {
            const chromeGlobal = {
                webstorePrivate: { getExtensionStatus: () => {}, ExtensionInstallStatus: { INSTALLABLE: 7, CAN_REQUEST: null } },
            };
            expect(readStatusSets(chromeGlobal).installable).toEqual(['installable', 'can_request']);
        });
    });
});
