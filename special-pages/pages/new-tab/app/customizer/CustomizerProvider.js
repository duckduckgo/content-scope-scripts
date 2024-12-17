import { createContext, h } from 'preact';
import { signal, useSignal } from '@preact/signals';
import { useThemes } from './themes.js';

/**
 * @typedef {import('../../types/new-tab.js').CustomizerData} CustomizerData
 */

/**
 * These are the values exposed to consumers.
 */
export const CustomizerThemesContext = createContext({
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    main: signal('light'),
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    browser: signal('light'),
});

export const CustomizerContext = createContext({
    /** @type {import("@preact/signals").Signal<CustomizerData>} */
    data: signal({
        background: { kind: 'default' },
        userImages: [],
        userColor: null,
        theme: 'system',
    }),
});

/**
 * A data provider that will use `RMFService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("./customizer.service.js").CustomizerService} props.service
 * @param {CustomizerData} props.initialData
 * @param {import("preact").ComponentChild} props.children
 */
export function CustomizerProvider({ service, initialData, children }) {
    // const [state, dispatch] = useReducer(withLog('RMFProvider', reducer), initial)
    const data = useSignal(initialData);
    const { main, browser } = useThemes(data);

    // todo: add data subscriptions here

    return (
        <CustomizerContext.Provider value={{ data }}>
            <CustomizerThemesContext.Provider value={{ main, browser }}>{children}</CustomizerThemesContext.Provider>
        </CustomizerContext.Provider>
    );
}
