import { createContext, h } from 'preact';
import { useCallback } from 'preact/hooks';
import { signal, useComputed, useSignal, useSignalEffect } from '@preact/signals';
import { useThemes } from './themes.js';
import { applyDefaultStyles } from './utils.js';
import { useDrawerEventListeners } from '../components/Drawer.js';
import { useMessaging } from '../types.js';

/**
 * @typedef {import('../../types/new-tab.js').CustomizerData} CustomizerData
 * @typedef {import('../../types/new-tab.js').BackgroundData} BackgroundData
 * @typedef {import('../../types/new-tab.js').ThemeData} ThemeData
 * @typedef {import('../../types/new-tab.js').UserImageData} UserImageData
 * @typedef {import('../../types/new-tab.js').UserImageContextMenu} UserImageContextMenu
 * @typedef {import('../service.hooks.js').State<CustomizerData, undefined>} State
 * @typedef {import('../service.hooks.js').Events<CustomizerData, undefined>} Events
 * @typedef {import('../../types/new-tab.js').ThemeVariant} ThemeVariant
 */

/**
 * @typedef {{
 *   title: string,
 *   icon: import('preact').ComponentChild,
 *   onClick: () => void,
 * }} SettingsLinkData
 */

/**
 * These are the values exposed to consumers.
 */
export const CustomizerThemesContext = createContext({
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    main: signal('light'),
    /** @type {import("@preact/signals").Signal<'light' | 'dark'>} */
    browser: signal('light'),
    /** @type {import("@preact/signals").Signal<ThemeVariant>} */
    variant: signal('default'),
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
    select: (_) => {},
    upload: () => {},
    /**
     * @type {(theme: ThemeData) => void}
     */
    setTheme: (_) => {},
    /**
     * @type {(id: string) => void}
     */
    deleteImage: (_) => {},
    /**
     * @param {UserImageContextMenu} _params
     */
    customizerContextMenu: (_params) => {},
    /** @type {() => void} */
    dismissThemeVariantPopover: () => {},
    /** @type {import("@preact/signals").Signal<boolean>} */
    showThemeNewBadge: signal(false),
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
    const ntp = useMessaging();
    const { main, browser, variant } = useThemes(data);

    useSignalEffect(() => {
        const unsubs = [
            service.onBackground((evt) => {
                data.value = { ...data.value, background: evt.data.background };
            }),
            service.onTheme((evt) => {
                // Only update themeVariant if it's explicitly provided in the message
                // This preserves the existing variant when just the theme changes
                const updates = { theme: evt.data.theme };
                if (evt.data.themeVariant !== undefined) {
                    updates.themeVariant = evt.data.themeVariant;
                }
                data.value = { ...data.value, ...updates };
            }),
            service.onImages((evt) => {
                data.value = { ...data.value, userImages: evt.data.userImages };
            }),
            service.onColor((evt) => {
                data.value = { ...data.value, userColor: evt.data.userColor };
            }),
            service.onShowThemeVariantPopover((evt) => {
                data.value = { ...data.value, showThemeVariantPopover: evt.data.showThemeVariantPopover };
            }),
        ];

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    });

    useSignalEffect(() => {
        const unsub = service.onTheme((evt) => {
            if (evt.source === 'subscription') {
                applyDefaultStyles(evt.data.defaultStyles);
            }
        });

        return () => {
            unsub();
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

    /** @type {(p: UserImageContextMenu) => void} */
    const customizerContextMenu = useCallback((params) => service.contextMenu(params), [service]);

    const dismissThemeVariantPopover = useCallback(() => {
        service.dismissThemeVariantPopover();
    }, [service]);

    // Show the "NEW" badge on Theme section only during the first drawer open
    const drawerOpenCount = useSignal(0);
    const showThemeNewBadge = useComputed(() => !!initialData.showThemeVariantPopover && drawerOpenCount.value === 1);

    useDrawerEventListeners(
        {
            onOpen: () => {
                drawerOpenCount.value++;
                ntp.telemetryEvent({
                    attributes: {
                        name: 'customizer_drawer',
                        value: {
                            state: 'opened',
                            themeVariantPopoverWasOpen: data.value.showThemeVariantPopover ?? false,
                        },
                    },
                });
                service.dismissThemeVariantPopover();
            },
            onClose: () => {
                ntp.telemetryEvent({
                    attributes: {
                        name: 'customizer_drawer',
                        value: { state: 'closed' },
                    },
                });
            },
            onToggle: (state) => {
                drawerOpenCount.value++;
                if (state === 'visible') {
                    ntp.telemetryEvent({
                        attributes: {
                            name: 'customizer_drawer',
                            value: {
                                state: 'opened',
                                themeVariantPopoverWasOpen: data.value.showThemeVariantPopover ?? false,
                            },
                        },
                    });
                } else {
                    ntp.telemetryEvent({
                        attributes: {
                            name: 'customizer_drawer',
                            value: { state: 'closed' },
                        },
                    });
                }
                service.dismissThemeVariantPopover();
            },
        },
        [service, ntp],
    );

    return (
        <CustomizerContext.Provider
            value={{
                data,
                select,
                upload,
                setTheme,
                deleteImage,
                customizerContextMenu,
                dismissThemeVariantPopover,
                showThemeNewBadge,
            }}
        >
            <CustomizerThemesContext.Provider value={{ main, browser, variant }}>{children}</CustomizerThemesContext.Provider>
        </CustomizerContext.Provider>
    );
}
