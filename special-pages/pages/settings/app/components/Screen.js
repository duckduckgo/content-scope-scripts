import styles from './VirtualizedList.module.css';
import { h } from 'preact';
import { Elements, Sections } from '../elements/Elements.js';
import { useEffect, useRef } from 'preact/hooks';
import cn from 'classnames';

/**
 * @import { Signal } from '@preact/signals';
 *
 * Access global state and render the results
 * @param {Object} props
 * @param {Signal<string>} props.screenId
 * @param {import('../settings.service').PaneDefinition} props.screenDefinition
 * @param {import('../settings.service').SettingsStructure["excludedElements"]} props.excludedElements
 */
export function ScreenContainer(props) {
    return (
        <div class={styles.container} data-testid="ScreenContainer" data-screen-id={props.screenId}>
            <Elements elements={[props.screenDefinition.title]} excluded={[]} debug={location.href.includes('debug')} />
            <Elements
                elements={props.screenDefinition.elements}
                excluded={props.excludedElements}
                debug={location.href.includes('debug')}
            />
            <Sections
                sections={props.screenDefinition.sections}
                excluded={props.excludedElements}
                debug={location.href.includes('debug')}
            />
        </div>
    );
}

/**
 * @param {Object} props
 * @param {import('../settings.service').PaneDefinition["elements"]} props.elements
 * @param {string} props.term
 * @param {string} props.stateHash
 * @param {import('../settings.service').SettingsStructure["excludedElements"]} props.excludedElements
 */
export function HighlightingContainer({ term, stateHash, elements, excludedElements }) {
    const ref = useRef();

    useEffect(() => {
        if (!ref.current) return console.warn('missing ref.current');
        if (term === '') return console.warn('term empty');
        if (term === null) return console.warn('term is null');
        CSS.highlights.delete('search-results');
        const lowered = term.trim().toLowerCase();
        const searchHighlight = new Highlight();
        const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;

        while ((node = walker.nextNode())) {
            if (node.textContent?.trim().toLowerCase().includes(lowered)) {
                if (node.parentElement?.hasAttribute('data-do-not-highlight')) {
                    continue;
                }
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

        return () => {
            CSS.highlights.delete('search-results');
        };
    }, [elements, term, stateHash]);

    return (
        <div class={styles.container} data-testid="HighlightingContainer" ref={/** @type {any} */ (ref)}>
            {elements.length === 0 && <Empty text={term} title={'No matches'} />}
            <Elements elements={elements} excluded={excludedElements} debug={location.href.includes('debug')} />
        </div>
    );
}

/**
 * Empty state component displayed when no results are available
 * @param {object} props
 * @param {object} props.title
 * @param {Signal<string|null>|string} props.text
 */
export function Empty({ title, text }) {
    return (
        <div class={cn(styles.emptyState, styles.emptyStateOffset)}>
            <div class={styles.icons}>
                <img src="icons/backdrop.svg" width={128} height={96} alt="" />
                <img src="icons/clock.svg" width={60} height={60} alt="" class={styles.forground} />
            </div>
            <h2 class={styles.emptyTitle}>{title}</h2>
            <p class={styles.emptyText} data-do-not-highlight>
                {text}
            </p>
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
