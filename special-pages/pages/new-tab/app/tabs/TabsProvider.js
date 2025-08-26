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
    useEffect(() => {
        return service.onData(({ data }) => {
            tabs.value = data;
        });
    }, [service, tabs]);
    return <TabsStateContext.Provider value={tabs}>{children}</TabsStateContext.Provider>;
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
