import ContentFeature from '../content-feature.js';
import { findUnits, isExcluded, isInOtherLanguage, isInViewport, isOtherLanguage } from './page-translation/units.js';
import { serializeUnit } from './page-translation/serialize.js';
import { parseTranslation } from './page-translation/parse.js';
import { createJournal, mergeUnit, revertJournal, writeText } from './page-translation/merge.js';

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
    #targetLanguage = '';
    #journal = createJournal();
    /** @type {Set<number>} ids of units written since extract */
    #applied = new Set();
    /** @type {{ value: string | null } | null} the page's `lang` before our first write */
    #originalLang = null;

    init() {
        this.subscribe('extract', () => this._extract());
        this.subscribe('apply', ({ sourceLanguage, targetLanguage, updates }) =>
            this._apply(String(sourceLanguage ?? ''), String(targetLanguage ?? ''), updates),
        );
        this.subscribe('revert', () => {
            this.notify('revertResult', { count: this._revert() });
        });
    }

    _extract() {
        // Units are found on the original page, never on a translated one.
        this._revert();
        this.#units.clear();
        /** @type {Unit[]} */
        const units = [];
        const root = document.body;
        try {
            for (const target of root ? findUnits(root) : []) {
                const serialized = serializeUnit(target);
                const id = this.#nextId++;
                this.#units.set(id, { target, serialized });
                units.push({ id, text: serialized.text, html: serialized.html, vp: isInViewport(target) ? 1 : 0 });
            }
        } catch (e) {
            // A page that breaks the walk still gets a reply, with the units found so far.
            this.log.error('extract failed', e);
        } finally {
            this.notify('extractResult', { units });
        }
    }

    /**
     * @param {string} sourceLanguage - the page's detected language: content marked as another language isn't written
     * @param {string} targetLanguage - set as the page's `lang` on the first write
     * @param {{ id: number, text: string }[]} updates
     */
    _apply(sourceLanguage, targetLanguage, updates) {
        this.#sourceLanguage = sourceLanguage;
        this.#targetLanguage = targetLanguage;
        let count = 0;
        for (const update of Array.isArray(updates) ? updates : []) {
            const { id, text } = update ?? {};
            const unit = typeof id === 'number' ? this.#units.get(id) : undefined;
            if (!unit || typeof text !== 'string' || !isConnected(unit.target)) continue;
            if (isInOtherLanguage(containerOf(unit.target), sourceLanguage)) continue;
            try {
                if (!this._write(unit, text)) continue;
            } catch (e) {
                // Never let one unit stop the reply; whatever it changed is in the journal for revert.
                this.log.error('apply failed for a unit', e);
                continue;
            }
            this.#applied.add(id);
            this._setPageLanguage();
            count++;
        }
        this.notify('applyResult', { count });
    }

    /**
     * @param {UnitState} unit
     * @param {string} text
     * @returns {boolean} whether anything was written
     */
    _write({ target, serialized }, text) {
        if (!serialized.html) {
            writeText(target, text, this.#journal);
            return true;
        }
        const parsed = parseTranslation(text, serialized.wrapped);
        if (!parsed) return false;
        mergeUnit(target, serialized.elements, parsed, this.#journal, (el) => isExcluded(el) || isOtherLanguage(el, this.#sourceLanguage));
        return true;
    }

    /**
     * Puts back everything written since extract.
     * @returns {number} how many units were restored
     */
    _revert() {
        const count = this.#applied.size;
        revertJournal(this.#journal);
        if (this.#originalLang) {
            const { value } = this.#originalLang;
            if (value === null) {
                document.documentElement.removeAttribute('lang');
            } else {
                document.documentElement.setAttribute('lang', value);
            }
        }
        this.#originalLang = null;
        this.#applied.clear();
        this.#units.clear();
        return count;
    }

    _setPageLanguage() {
        if (this.#originalLang) return;
        const html = document.documentElement;
        this.#originalLang = { value: html.getAttribute('lang') };
        html.setAttribute('lang', this.#targetLanguage);
    }
}

/**
 * The element a unit lives in.
 * @param {UnitTarget} target
 * @returns {Element}
 */
function containerOf(target) {
    return target.kind === 'run' ? target.parent : target.element;
}

/**
 * Whether the unit is still where we found it.
 * @param {UnitTarget} target
 */
function isConnected(target) {
    if (target.kind !== 'run') return target.element.isConnected;
    return target.parent.isConnected && target.nodes.every((node) => node.parentNode === target.parent);
}

export default PageTranslation;
