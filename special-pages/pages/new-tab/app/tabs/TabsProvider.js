import { h, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { CustomizerThemesContext } from '../customizer/CustomizerProvider.js';
import { signal, useComputed, useSignal } from '@preact/signals';
import { TabsService } from './tabs.service';

/**
 * @template T
 * @typedef {import('@preact/signals').ReadonlySignal<T>} ReadonlySignal<T>
 */

/**
 * @typedef {import("preact").ComponentChild} ComponentChild
 * @typedef {import('../../types/new-tab').Tabs} Tabs
 */

const TabsStateContext = createContext(signal(/** @type {Tabs} */ (TabsService.DEFAULT)));

/**
 * @typedef {{ tabId: string, showing: number }} ShownTab
 */
const ShownTabContext = createContext(signal(/** @type {ShownTab} */ ({ tabId: TabsService.DEFAULT.tabId, showing: 0 })));

/**
 * Global state provider for tab information.
 *
 * This exposes a signal to the Tabs object. use the hook below to access the individual fields.
 *
 * @param {object} props
 * @param {ComponentChild} props.children
 * @param {TabsService} props.service
 */
export function TabsProvider({ children, service }) {
    const tabs = useSignal(service.snapshot());
    const shown = useSignal(/** @type {ShownTab} */ ({ tabId: tabs.peek().tabId, showing: 0 }));
    useEffect(() => {
        let wentAway = false;
        return service.onData(({ data }) => {
            tabs.value = data;
            // An empty tab ID means the selected tab isn't showing this page: keep the last one until another is shown.
            if (!data.tabId) {
                wentAway = true;
            } else if (wentAway || data.tabId !== shown.peek().tabId) {
                shown.value = { tabId: data.tabId, showing: shown.peek().showing + 1 };
                wentAway = false;
            }
        });
    }, [service, tabs, shown]);
    return (
        <TabsStateContext.Provider value={tabs}>
            <ShownTabContext.Provider value={shown}>{children}</ShownTabContext.Provider>
        </TabsStateContext.Provider>
    );
}

/**
 * The tab this page was last shown for, and a count that changes each time a tab is shown again.
 * Key per-tab UI on both, so a tab leaving the page doesn't redraw it and a returning tab starts fresh.
 *
 * @returns {ReadonlySignal<ShownTab>}
 */
export function useShownTab() {
    return useContext(ShownTabContext);
}

/**
 * Exposes 2 signals - one for the current tab ID and one for the list of tabIds.
 *
 * In a component, if you want to trigger a re-render based on the current tab, you can
 * access the .value field directly.
 *
 * ```js
 * const { current } = useTabState();
 * return <MyComponent key={current.value} />
 * ```
 *
 * @returns {{current: ReadonlySignal<string>, all: ReadonlySignal<string[]>}}
 */
export function useTabState() {
    const tabs = useContext(TabsStateContext);
    const current = useComputed(() => tabs.value.tabId);
    const all = useComputed(() => tabs.value.tabIds);
    return { current, all };
}

export function TabsDebug() {
    const theme = useContext(CustomizerThemesContext);
    const state = useTabState();
    return (
        <pre style="width: 200px; position: fixed; top: 0; left: 0;" data-theme={theme.main}>
            <code style="color: var(--ntp-text-normal)">{JSON.stringify(state, null, 2)}</code>
        </pre>
    );
}
