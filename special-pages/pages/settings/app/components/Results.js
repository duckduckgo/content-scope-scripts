import { h } from 'preact';
import { useResultsData } from '../global/Providers/SettingsServiceProvider.js';
import { useStrings } from '../types.js';
import { useComputed } from '@preact/signals';
import { ElementsContainer } from './Screen.js';

/**
 * @import { Signal } from '@preact/signals';
 */

/**
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.term
 */
export function ResultsContainer(props) {
    const results = useResultsData();
    const strings = useStrings();

    return <Results results={results} term={props.term} strings={strings} />;
}

/**
 * @param {import('../settings.service.js').ElementDefinition[]} toRender
 */
function removeDuplicates(toRender) {
    // return undefined;
    /** @type {Set<string>} */
    let seen = new Set([]);
    /** @type {import('../settings.service.js').ElementDefinition[]} */
    const output = [];
    for (const element of toRender) {
        const count = seen.size;
        seen.add(element.id);
        if (seen.size !== count) output.push(element);
    }
    return output;
}

/**
 * @param {object} props
 * @param {Signal<import("../global/Providers/SettingsServiceProvider.js").Results["data"]>} props.results
 * @param {Signal<string>} props.term
 * @param {Record<string, {title: string}>} props.strings
 */
export function Results({ results, term, strings }) {
    const matchedTranslations = useComputed(() => {
        const tree = {};
        const termLowered = term.value.toLowerCase();
        const matches = [];
        for (const [key, { title }] of Object.entries(strings)) {
            const titleLowered = title?.toLowerCase();
            if (titleLowered?.includes(termLowered)) {
                const [screen, section] = key.split('.');
                // console.log({ screen, section });
                tree[screen] ??= {};
                tree[screen][section] ??= [];
                tree[screen][section].push({ key, title });
                matches.push({ key, title });
            }
        }
        return { tree, matches };
    });

    const visible = useComputed(() => {
        const toRender = [];
        const matches = matchedTranslations.value.matches;

        for (const { screenIds } of results.value.groups) {
            for (const screenId of screenIds) {
                const forScreen = [];
                const { title, elements, sections } = results.value.screens[screenId];
                if (sections) {
                    const sectionMatches = findSections(sections, matches);
                    forScreen.push(...sectionMatches);
                } else {
                    const elementMatches = elements.some((element) => elementUsedTranslation(element, matches));
                    if (elementMatches) {
                        forScreen.push(...elements);
                    }
                }

                if (forScreen.length) {
                    toRender.push(title);
                    toRender.push(...forScreen);
                }
            }
        }

        return removeDuplicates(toRender);
    });
    return <ElementsContainer elements={visible.value} excludedElements={[]} />;
}

/**
 * @param {import('../settings.service.js').ElementDefinition[][]} sections
 * @param {{key: string, title: string}[]} mapping
 */
function findSections(sections, mapping) {
    const output = [];
    for (const subsection of sections) {
        for (const subsectionElement of subsection) {
            if (elementUsedTranslation(subsectionElement, mapping)) {
                output.push(...subsection);
                break;
            }
        }
    }
    return output;
}

/**
 * @param {import('../settings.service.js').ElementDefinition} element
 * @param {{key: string, title: string}[]} mapping
 * @return {boolean}
 */
function elementUsedTranslation(element, mapping) {
    if ('props' in element) {
        const strings = Object.values(element.props).filter((x) => typeof x === 'string');
        const exact = mapping.find((x) => strings.includes(x.key));
        if (exact) return true;
    }
    if (element.kind === 'SwitchDefinition') {
        const on = element.on.some((el) => elementUsedTranslation(el, mapping));
        const off = element.off.some((el) => elementUsedTranslation(el, mapping));
        if (on || off) return true;
    }
    if (element.kind === 'CheckboxDefinition') {
        const some = element.children?.some((el) => elementUsedTranslation(el, mapping));
        if (some) return true;
    }
    if ('strings' in element) {
        const exact = mapping.find((x) => element.strings.includes(x.key));
        if (exact) return true;
    }
    return false;
}
