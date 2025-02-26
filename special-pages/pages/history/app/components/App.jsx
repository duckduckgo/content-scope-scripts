import { h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { Results } from './Results.js';
import { useEffect, useRef } from 'preact/hooks';
import { Sidebar } from './Sidebar.js';
import { useData } from '../global-state/DataProvider.js';
import { useResetSelectionsOnQueryChange, useRowInteractions, useSelected } from '../global-state/SelectionProvider.js';
import {
    useAuxClickHandler,
    useButtonClickHandler,
    useContextMenuForEntries,
    useLinkClickHandler,
    useRangeChange,
} from '../global-state/HistoryServiceProvider.js';
import { useQueryContext, useQueryEvents } from '../global-state/QueryProvider.js';

export function App() {
    const mainRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { isDarkMode } = useEnv();
    const { ranges, results } = useData();
    const selected = useSelected();
    const query = useQueryContext();

    /**
     * The following handlers are application-global in nature, so I want them
     * to be registered here for visibility
     */
    useRangeChange();
    useResetSelectionsOnQueryChange();
    useQueryEvents();
    useLinkClickHandler();
    useButtonClickHandler();
    useContextMenuForEntries();
    useAuxClickHandler();

    /**
     * onClick can be passed directly to the main container,
     * onKeyDown will be observed at the document level.
     * todo: can this be resolved if the `main` element is given focus/tab-index?
     */
    const { onClick, onKeyDown } = useRowInteractions();

    useEffect(() => {
        // whenever the query changes, scroll the main container back to the top
        const unsubscribe = query.subscribe(() => {
            mainRef.current?.scrollTo(0, 0);
        });

        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            unsubscribe();
        };
    }, [onKeyDown, query]);

    return (
        <div class={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
            <aside class={styles.aside}>
                <Sidebar ranges={ranges} />
            </aside>
            <header class={styles.header}>
                <Header />
            </header>
            <main class={cn(styles.main, styles.customScroller)} ref={mainRef} onClick={onClick}>
                <Results results={results} selected={selected} />
            </main>
        </div>
    );
}
