import json from './strings.json';

/**
 * @import {PaneDefinition} from '../../schema/pane-types.js'
 * @import { Api } from "../../schema/element-builders.js"
 */

/**
 * @param {Api} api
 * @returns {Record<string, PaneDefinition>}
 */
export function privacyPro(api) {
    return {
        privacyPro: {
            icon: '/icons/16px/Privacy-Pro-Color-16.svg',
            id: 'privacyPro',
            title: {
                kind: 'ScreenTitleElement',
                id: 'privacyPro.screenTitle',
                props: {
                    title: 'privacyPro.screenTitle',
                },
            },
            elements: [
                {
                    kind: 'PrivacyProElement',
                    id: 'privacyPro.custom',
                    strings: Object.keys(json),
                },
                new api.Related({
                    children: [
                        new api.SectionTitle({ title: api.UserText('privacyPro.help.title') }).build(),
                        new api.Text({ text: api.UserText('privacyPro.help.description') }).build(),
                        new api.Link({ text: api.UserText('privacyPro.links.faq'), id: 'privacyPro.links.faq' }).build(),
                        new api.Link({ text: api.UserText('privacyPro.links.terms'), id: 'privacyPro.links.terms' }).build(),
                    ],
                }).build(),
            ],
            sections: [],
        },
    };
}
