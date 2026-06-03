import { h, createContext } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarContext, useOmnibarService } from './OmnibarProvider.js';
import { useTabState } from '../../tabs/TabsProvider.js';
import { PersistentValue } from '../../tabs/PersistentValue.js';

/**
 * @typedef {import("../../../types/new-tab.js").OmnibarConfig["mode"]} Mode
 * @typedef {import("../../../types/new-tab.js").TabMetadata} TabMetadata
 * @typedef {import("./chat-tools/file-attachment/useFileAttachments.js").AttachedFile} AttachedFile
 * @typedef {import("./chat-tools/image-attachment/useImageAttachments.js").AttachedImage} AttachedImage
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
 * @template T
 * @typedef {object} PersistentList
 * @property {(props: { children: import('preact').ComponentChildren }) => import('preact').VNode} Provider
 * @property {(tabId: string|null|undefined) => readonly [T[], (next: T[] | ((prev: T[]) => T[])) => void]} useStateWithLocalPersistence
 */

/**
 * @template T
 * @returns {PersistentList<T>}
 */
function createPersistentList() {
    const Context = createContext(/** @type {PersistentValue<T[]>|null} */ (null));

    /** @param {{ children: import('preact').ComponentChildren }} props */
    function Provider({ children }) {
        const [store] = useState(() => /** @type {PersistentValue<T[]>} */ (new PersistentValue()));
        const { all } = useTabState();
        useEffect(() => {
            return all.subscribe((tabIds) => store.prune({ preserve: tabIds }));
        }, [all, store]);

        return <Context.Provider value={store}>{children}</Context.Provider>;
    }

    /** @param {string|null|undefined} tabId */
    function useStateWithLocalPersistence(tabId) {
        const store = useContext(Context);
        const [items, setItems] = useState(() => store?.byId(tabId) ?? []);
        const setter = useCallback(
            /** @param {T[] | ((prev: T[]) => T[])} next */
            (next) => {
                setItems((prev) => {
                    const value = typeof next === 'function' ? /** @type {(prev: T[]) => T[]} */ (next)(prev) : next;
                    if (tabId) store?.update({ id: tabId, value });
                    return value;
                });
            },
            [store, tabId],
        );
        return /** @type {const} */ ([items, setter]);
    }

    return { Provider, useStateWithLocalPersistence };
}

// Three independent attachment lists, each with its own Provider + `useStateWithLocalPersistence` hook.
export const TabAttachments = /** @type {() => PersistentList<TabMetadata>} */ (createPersistentList)();
export const FileAttachments = /** @type {() => PersistentList<AttachedFile>} */ (createPersistentList)();
export const ImageAttachments = /** @type {() => PersistentList<AttachedImage>} */ (createPersistentList)();

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

            // when manually updated, record and apply to the current tab
            if (v.source === 'manual') {
                values?.update({ id: tabId, value: v.data.mode });
                setState(v.data.mode);
            }

            // subscription events should NOT override the current tab's mode —
            // the user may be actively interacting with this tab in another window.
            // The global config.mode (in OmnibarProvider) still updates so new tabs
            // pick up the latest default.

            // when `enableAi` is false, we reset ALL tabs to 'search'
            if (v.data.enableAi === false) {
                values?.updateAll({ value: 'search' });
                setState('search');
            }
        });
    }, [service, tabId, values, defaultMode]);

    return mode;
}

/**
 * @param {unknown} condition
 * @param {string} [message]
 * @return {asserts condition}
 */
export function invariant(condition, message) {
    if (condition) return;
    if (message) throw new Error('Invariant failed: ' + message);
    throw new Error('Invariant failed');
}
