import { h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { Results } from './Results.js';
import { useEffect, useRef } from 'preact/hooks';
import { Sidebar } from './Sidebar.js';
import { useRangesData, useResultsData } from '../global/Providers/DataProvider.js';
import { useRowInteractions, useSelected } from '../global/Providers/SelectionProvider.js';
import { useQueryContext, useSearchCommit, useSearchCommitForRange, useURLReflection } from '../global/Providers/QueryProvider.js';
import { useRangeChange } from '../global/hooks/useRangeChange.js';
import { useContextMenuForEntries } from '../global/hooks/useContextMenuForEntries.js';
import { useAuxClickHandler } from '../global/hooks/useAuxClickHandler.js';
import { useButtonClickHandler } from '../global/hooks/useButtonClickHandler.js';
import { useLinkClickHandler } from '../global/hooks/useLinkClickHandler.js';
import { useResetSelectionsOnQueryChange } from '../global/hooks/useResetSelectionsOnQueryChange.js';

export function App() {
    const mainRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { isDarkMode } = useEnv();
    const results = useResultsData();
    const ranges = useRangesData();
    const selected = useSelected();
    const query = useQueryContext();

    /**
     * Handlers that are global in nature
     */
    useRangeChange();
    useResetSelectionsOnQueryChange();
    useLinkClickHandler();
    useButtonClickHandler();
    useContextMenuForEntries();
    useAuxClickHandler();
    useURLReflection();
    useSearchCommit();
    useSearchCommitForRange();

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
