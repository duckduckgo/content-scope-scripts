import { primaryLanguage } from './classify.js';

/**
 * Which of native's actions fit a selection, in what order, and with which options.
 *
 * @typedef {import('../../types/selection-tools.js').SelectionAction} SelectionAction
 * @typedef {import('../../types/selection-tools.js').ParameterOption} ParameterOption
 * @typedef {import('../../types/selection-tools.js').ContextMenuAction} ContextMenuAction
 * @typedef {import('./classify.js').SelectionContext} SelectionContext
 */

/** The built-in action that attaches the selection to Duck.ai without a prompt */
export const ASK_ACTION_ID = 'ask';

/**
 * A length limit native sent, or undefined for none: anything but an integer is ignored.
 * @param {unknown} value
 * @returns {number | undefined}
 */
function lengthLimit(value) {
    return Number.isInteger(value) ? /** @type {number} */ (value) : undefined;
}

/**
 * Unknown conditions never match: an action gated on something the toolbar can't evaluate stays hidden.
 * @param {SelectionAction} action
 * @param {SelectionContext} context
 * @param {boolean} editable
 */
export function fits(action, context, editable) {
    if (action.id === ASK_ACTION_ID) return false;
    if (action.selectionTypes?.length && !action.selectionTypes.includes(context.shape)) return false;
    if (action.editable !== undefined && action.editable !== editable) return false;
    if (action.condition !== undefined && !(action.condition === 'differentLanguage' && context.differentLanguage)) return false;
    const minLength = lengthLimit(action.minLength);
    const maxLength = lengthLimit(action.maxLength);
    if (minLength !== undefined && context.textLength < minLength) return false;
    if (maxLength !== undefined && context.textLength > maxLength) return false;
    return true;
}

/**
 * The actions that fit, in native's order, except that translating leads when the selection is in another language.
 * @param {SelectionAction[]} actions
 * @param {SelectionContext} context
 * @param {boolean} editable
 * @returns {SelectionAction[]}
 */
export function rankActions(actions, context, editable) {
    const fitting = actions.filter((action) => fits(action, context, editable));
    if (!context.differentLanguage) return fitting;
    const isLanguage = (/** @type {SelectionAction} */ action) => action.parameter?.kind === 'language';
    return [...fitting.filter(isLanguage), ...fitting.filter((action) => !isLanguage(action))];
}

/**
 * Text in another language has one obvious target, the user's own (which native lists first), so a language action
 * runs straight away instead of offering a choice.
 * @param {SelectionAction} action
 * @param {SelectionContext} context
 * @returns {string | undefined}
 */
export function directParameter(action, context) {
    if (action.parameter?.kind !== 'language' || !context.differentLanguage) return undefined;
    return action.parameter.options[0]?.value;
}

/**
 * The choices to offer for an action; empty when it runs directly. The selection's own language is no use as a
 * translation target.
 * @param {SelectionAction} action
 * @param {SelectionContext} context
 * @returns {ParameterOption[]}
 */
export function optionsFor(action, context) {
    const parameter = action.parameter;
    if (!parameter || directParameter(action, context) !== undefined) return [];
    if (parameter.kind !== 'language') return parameter.options;
    return parameter.options.filter((option) => primaryLanguage(option.value) !== context.languageTag);
}

/**
 * At most `maxVisible` buttons on the toolbar, Ask among them; the rest go in the "more" menu.
 * @template T
 * @param {T[]} ranked
 * @param {number} maxVisible
 */
export function splitForToolbar(ranked, maxVisible) {
    const slots = Math.max(0, maxVisible - 1);
    return { visible: ranked.slice(0, slots), overflow: ranked.slice(slots) };
}

/**
 * What the native context menu should offer for a selection.
 * @param {SelectionAction[]} ranked
 * @param {SelectionContext} context
 * @returns {ContextMenuAction[]}
 */
export function contextMenuActions(ranked, context) {
    return ranked.map((action) => {
        const parameter = directParameter(action, context);
        if (parameter !== undefined) return { id: action.id, parameter };
        if (action.parameter) return { id: action.id, options: optionsFor(action, context).map((option) => option.value) };
        return { id: action.id };
    });
}
