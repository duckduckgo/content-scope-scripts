import {
    getWebstorePrivate,
    hasRuntimeLastError,
    parseCatalogExtensionIds,
    parseExtensionId,
    readStatusSets,
} from '../src/features/chrome-webstore-patching/helpers.js';

const CATALOG_ID = 'nngceckbapebfimnlniiiahkandclblb';
const OTHER_ID = 'aeblfdkhhhdcdjpifhhbdiojplfjncoa';

// Only the pure helpers are unit tested: the feature module imports SVG assets,
// which plain Node can't load. Copy resolution and the chrome.webstorePrivate
// calls are covered by the integration specs instead.
describe('chromeWebstorePatching helpers', () => {
    describe('parseExtensionId', () => {
        const cases = [
            ['/detail/bitwarden-password-manage/' + CATALOG_ID, CATALOG_ID],
            ['/detail/' + CATALOG_ID, CATALOG_ID],
            ['/detail/slug/' + CATALOG_ID + '/', CATALOG_ID],
            ['/detail/slug/' + CATALOG_ID + '?hl=en', CATALOG_ID],
            ['/detail/slug/' + CATALOG_ID + '#reviews', CATALOG_ID],
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

    // null means "catalog unknown" and keeps the button hidden; [] is a real
    // answer (nothing is installable). Conflating the two would either hide the
    // unsupported pill when management is off, or show it when native is broken.
    describe('parseCatalogExtensionIds', () => {
        it('returns the ids from a valid reply', () => {
            expect(parseCatalogExtensionIds({ extensionIds: [CATALOG_ID, OTHER_ID] })).toEqual([CATALOG_ID, OTHER_ID]);
        });

        it('accepts an empty list as a valid answer', () => {
            expect(parseCatalogExtensionIds({ extensionIds: [] })).toEqual([]);
        });

        it('ignores unknown extra fields', () => {
            expect(parseCatalogExtensionIds({ extensionIds: [CATALOG_ID], extra: true })).toEqual([CATALOG_ID]);
        });

        for (const [label, value] of [
            ['extensionIds is missing', {}],
            ['extensionIds is not an array', { extensionIds: CATALOG_ID }],
            ['extensionIds is null', { extensionIds: null }],
            ['an entry is not a string', { extensionIds: [CATALOG_ID, 42] }],
            ['an entry is null', { extensionIds: [null] }],
            ['the reply is null', null],
            ['the reply is undefined', undefined],
            ['the reply is a bare array', [CATALOG_ID]],
            ['the reply is a string', CATALOG_ID],
        ]) {
            it(`returns null when ${label}`, () => {
                expect(parseCatalogExtensionIds(value)).toBeNull();
            });
        }
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
