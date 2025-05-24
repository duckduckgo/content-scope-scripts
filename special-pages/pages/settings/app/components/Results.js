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
        for (const [key, { title }] of Object.entries(strings)) {
            const titleLowered = title?.toLowerCase();
            if (titleLowered?.includes(termLowered)) {
                const [screen, section] = key.split('.');
                // console.log({ screen, section });
                tree[screen] ??= {};
                tree[screen][section] ??= [];
                tree[screen][section].push({ key, title });
            }
        }
        return { tree };
    });

    const visible = useComputed(() => {
        const toRender = [];
        for (const [screenName, mapping] of Object.entries(matchedTranslations.value.tree)) {
            const elements = results.value.screens[screenName]?.elements || [];
            if (elements.length === 0) continue;
            const elementsForThisScreen = [];

            for (const [sectionName, items] of Object.entries(mapping)) {
                const firstLookup = screenName + '.' + sectionName;

                // simple matches where the translation and element ids are aligned
                const matchingScreenAndSection = elements.filter((element) => {
                    return element.id.startsWith(firstLookup);
                });

                // otherwise, look at props?
                const matchingProps = elements
                    .filter((element) => 'props' in element)
                    .map((element) => {
                        const strings = Object.values(element.props).filter((x) => typeof x === 'string');
                        return { element, propStrings: strings };
                    })
                    .filter(({ propStrings }) => {
                        return items.find((item) => propStrings.includes(item.key));
                    })
                    .map((x) => {
                        return x.element;
                    });

                const named = elements
                    .filter((element) => {
                        return 'strings' in element;
                    })
                    .filter((element) => {
                        return items.find((item) => element.strings.includes(item.key));
                    });

                elementsForThisScreen.push(...matchingScreenAndSection, ...named, ...matchingProps);
            }
            if (elementsForThisScreen.length > 0) {
                toRender.push(elements[0]); // add title for this screen might be duplicate
            }
            toRender.push(...elementsForThisScreen);
        }
        return removeDuplicates(toRender);
    });

    return <ElementsContainer elements={visible.value} excludedElements={[]} />;

    // return toComponents()

    // return (
    //     <div class={styles.container} contenteditable={true}>
    //         <pre>
    //             <code>{JSON.stringify({ term: term.value }, null, 2)}</code>
    //         </pre>
    //         <pre>
    //             <code>{JSON.stringify({ visible: visible.value }, null, 2)}</code>
    //         </pre>
    //         <pre>
    //             <code>{JSON.stringify(matches.value, null, 2)}</code>
    //         </pre>
    //         <pre>
    //             <code>{JSON.stringify({ strings }, null, 2)}</code>
    //         </pre>
    //         <pre>
    //             <code>{JSON.stringify(results.value, null, 2)}</code>
    //         </pre>
    //     </div>
    // );

    // return (
    //     <ul class={styles.container}>
    //         <li>todo: list of results here</li>
    //     </ul>
    // );
}
