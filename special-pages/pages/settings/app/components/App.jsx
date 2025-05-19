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
import { useSearchCommit } from '../global/hooks/useSearchCommit.js';
import { usePlatformName } from '../types.js';
import { useLayoutMode } from '../global/hooks/useLayoutMode.js';
import { ResultsContainer } from './Results.js';

export function App() {
    const platformName = usePlatformName();
    const mainRef = useRef(/** @type {HTMLElement|null} */ (null));
    const { isDarkMode } = useEnv();
    const query = useQueryContext();
    const mode = useLayoutMode();

    /**
     * Handlers that are global in nature
     */
    useLinkClickHandler();
    useAuxClickHandler();
    useURLReflection();
    useSearchCommit();

    return (
        <div
            class={styles.layout}
            data-theme={isDarkMode ? 'dark' : 'light'}
            data-platform={platformName}
            data-layout-mode={mode}
            onClick={() => console.log('did click?')}
        >
            <aside class={styles.aside}>
                <Sidebar settingScreens={[{ id: 'privateSearch' }, { id: 'defaultBrowser' }]} />
            </aside>
            <header class={styles.header}>
                <Header />
            </header>
            <main class={cn(styles.main, styles.customScroller)} ref={mainRef}>
                <ResultsContainer />
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
