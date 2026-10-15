import { JSDOM } from 'jsdom';
import { selectRootElement } from '../src/features/broker-protection/utils/select-root-element.js';
import { PirError } from '../src/features/broker-protection/types.js';

/** @import { ProfileData } from '../src/features/broker-protection/types.js' */

const PARENT_HTML = `
<ul id="people-search-results">
    <li id="record-0">
        <div class="name">James Daly</div>
    </li>
    <li id="record-1">
        <div class="name">James A Daly</div>
        <div class="age">52 Years Old</div>
        <div class="location">Gilbert, AZ</div>
    </li>
    <li id="record-2">
        <div class="name">James W Daly</div>
        <div class="age">52 Years Old</div>
        <div class="location">Gilbert, AZ</div>
    </li>
</ul>
`;

/** @type {ProfileData} */
const matchingUserProfile = {
    firstName: 'James',
    middleName: 'William',
    lastName: 'Daly',
    age: '52',
    addresses: [{ addressLine1: '123 Fake St', city: 'Gilbert', state: 'AZ' }],
};

/** @type {ProfileData} */
const nonMatchingUserProfile = {
    firstName: 'Jane',
    lastName: 'Doe',
    age: '55',
    addresses: [{ addressLine1: '1 Other Rd', city: 'Chicago', state: 'IL' }],
};

const profileMatchParent = {
    profileMatch: {
        selector: '#people-search-results li',
        profile: {
            name: { selector: '.name' },
            age: { selector: '.age', afterText: 'Years Old' },
            addressCityStateList: {
                selector: '.location',
                findElements: true,
            },
        },
    },
};

/**
 * @param {string} html
 * @returns {{ document: Document, restoreGlobals: () => void }}
 */
function withDom(html) {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    return {
        document: dom.window.document,
        restoreGlobals: () => {
            globalThis.document = previousDocument;
            globalThis.window = previousWindow;
        },
    };
}

describe('selectRootElement', () => {
    /** @type {() => void} */
    let restoreGlobals;

    afterEach(() => {
        restoreGlobals?.();
    });

    it('returns the supplied root when no parent is configured', () => {
        const { document, restoreGlobals: restore } = withDom('<div id="root"></div>');
        restoreGlobals = restore;
        const root = document.getElementById('root');
        expect(root).not.toBeNull();
        const rootElement = /** @type {HTMLElement} */ (root);

        expect(selectRootElement({}, matchingUserProfile, rootElement)).toBe(rootElement);
    });

    it('returns the highest-scoring profile element for a profileMatch parent', () => {
        const { document, restoreGlobals: restore } = withDom(PARENT_HTML);
        restoreGlobals = restore;

        const result = selectRootElement({ parent: profileMatchParent }, matchingUserProfile, document);

        expect(PirError.isError(result)).toBeFalse();
        expect(/** @type {HTMLElement} */ (result).id).toBe('record-2');
    });

    it('returns an error when no profile row matches the user data', () => {
        const { document, restoreGlobals: restore } = withDom(PARENT_HTML);
        restoreGlobals = restore;

        const result = selectRootElement({ parent: profileMatchParent }, nonMatchingUserProfile, document);

        expect(PirError.isError(result)).toBeTrue();
        expect(/** @type {PirError} */ (result).error.message).toContain('not supported');
    });

    it('returns an error when parent is present but profileMatch is missing', () => {
        const { document, restoreGlobals: restore } = withDom(PARENT_HTML);
        restoreGlobals = restore;

        const result = selectRootElement(
            { parent: /** @type {import('../src/features/broker-protection/types.js').ActionParent} */ ({}) },
            matchingUserProfile,
            document,
        );

        expect(PirError.isError(result)).toBeTrue();
        expect(/** @type {PirError} */ (result).error.message).toContain('not supported');
    });

    it('defaults to document when root is omitted', () => {
        const { document, restoreGlobals: restore } = withDom('<main id="page"></main>');
        restoreGlobals = restore;

        expect(selectRootElement({}, matchingUserProfile)).toBe(document);
    });
});
