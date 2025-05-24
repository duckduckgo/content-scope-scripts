import styles from './VirtualizedList.module.css';
import { h } from 'preact';
import { Elements } from '../elements/Elements.js';
import { useEffect, useRef } from 'preact/hooks';
import { useQueryContext } from '../global/Providers/QueryProvider.js';
import { useComputed, useSignalEffect } from '@preact/signals';
import cn from 'classnames';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 * @param {import('../settings.service').ScreenDefinition} props.screenDefinition
 * @param {import('../settings.service').SettingsStructure["excludedElements"]} props.excludedElements
 */
export function ScreenContainer(props) {
    return (
        <div class={styles.container} data-testid="ScreenContainer" data-screen-id={props.screenId}>
            <Elements
                elements={props.screenDefinition.elements}
                excluded={props.excludedElements}
                debug={location.href.includes('debug')}
            />
        </div>
    );
}

/**
 * @param {Object} props
 * @param {import('../settings.service').ScreenDefinition["elements"]} props.elements
 * @param {import('../settings.service').SettingsStructure["excludedElements"]} props.excludedElements
 */
export function ElementsContainer(props) {
    const query = useQueryContext();
    const term = useComputed(() => query.value.term);
    const ref = useRef();
    useEffect(() => {
        const unsub = term.subscribe((term) => {
            if (!ref.current) return;
            if (term === '') return;
            if (term === null) return;
            const lowered = term.trim().toLowerCase();
            const searchHighlight = new Highlight();
            const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            let node;
            while ((node = walker.nextNode())) {
                if (node.textContent?.trim().toLowerCase().includes(lowered)) {
                    textNodes.push(node);
                }
            }

            textNodes.forEach((textNode) => {
                const text = textNode.textContent;
                const regex = new RegExp(lowered, 'gi');
                let match;

                while ((match = regex.exec(text || ''))) {
                    const range = new Range();
                    range.setStart(textNode, match.index);
                    range.setEnd(textNode, match.index + match[0].length);
                    searchHighlight.add(range);
                }
            });

            CSS.highlights.set('search-results', searchHighlight);
        });

        return () => {
            unsub();
            CSS.highlights.delete('search-results');
        };
        // console.log('query.value', [term.value]);
        // // Create a highlight
        // const searchHighlight = new Highlight();
        // //
        // // // Find text nodes containing your search term
        // const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT);
        //
        // const textNodes = [];
        // let node;
        // while ((node = walker.nextNode())) {
        //     if (node.textContent?.includes('searchTerm')) {
        //         textNodes.push(node);
        //     }
        // }
        //
        // // Create ranges for matches
        // textNodes.forEach((textNode) => {
        //     // const text = textNode.textContent;
        //     // const regex = /searchTerm/gi;
        //     // let match;
        //     //
        //     // while ((match = regex.exec(text))) {
        //     //     const range = new Range();
        //     //     range.setStart(textNode, match.index);
        //     //     range.setEnd(textNode, match.index + match[0].length);
        //     //     searchHighlight.add(range);
        //     // }
        // });

        // Register the highlight
        // CSS.highlights.set('search-results', searchHighlight);
    }, []);
    return (
        <div class={styles.container} data-testid="ElementsContainer" ref={ref}>
            {props.elements.length === 0 && <Empty text={term} title={'No matches'} />}
            <Elements elements={props.elements} excluded={props.excludedElements} debug={location.href.includes('debug')} />
        </div>
    );
}

/**
 * Empty state component displayed when no results are available
 * @param {object} props
 * @param {object} props.title
 * @param {Signal<string|null>} props.text
 */
export function Empty({ title, text }) {
    return (
        <div class={cn(styles.emptyState, styles.emptyStateOffset)}>
            <div class={styles.icons}>
                <img src="icons/backdrop.svg" width={128} height={96} alt="" />
                <img src="icons/clock.svg" width={60} height={60} alt="" class={styles.forground} />
            </div>
            <h2 class={styles.emptyTitle}>{title}</h2>
            <p class={styles.emptyText}>{text}</p>
        </div>
    );
}

export function Debug({ children, id }) {
    return (
        <div style={'position:relative'}>
            {children}
            <span
                class={styles.debug}
                onClick={(_) => {
                    navigator.clipboard.writeText(id);
                }}
            >
                {id}
            </span>
        </div>
    );
}
