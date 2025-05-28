import { Fragment, h } from 'preact';
import { useGlobalSettingsState, useResultsData } from '../global/Providers/SettingsServiceProvider.js';
import { SeenContextProvider, useSeen, useStrings } from '../types.js';
import { useComputed, useSignal } from '@preact/signals';
import { HighlightingContainer } from './Screen.js';
import { useEffect } from 'preact/hooks';
import { Elements } from '../elements/Elements.js';

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

    const renderedStrings = useSignal(/** @type {string[]} */ ([]));

    const matchedTranslations = useComputed(() => {
        const tree = {};
        const termLowered = props.term.value.trim().toLowerCase();
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

    return (
        <Fragment>
            <SeenContextProvider key={props.term.value}>
                <PreResults
                    results={results}
                    term={props.term}
                    strings={strings}
                    renderedStrings={renderedStrings}
                    matchedTranslations={matchedTranslations}
                />
            </SeenContextProvider>
            <Results
                results={results}
                term={props.term}
                strings={strings}
                renderedStrings={renderedStrings}
                matchedTranslations={matchedTranslations}
            />
        </Fragment>
    );
}

/**
 * @param {import('../settings.service.js').ElementDefinition[]} toRender
 */
function removeDuplicates(toRender) {
    // return undefined;
    /** @type {Set<string>} */
    const seen = new Set([]);
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
 * @param {Signal<string[]>} props.renderedStrings
 * @param {Signal<{matches: {key:string;title:string}[]}>} props.matchedTranslations
 * @param {Record<string, {title: string}>} props.strings
 */
export function PreResults({ results, renderedStrings, matchedTranslations }) {
    const seen = useSeen();

    useEffect(() => {
        return seen.subscribe((seen) => {
            renderedStrings.value = [...seen];
        });
    }, [seen]);

    const visibleElements = useComputed(() => {
        const matches = matchedTranslations.value.matches;
        const elementsToRender = extracted(results, matches);
        return removeDuplicates(elementsToRender);
    });

    const debug = location.href.includes('debug');

    return (
        <div hidden={!debug} style={'border: 2px dotted red; padding: 2rem'}>
            <Elements elements={visibleElements.value} excluded={[]} debug={debug} />
        </div>
    );
}

/**
 * @param results
 */
function extracted(results, intersection) {
    const elementsToRender = [];
    for (const { screenIds } of results.value.groups) {
        for (const screenId of screenIds) {
            const forScreen = [];
            const { title, elements, sections } = results.value.screens[screenId];
            if (sections && sections.length > 0) {
                const sectionMatches = findSections(sections, intersection);
                forScreen.push(...sectionMatches);
            } else {
                const elementMatches = elements.some((element) => elementUsedTranslation(element, intersection));
                if (elementMatches) {
                    forScreen.push(...elements);
                }
            }

            if (forScreen.length) {
                elementsToRender.push(title);
                elementsToRender.push(...forScreen);
            } else {
                if (elementUsedTranslation(title, intersection)) {
                    elementsToRender.push(title);
                    if (sections && sections.length) {
                        elementsToRender.push(...sections[0]);
                    } else {
                        elementsToRender.push(...elements);
                    }
                }
            }
        }
    }
    return elementsToRender;
}

/**
 * @param {object} props
 * @param {Signal<import("../global/Providers/SettingsServiceProvider.js").Results["data"]>} props.results
 * @param {Signal<string>} props.term
 * @param {Signal<string[]>} props.renderedStrings
 * @param {Signal<{matches: {key:string;title:string}[]}>} props.matchedTranslations
 * @param {Record<string, {title: string}>} props.strings
 */
export function Results({ results, renderedStrings, term, matchedTranslations }) {
    const state = useGlobalSettingsState();
    const hash = useComputed(() => JSON.stringify(state.value));
    const observed = useComputed(() => {
        const searchMatches = matchedTranslations.value.matches;
        const s = renderedStrings.value;
        const intersection = searchMatches.filter((x) => s.includes(x.key));
        const elementsToRender = extracted(results, intersection);
        return removeDuplicates(elementsToRender);
    });

    return (
        <div>
            <HighlightingContainer elements={observed.value} excludedElements={[]} term={term.value} stateHash={hash.value} />
        </div>
    );
}

function collect() {}

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
