/**
 * @import {SettingsData} from "../types/settings.js"
 */

/**
 * @typedef {{ id: string, valueId?: string, kind: "ScreenTitleStatusDefinition", props: import('./elements/ScreenTitleStatus.js').ScreenTitleStatusDefinition }
 *   | { id: string, kind: "SectionTitleProps", props: import('./elements/SectionTitle.js').SectionTitleProps }
 *   | { id: string, kind: "TextRowDefinition", props: import('./elements/TextRow.js').TextRowDefinition }
 *   | { id: string, kind: "DescriptionLinkDefinition", props: import('./elements/DescriptionLink.js').DescriptionLinkDefinition }
 *   | { id: string, kind: "CheckboxDefinition", props: import('./elements/Checkbox.js').CheckboxDefinition, children?: ElementDefinition[] }
 *   | {
 *       id: string,
 *       kind: "SwitchDefinition",
 *       valueId: string
 *       on: ElementDefinition[],
 *       off: ElementDefinition[],
 *     }
 *   | { id: string, kind: "InlineWarningDefinition", props: import('./elements/InlineWarning.js').InlineWarningDefinition }} ElementDefinition
 */

/**
 * @typedef {"privacyPro" | "protections" | "main" | "about" | "dev"} ScreenCategory
 * @typedef {{elements: ElementDefinition[], id: string}} ScreenDefinition
 * @typedef {{id: string, screenIds: string[]}} ScreenGroup
 * @typedef {{screens: Record<string, ScreenDefinition>, groups: ScreenGroup[]}} SettingsStructure
 */

import { privateSearch } from './screens/privateSearch/definitions.js';
import { defaultBrowser } from './screens/defaultBrowser/definitiion.js';
import { webTrackingProtection } from './screens/webTrackingProtection/definitions.js';
import { cookiePopupProtection } from './screens/cookiePopupProtection/definitions.js';

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

    /**
     * @param {string} id
     */
    onButtonPress(id) {
        this.settings.messaging.notify('buttonPress', { id });
    }

    /**
     * @param {string} id
     * @param {any} value
     */
    onValueChange(id, value) {
        this.settings.messaging.notify('valueChange', { id, value });
    }

    /**
     *
     */
    onValueChanged(cb) {
        return this.settings.messaging.subscribe('onValueChanged', cb);
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
            ...defaultBrowser(),
            ...privateSearch(),
            ...webTrackingProtection(),
            ...cookiePopupProtection(),
        },
        groups: [
            {
                id: 'protections',
                screenIds: ['defaultBrowser', 'privateSearch', 'webTrackingProtection', 'cookiePopupProtection'],
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
        'cookiePopupProtection.cpm_on': true,
        'webTrackingProtection.titleStatus': true,
        'privateSearch.titleStatus': true,
        'defaultBrowser.isDefault': false,
        'defaultBrowser.dock.enabled': false,
    };
}
