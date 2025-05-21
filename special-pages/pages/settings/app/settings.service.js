/**
 * @import {SettingsData} from "../types/settings.js"
 */

/**
 * @typedef {{ id: string, kind: "ScreenTitleStatusProps", props: import('./elements/ScreenTitleStatus.js').ScreenTitleStatusProps }
 *   | { id: string, kind: "SectionTitleProps", props: import('./elements/SectionTitle.js').SectionTitleProps }
 *   | { id: string, kind: "DescriptionLinkProps", props: import('./elements/DescriptionLink.js').DescriptionLinkProps }
 *   | { id: string, kind: "CheckboxDefinition", props: import('./elements/Checkbox.js').CheckboxDefinition }
 *   | { id: string, kind: "InlineWarningProps", props: import('./elements/InlineWarning.js').InlineWarningProps }} ElementDefinition
 */

/**
 * @typedef {"privacyPro" | "protections" | "main" | "about" | "dev"} ScreenCategory
 * @typedef {{elements: ElementDefinition[], id: string}} ScreenDefinition
 * @typedef {{id: string, screenIds: string[]}} ScreenGroup
 * @typedef {{screens: Record<string, ScreenDefinition>, groups: ScreenGroup[]}} SettingsStructure
 */

import { privateSearch } from './screens/privateSearch/definitions.js';
import { defaultBrowser } from './screens/defaultBrowser/definitiion.js';

/**
 * @typedef {'initial' | 'user' | 'auto'} SettingsQuerySource
 * @typedef {{term: string | null, source: SettingsQuerySource}} SettingsQuery
 */

export class SettingsService {
    /**
     * @param {import("../src/index.js").SettingsPage} settings
     * @param {SettingsData} initial
     */
    constructor(settings, initial) {
        this.settings = settings;
        this.data = initial;
    }

    /**
     * @param {string} url
     * @param {import('../types/settings.js').OpenTarget} target
     */
    openUrl(url, target) {
        this.settings.messaging.notify('open', { url, target });
    }
}

/**
 * @param {URLSearchParams} params
 * @param {SettingsQuerySource} source
 * @return {SettingsQuery}
 */
export function paramsToQuery(params, source = 'initial') {
    const search = params.get('search');

    return {
        term: search,
        source,
    };
}

/**
 * @return {SettingsStructure}
 */
export function defaults() {
    return {
        screens: {
            ...privateSearch(),
            ...defaultBrowser(),
        },
        groups: [
            {
                id: 'protections',
                screenIds: ['privateSearch', 'defaultBrowser'],
            },
        ],
    };
}

/**
 * @return {Record<string, any>}
 */
export function defaultState() {
    return {
        'privateSearch.autocomplete_on': true,
    };
}
