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
    useContextMenuForTitles,
    useGlobalHandlers,
    useLinkClickHandler,
} from '../global-state/HistoryServiceProvider.js';
import { useQueryEvents } from '../global-state/QueryProvider.js';

export function App() {
    const { isDarkMode } = useEnv();
    const { ranges, results } = useData();
    const selected = useSelected();

    /**
     * The following handlers are application-global in nature, so I want them
     * to be registered here for visibility
     */
    useGlobalHandlers();
    useResetSelectionsOnQueryChange();
    useQueryEvents();
    useLinkClickHandler();
    useButtonClickHandler();
    useContextMenuForTitles();
    useContextMenuForEntries();
    useAuxClickHandler();

    /**
     * onClick can be passed directly to the main container,
     * onKeyDown will be observed at the document level.
     * todo: can this be resolved if the `main` element is given focus/tab-index?
     */
    const { onClick, onKeyDown } = useRowInteractions();

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

    return (
        <div class={styles.layout} data-theme={isDarkMode ? 'dark' : 'light'}>
            <aside class={styles.aside}>
                <Sidebar ranges={ranges} />
            </aside>
            <header class={styles.header}>
                <Header />
            </header>
            <main class={cn(styles.main, styles.customScroller)} data-main-scroller onClick={onClick}>
                <Results results={results} selected={selected} />
            </main>
        </div>
    );
}
