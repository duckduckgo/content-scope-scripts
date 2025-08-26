import { h, createContext } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarContext, useOmnibarService } from './OmnibarProvider.js';
import { useTabState } from '../../tabs/TabsProvider.js';
import { PersistentValue } from '../../tabs/PersistentValue.js';
import { invariant } from '../../utils.js';

/**
 * @typedef {import("../../../types/new-tab.js").OmnibarConfig["mode"]} Mode
 */

const TextInputContext = createContext(/** @type {PersistentValue<string>|null} */ (null));
const ModeContext = createContext(/** @type {PersistentValue<Mode>|null} */ (null));

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function PersistentTextInputProvider({ children }) {
    const [value] = useState(() => /** @type {PersistentValue<string>} */ (new PersistentValue()));
    const { all } = useTabState();
    useEffect(() => {
        return all.subscribe((tabIds) => {
            value?.prune({ preserve: tabIds });
        });
    }, [all, value]);
    return <TextInputContext.Provider value={value}>{children}</TextInputContext.Provider>;
}

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function PersistentModeProvider({ children }) {
    const [value] = useState(() => /** @type {PersistentValue<Mode>} */ (new PersistentValue()));
    const { all } = useTabState();
    useEffect(() => {
        return all.subscribe((tabIds) => {
            value?.prune({ preserve: tabIds });
        });
    }, [all, value]);
    return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

/**
 * A normal set-state, but with values recorded. Must be used when the Omnibar Service is ready
 * @param {string|null|undefined} tabId
 */
export function useQueryWithLocalPersistence(tabId) {
    const terms = useContext(TextInputContext);

    invariant(
        useContext(OmnibarContext).state.status === 'ready',
        'Cannot use `useQueryWithLocalPersistence` without Omnibar Service being ready.',
    );

    const [query, setQuery] = useState(() => terms?.byId(tabId) || '');

    /** @type {(term: string) => void} */
    const setter = useCallback(
        (term) => {
            if (tabId) {
                terms?.update({ id: tabId, value: term });
            }
            setQuery(term);
        },
        [tabId, terms],
    );

    return /** @type {const} */ ([query, setter]);
}

/**
 * Sets and remembers the 'mode' for many tabs. Mode doesn't update dynamically with config changes
 * and that's why we use the name 'defaultMode'.
 *
 * Each new tab that's opened adopts the most recent 'mode' value that was persisted in the browser.
 *
 * @param {string|null|undefined} tabId
 * @param {Mode} defaultMode - what to apply for a newly created tab
 * @return {Mode}
 */
export function useModeWithLocalPersistence(tabId, defaultMode) {
    const values = useContext(ModeContext);

    const [mode, setState] = useState(() => {
        const prev = values?.byId(tabId);
        if (prev) return prev;
        if (tabId && defaultMode) {
            values?.update({ id: tabId, value: defaultMode });
        }
        return defaultMode;
    });

    invariant(
        useContext(OmnibarContext).state.status === 'ready',
        'Cannot use `useQueryWithPersistence` without Omnibar Service being ready.',
    );

    const service = useOmnibarService();

    useEffect(() => {
        if (!service) return;
        return service.onConfig((v) => {
            if (!tabId) return;

            // when manually updated + enableAi === 'true', allow this tab to be recorded
            if (v.source === 'manual') {
                values?.update({ id: tabId, value: v.data.mode });
            }

            // when `enableAi` is false, we reset ALL tabs to 'search'
            if (v.data.enableAi === false) {
                values?.updateAll({ value: 'search' });
            }

            setState(v.data.mode);
        });
    }, [service, tabId, values, defaultMode]);

    return mode;
}
