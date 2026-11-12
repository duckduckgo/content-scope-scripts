import ContentFeature from '../content-feature.js';
import { findUnits, isExcluded, isInOtherLanguage, isInViewport, isOtherLanguage } from './page-translation/units.js';
import { serializeUnit } from './page-translation/serialize.js';
import { parseTree } from './page-translation/parse.js';
import { mergeUnit, writeText } from './page-translation/merge.js';

/**
 * @typedef {import('./page-translation/types.js').UnitTarget} UnitTarget
 * @typedef {import('./page-translation/types.js').Serialized} Serialized
 * @typedef {{ target: UnitTarget, serialized: Serialized }} UnitState
 * @typedef {import('../types/page-translation.js').Unit} Unit
 */

/**
 * Extracts the page's text as translation units and writes translations back onto the original nodes. Native drives it:
 * nothing runs until native sends `extract` or `apply`. To show the original, native reloads the page.
 */
export class PageTranslation extends ContentFeature {
    /** @type {Map<number, UnitState>} */
    #units = new Map();
    /** Ids are never reused for the page's lifetime. */
    #nextId = 0;
    #sourceLanguage = '';

    init() {
        this.subscribe('extract', () => this._extract());
        this.subscribe('apply', ({ sourceLanguage, targetLanguage, updates }) =>
            this._apply(String(sourceLanguage ?? ''), String(targetLanguage ?? ''), updates),
        );
    }

    _extract() {
        // The page as it is now: native reloads first when it needs the original.
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
     * @param {string} targetLanguage - set as the page's `lang` once anything is written
     * @param {{ id: number, text?: string, tree?: string }[]} updates - `text` for plain units, `tree` (TranslateKit's JSON) for HTML units
     */
    _apply(sourceLanguage, targetLanguage, updates) {
        this.#sourceLanguage = sourceLanguage;
        let count = 0;
        for (const update of Array.isArray(updates) ? updates : []) {
            const { id, text, tree } = update ?? {};
            const unit = typeof id === 'number' ? this.#units.get(id) : undefined;
            const value = unit?.serialized.html ? tree : text;
            if (!unit || typeof value !== 'string' || !isConnected(unit.target)) continue;
            if (isInOtherLanguage(containerOf(unit.target), sourceLanguage)) continue;
            try {
                if (!this._write(unit, value)) continue;
            } catch (e) {
                // Never let one unit stop the reply.
                this.log.error('apply failed for a unit', e);
                continue;
            }
            count++;
        }
        if (count > 0) document.documentElement.setAttribute('lang', targetLanguage);
        this.notify('applyResult', { count });
    }

    /**
     * @param {UnitState} unit
     * @param {string} value - the plain text, or for an HTML unit TranslateKit's JSON tree
     * @returns {boolean} whether anything was written
     */
    _write({ target, serialized }, value) {
        if (!serialized.html) {
            writeText(target, value);
            return true;
        }
        const parsed = parseTree(value, serialized.wrapped);
        if (!parsed) return false;
        mergeUnit(target, serialized.elements, parsed, (el) => isExcluded(el) || isOtherLanguage(el, this.#sourceLanguage));
        return true;
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
