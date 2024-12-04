import { createContext, h } from 'preact';
import { useCallback } from 'preact/hooks';
import { effect, signal, useSignal } from '@preact/signals';

/**
 * @typedef {import('../../types/new-tab.js').CustomizerData} CustomizerData
 * @typedef {import('../service.hooks.js').State<CustomizerData, undefined>} State
 * @typedef {import('../service.hooks.js').Events<CustomizerData, undefined>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const CustomizerContext = createContext({
    /** @type {import("@preact/signals").Signal<CustomizerData>} */
    data: signal({
        background: { kind: 'default' },
        userImages: [],
        theme: 'system',
    }),
    /** @type {(bg: CustomizerData['background']) => void} */
    select: (bg) => {},
    upload: () => {},
    /**
     * @type {(theme: import('../../types/new-tab').CustomizerData['theme']) => void}
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

    effect(() => {
        const unsub = service.onBackground((evt) => {
            data.value = { ...data.value, background: evt.data };
        });
        const unsub1 = service.onTheme((evt) => {
            data.value = { ...data.value, theme: evt.data };
        });
        const unsub2 = service.onImages((evt) => {
            data.value = { ...data.value, userImages: evt.data };
        });

        return () => {
            unsub();
            unsub1();
            unsub2();
        };
    });

    /** @type {(bg: CustomizerData['background']) => void} */
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

    return <CustomizerContext.Provider value={{ data, select, upload, setTheme, deleteImage }}>{children}</CustomizerContext.Provider>;
}
