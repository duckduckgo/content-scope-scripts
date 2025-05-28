/**
 * @import {SettingsData} from "../types/settings.js"
 */

/**
 * @typedef {{ id: string, valueId?: string, kind: "ScreenTitleStatusDefinition", props: import('./elements/ScreenTitleStatus.js').ScreenTitleStatusDefinition }
 *   | { id: string, kind: "ScreenTitleDefinition", props: import('./elements/ScreenTitle.js').ScreenTitleDefinition }
 *   | { id: string, kind: "SectionTitleProps", props: import('./elements/SectionTitle.js').SectionTitleProps }
 *   | { id: string, kind: "TextRowDefinition", props: import('./elements/TextRow.js').TextRowDefinition }
 *   | { id: string, kind: "LinkRowDefinition", props: import('./elements/LinkRow.js').LinkRowDefinition }
 *   | { id: string, kind: "NearestLocation", strings: string[] }
 *   | { id: string, kind: "PrivacyPro", strings: string[] }
 *   | { id: string, kind: "DescriptionLinkDefinition", props: import('./elements/DescriptionLink.js').DescriptionLinkDefinition }
 *   | { id: string, kind: "CheckboxDefinition", props: import('./elements/Checkbox.js').CheckboxDefinition, children?: ElementDefinition[] }
 *   | { id: string, kind: "ButtonRowDefinition", props: import('./elements/ButtonRow.js').ButtonRowDefinition }
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
 * @typedef {{id: string, screenIds: string[]}} ScreenGroup
 * @typedef {{
 *    screens: Record<string, PaneDefinition>,
 *    groups: ScreenGroup[],
 *    excludedElements: string[]
 * }} SettingsStructure
 */

import { privateSearch } from './screens/privateSearch/definitions.js';
import { defaultBrowser } from './screens/defaultBrowser/definition.js';
import { webTrackingProtection } from './screens/webTrackingProtection/definitions.js';
import { cookiePopupProtection } from './screens/cookiePopupProtection/definitions.js';
import { emailProtection } from './screens/emailProtection/definitions.js';
import { vpn } from './screens/vpn/definitions.js';
import { privacyPro } from './screens/privacyPro/defintions.js';
import { Api } from './global/builders.js';
import { general } from './screens/general/definitions.js';
import { sync } from './screens/sync/definitions.js';

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
export function defaultStructure() {
    const api = new Api();
    return {
        excludedElements: [],
        screens: {
            ...defaultBrowser(api),
            ...privateSearch(api),
            ...webTrackingProtection(api),
            ...cookiePopupProtection(api),
            ...emailProtection(api),
            ...vpn(api),
            ...privacyPro(),
            ...general(api),
            ...sync(api),
        },
        groups: [
            {
                id: 'protections',
                screenIds: ['defaultBrowser', 'privateSearch', 'webTrackingProtection', 'cookiePopupProtection', 'emailProtection'],
            },
            {
                id: 'privacyPro',
                screenIds: ['privacyPro', 'vpn'],
            },
            {
                id: 'other',
                screenIds: ['general', 'sync'],
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
        'cookiePopupProtection.base.cpm_on': true,
        'webTrackingProtection.titleStatus': true,
        'privateSearch.titleStatus': true,
        'defaultBrowser.isDefault': false,
        'defaultBrowser.dock.enabled': false,
        'emailProtection.enabled': false,
        /** @type {'nearest' | 'uk' | 'us'} */
        'vpn.location.selector': 'nearest',
        'vpn.enabled': false,
        /** @type {'none' | 'subscribed'} */
        'privacyPro.subscription': 'none',
        'webTrackingProtection.base.gpc': true,
    };
}
