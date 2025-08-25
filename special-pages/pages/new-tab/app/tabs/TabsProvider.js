import { h, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { TabsService } from './tabs.service';
import { CustomizerThemesContext } from '../customizer/CustomizerProvider.js';
import { signal, useComputed, useSignal } from '@preact/signals';

const TabsStateContext = createContext(signal(/** @type {import('../../types/new-tab').Tabs} */ (TabsService.DEFAULT)));

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {import('./tabs.service').TabsService} props.service
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
