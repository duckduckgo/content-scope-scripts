import { h } from 'preact';
import cn from 'classnames';
import styles from './App.module.css';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { Header } from './Header.js';
import { useRef } from 'preact/hooks';
import { Sidebar } from './Sidebar.js';
import { useQueryContext } from '../global/Providers/QueryProvider.js';
import { useAuxClickHandler } from '../global/hooks/useAuxClickHandler.js';
import { useLinkClickHandler } from '../global/hooks/useLinkClickHandler.js';
import { useURLReflection } from '../global/hooks/useURLReflection.js';
import { usePlatformName } from '../types.js';
import { useLayoutMode } from '../global/hooks/useLayoutMode.js';
import { ResultsContainer } from './Results.js';
import { useNavContext } from '../global/Providers/NavProvider.js';
import { useComputed, useSignal } from '@preact/signals';
import { ScreenContainer } from './Screen.js';
import { useResultsData } from '../global/Providers/SettingsServiceProvider.js';

export function App() {
    const platformName = usePlatformName();
    const mainRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { isDarkMode } = useEnv();
    const query = useQueryContext();
    const mode = useLayoutMode();
    const nav = useNavContext();
    const results = useResultsData();
    const structure = useComputed(() => results.value);
    const screenId = useComputed(() => nav.value.id);
    const screenDefinition = useComputed(() => {
        return structure.value.screens[screenId.value];
    });
    const isQuerying = useComputed(() => query.value.term !== null && query.value.term.trim() !== '');
    const term = useComputed(() => query.value.term || '');

    /**
     * Handlers that are global in natures
     */
    useLinkClickHandler();
    useAuxClickHandler();
    useURLReflection();

    return (
        <div
            class={styles.layout}
            data-screen-id={screenId}
            data-theme={isDarkMode ? 'dark' : 'light'}
            data-platform={platformName}
            data-layout-mode={mode}
        >
            <aside class={styles.aside}>
                <Sidebar settingsStructure={structure} />
            </aside>
            <header class={styles.header}>
                <Header />
            </header>
            <main class={cn(styles.main, styles.customScroller)} ref={mainRef}>
                {isQuerying.value === true && <ResultsContainer term={term} />}
                {isQuerying.value === false && <ScreenContainer screenId={screenId} screenDefinition={screenDefinition.value} />}
            </main>
        </div>
    );
}

export function AppLevelErrorBoundaryFallback({ children }) {
    return (
        <div class={styles.paddedError}>
            <p>{children}</p>
            <div class={styles.paddedErrorRecovery}>
                You can try to{' '}
                <button
                    onClick={() => {
                        const current = new URL(window.location.href);
                        current.search = '';
                        current.pathname = '';
                        location.href = current.toString();
                    }}
                >
                    Reload this page
                </button>
            </div>
        </div>
    );
}
