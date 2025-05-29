/**
 * @import { ElementDefinition } from "./element-types.js"
 *
 * @typedef {"privacyPro" | "protections" | "main" | "about" | "dev"} ScreenCategory
 * @typedef {{id: string, screenIds: string[]}} ScreenGroup
 * @typedef {{
 *    screens: Record<string, PaneDefinition>,
 *    groups: ScreenGroup[],
 *    excludedElements: string[]
 * }} SettingsStructure
 */

/**
 * The minimum amount of data needed to
 */
export class PaneDefinition {
    /** @type {ElementDefinition[]} */
    elements;
    /** @type {ElementDefinition[][]} */
    sections = [];
    /** @type {string} */
    id;
    /** @type {ElementDefinition} */
    title;
    /** @type {string|null} */
    icon;
}
