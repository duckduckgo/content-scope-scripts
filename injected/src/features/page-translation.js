import ContentFeature from '../content-feature.js';
import { findUnits, isInViewport } from './page-translation/units.js';
import { serializeUnit } from './page-translation/serialize.js';

/**
 * @typedef {import('./page-translation/types.js').UnitTarget} UnitTarget
 * @typedef {import('./page-translation/types.js').Serialized} Serialized
 * @typedef {{ target: UnitTarget, serialized: Serialized }} UnitState
 * @typedef {import('../types/page-translation.js').Unit} Unit
 */

/**
 * Extracts the page's text as translation units, writes translations back onto the original nodes, and reverts them.
 * Native drives it: nothing runs until native sends `extract`, `apply` or `revert`.
 */
export class PageTranslation extends ContentFeature {
    /** @type {Map<number, UnitState>} */
    #units = new Map();
    /** Ids are never reused for the page's lifetime. */
    #nextId = 0;
    #sourceLanguage = '';

    init() {
        this.subscribe('extract', ({ sourceLanguage }) => this._extract(sourceLanguage));
        // shortcut: stub replies until apply and revert are built
        this.subscribe('apply', () => {
            this.notify('applyResult', { count: 0 });
        });
        this.subscribe('revert', () => {
            this.notify('revertResult', { count: 0 });
        });
    }

    /** @param {string} sourceLanguage */
    _extract(sourceLanguage) {
        this.#sourceLanguage = sourceLanguage;
        this.#units.clear();
        /** @type {Unit[]} */
        const units = [];
        const root = document.body;
        for (const target of root ? findUnits(root, { sourceLanguage: this.#sourceLanguage }) : []) {
            const serialized = serializeUnit(target);
            const id = this.#nextId++;
            this.#units.set(id, { target, serialized });
            units.push({ id, text: serialized.text, html: serialized.html, vp: isInViewport(target) ? 1 : 0 });
        }
        this.notify('extractResult', { units });
    }
}

export default PageTranslation;
