import { createContext, h } from 'preact';
import { useCallback } from 'preact/hooks';
import { effect, signal, useSignal } from '@preact/signals';
import { useThemes } from './themes.js';

/**
 * @typedef {import('../../types/new-tab.js').CustomizerData} CustomizerData
 * @typedef {import('../../types/new-tab.js').BackgroundData} BackgroundData
 * @typedef {import('../../types/new-tab.js').ThemeData} ThemeData
 * @typedef {import('../../types/new-tab.js').UserImageData} UserImageData
 * @typedef {import('../service.hooks.js').State<CustomizerData, undefined>} State
 * @typedef {import('../service.hooks.js').Events<CustomizerData, undefined>} Events
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
    /** @type {(bg: BackgroundData) => void} */
    select: (bg) => {},
    upload: () => {},
    /**
     * @type {(theme: ThemeData) => void}
     */
    setTheme: (theme) => {},
    /**
     * @type {(id: string) => void}
     */
    deleteImage: (id) => {},
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

    effect(() => {
        const unsub = service.onBackground((evt) => {
            data.value = { ...data.value, background: evt.data.background };
        });
        const unsub1 = service.onTheme((evt) => {
            data.value = { ...data.value, theme: evt.data.theme };
        });
        const unsub2 = service.onImages((evt) => {
            data.value = { ...data.value, userImages: evt.data.userImages };
        });
        const unsub3 = service.onColor((evt) => {
            data.value = { ...data.value, userColor: evt.data.userColor };
        });

        return () => {
            unsub();
            unsub1();
            unsub2();
            unsub3();
        };
    });

    /** @type {(bg: BackgroundData) => void} */
    const select = useCallback(
        (bg) => {
            service.setBackground(bg);
        },
        [service],
    );

    const upload = useCallback(() => {
        service.upload();
    }, [service]);

    const setTheme = useCallback(
        (theme) => {
            service.setTheme(theme);
        },
        [service],
    );

    const deleteImage = useCallback(
        (id) => {
            service.deleteImage(id);
        },
        [service],
    );

    return (
        <CustomizerContext.Provider value={{ data, select, upload, setTheme, deleteImage }}>
            <CustomizerThemesContext.Provider value={{ main, browser }}>{children}</CustomizerThemesContext.Provider>
        </CustomizerContext.Provider>
    );
}
