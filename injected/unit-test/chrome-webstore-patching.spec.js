import ChromeWebstorePatching, { parseExtensionId } from '../src/features/chrome-webstore-patching.js';

const CURATED_ID = 'nngceckbapebfimnlniiiahkandclblb';

describe('chromeWebstorePatching', () => {
    /**
     * @param {object} [bundledConfig]
     * @returns {ChromeWebstorePatching}
     */
    function createFeature(bundledConfig = { features: {}, unprotectedTemporary: [] }) {
        return new ChromeWebstorePatching(
            'chromeWebstorePatching',
            {},
            {},
            {
                site: { domain: 'chromewebstore.google.com', url: 'https://chromewebstore.google.com/' },
                bundledConfig,
            },
        );
    }

    /** bundledConfig shape carrying a curatedExtensions catalog */
    function configWithCatalog(overrides = {}) {
        return {
            features: {
                extensionManagement: {
                    state: 'internal',
                    features: {
                        curatedExtensions: {
                            state: 'internal',
                            settings: { catalog: [{ id: CURATED_ID }] },
                            ...overrides,
                        },
                    },
                },
            },
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

    describe('getCuratedExtensionIds', () => {
        it('returns catalog ids on the happy path', () => {
            const feature = createFeature(configWithCatalog());
            expect(feature.getCuratedExtensionIds()).toEqual([CURATED_ID]);
        });

        it('accepts enabled state', () => {
            const feature = createFeature(configWithCatalog({ state: 'enabled' }));
            expect(feature.getCuratedExtensionIds()).toEqual([CURATED_ID]);
        });

        it('returns [] when curatedExtensions is disabled', () => {
            const feature = createFeature(configWithCatalog({ state: 'disabled' }));
            expect(feature.getCuratedExtensionIds()).toEqual([]);
        });

        it('returns [] when state is missing', () => {
            const feature = createFeature(configWithCatalog({ state: undefined }));
            expect(feature.getCuratedExtensionIds()).toEqual([]);
        });

        it('returns [] when catalog is not an array', () => {
            const feature = createFeature(configWithCatalog({ settings: { catalog: 'nope' } }));
            expect(feature.getCuratedExtensionIds()).toEqual([]);
        });

        it('filters entries without a string id', () => {
            const feature = createFeature(
                configWithCatalog({ settings: { catalog: [{ id: CURATED_ID }, { name: 'no id' }, { id: 42 }, null] } }),
            );
            expect(feature.getCuratedExtensionIds()).toEqual([CURATED_ID]);
        });

        it('returns [] when extensionManagement is absent', () => {
            const feature = createFeature({ features: {} });
            expect(feature.getCuratedExtensionIds()).toEqual([]);
        });

        it('returns [] with an empty features object', () => {
            const feature = createFeature();
            expect(feature.getCuratedExtensionIds()).toEqual([]);
        });
    });

    describe('getExtensionStatus', () => {
        /** @type {any} */
        let originalChrome;

        beforeEach(() => {
            originalChrome = /** @type {any} */ (globalThis).chrome;
        });

        afterEach(() => {
            /** @type {any} */ (globalThis).chrome = originalChrome;
        });

        it('resolves the raw status from the API', async () => {
            /** @type {any} */ (globalThis).chrome = {
                webstorePrivate: {
                    getExtensionStatus: (/** @type {string} */ _id, /** @type {(s: string) => void} */ respond) => respond('installable'),
                },
                runtime: {},
            };
            const feature = createFeature();
            expect(await feature.getExtensionStatus(CURATED_ID)).toBe('installable');
        });

        it('resolves null when the API is absent', async () => {
            /** @type {any} */ (globalThis).chrome = undefined;
            const feature = createFeature();
            expect(await feature.getExtensionStatus(CURATED_ID)).toBeNull();
        });

        it('resolves null when the API throws', async () => {
            /** @type {any} */ (globalThis).chrome = {
                webstorePrivate: {
                    getExtensionStatus: () => {
                        throw new Error('boom');
                    },
                },
                runtime: {},
            };
            const feature = createFeature();
            expect(await feature.getExtensionStatus(CURATED_ID)).toBeNull();
        });

        it('resolves null when runtime.lastError is set in the callback', async () => {
            /** @type {any} */ (globalThis).chrome = {
                webstorePrivate: {
                    getExtensionStatus: (/** @type {string} */ _id, /** @type {(s?: string) => void} */ cb) => {
                        /** @type {any} */ (globalThis).chrome.runtime.lastError = { message: 'boom' };
                        cb(undefined);
                        /** @type {any} */ (globalThis).chrome.runtime.lastError = undefined;
                    },
                },
                runtime: {},
            };
            const feature = createFeature();
            expect(await feature.getExtensionStatus(CURATED_ID)).toBeNull();
        });
    });
});
