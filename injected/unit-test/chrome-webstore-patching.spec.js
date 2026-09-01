import { parseExtensionId, readCuratedCatalog } from '../src/features/chrome-webstore-patching/helpers.js';

const CURATED_ID = 'nngceckbapebfimnlniiiahkandclblb';

// Only the pure helpers are unit tested: the feature module imports SVG assets,
// which plain Node can't load. Copy resolution and the chrome.webstorePrivate
// calls are covered by the integration specs instead.
describe('chromeWebstorePatching helpers', () => {
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
            expect(readCuratedCatalog(configWithCatalog())).toEqual([CURATED_ID]);
        });

        it('accepts enabled state', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: 'enabled' }))).toEqual([CURATED_ID]);
        });

        it('returns [] when curatedExtensions is disabled', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: 'disabled' }))).toEqual([]);
        });

        it('returns [] when state is missing', () => {
            expect(readCuratedCatalog(configWithCatalog({ state: undefined }))).toEqual([]);
        });

        it('returns [] when settings are missing', () => {
            expect(readCuratedCatalog(configWithCatalog({ settings: undefined }))).toEqual([]);
        });

        it('returns [] when catalog is not an array', () => {
            expect(readCuratedCatalog(configWithCatalog({ settings: { catalog: 'nope' } }))).toEqual([]);
        });

        // Not reachable from a config fixture: the schema requires an id on
        // every entry, so this shape can only be exercised here
        it('filters entries without a string id', () => {
            const config = configWithCatalog({
                settings: { catalog: [{ id: CURATED_ID }, { name: 'no id' }, { id: 42 }, null] },
            });
            expect(readCuratedCatalog(config)).toEqual([CURATED_ID]);
        });

        it('returns [] when the parent extensionManagement feature is disabled', () => {
            expect(readCuratedCatalog(configWithCatalog({}, 'disabled'))).toEqual([]);
        });

        it('returns [] when the parent state is missing', () => {
            // null survives the default parameter (undefined would not)
            expect(readCuratedCatalog(configWithCatalog({}, null))).toEqual([]);
        });

        it('returns [] when extensionManagement is absent', () => {
            expect(readCuratedCatalog({ features: {} })).toEqual([]);
        });

        it('returns [] with an empty features object', () => {
            expect(readCuratedCatalog({ features: {}, unprotectedTemporary: [] })).toEqual([]);
        });

        it('returns [] when there is no config at all', () => {
            expect(readCuratedCatalog(undefined)).toEqual([]);
            expect(readCuratedCatalog(null)).toEqual([]);
        });
    });
});
