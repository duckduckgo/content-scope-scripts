import { useEffect, useRef, useId } from 'preact/hooks';
import { computed, effect, useSignal } from '@preact/signals';

const CLOSE_DRAWER_EVENT = 'close-drawer';
const TOGGLE_DRAWER_EVENT = 'toggle-drawer';
const OPEN_DRAWER_EVENT = 'open-drawer';
const REQUEST_VISIBILITY_EVENT = 'request-visibility';

/**
 * @typedef {'hidden' | 'visible'} DrawerVisibility
 */

/**
 * Hook that manages the state and behavior of a drawer component.
 *
 * This function utilizes several hooks to manage references and signals
 * for elements involved in a drawer-like UI component. It handles visibility
 * toggling, event listeners, and ensures that child components are only rendered
 * when appropriate, taking into account any animations.
 *
 * @return {{
 *     wrapperRef: import("preact").RefObject<HTMLDivElement>,
 *     buttonRef: import("preact").RefObject<HTMLButtonElement>,
 *     visibility: import("@preact/signals").Signal<DrawerVisibility>,
 *     buttonId: string,
 *     drawerId: string,
 *     hidden: import("@preact/signals").Signal<boolean>,
 *     displayChildren: import("@preact/signals").Signal<boolean>,
 * }}
 */
export function useDrawer() {
    const wrapperRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const buttonRef = useRef(/** @type {HTMLButtonElement|null} */ (null));

    // id's for accessibility
    const buttonId = useId();
    const drawerId = useId();

    // the immediate value
    const visibility = useSignal(/** @type {DrawerVisibility} */ ('hidden'));

    // the value that determines if it's safe to render children
    // this takes animations into account so it can't be a derived state
    // otherwise it would try to render children (which could be expensive) whilst
    // animations are playing.
    const displayChildren = useSignal(false);

    // derive 'hidden' as a string for things like aria attributes
    const hidden = computed(() => displayChildren.value === false);

    // react to events
    useEffect(() => {
        const controller = new AbortController();
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        /**
         * @param {DrawerVisibility} value
         */
        const update = (value) => {
            visibility.value = value;
        };

        // Event handlers
        const close = () => update('hidden');
        const open = () => update('visible');
        const toggle = () => {
            const next = visibility.value === 'hidden' ? 'visible' : 'hidden';
            update(next);
        };

        // the 3 methods that can be triggered from anywhere in the app
        window.addEventListener(CLOSE_DRAWER_EVENT, close, { signal: controller.signal });
        window.addEventListener(TOGGLE_DRAWER_EVENT, toggle, { signal: controller.signal });
        window.addEventListener(OPEN_DRAWER_EVENT, open, { signal: controller.signal });

        // allow anywhere in the application to read the current state
        wrapper.addEventListener(
            REQUEST_VISIBILITY_EVENT,
            (/** @type {CustomEvent} */ e) => {
                e.detail.value = visibility.value;
            },
            { signal: controller.signal },
        );

        // update `displayChildren` when animations complete.
        wrapper?.addEventListener(
            'transitionend',
            (e) => {
                // ignore child animations
                if (e.target !== e.currentTarget) return;
                displayChildren.value = visibility.value === 'visible';
            },
            { signal: controller.signal },
        );

        return () => {
            controller.abort();
        };
    }, []);

    // move focus back to the button when drawer is closed
    effect(() => {
        if (displayChildren.value === false) {
            buttonRef.current?.focus?.();
        }
    });

    return {
        wrapperRef,
        buttonRef,
        visibility,
        displayChildren,
        buttonId,
        drawerId,
        hidden,
    };
}

/**
 *
 */
export function useDrawerControls() {
    return {
        toggle: () => {
            window.dispatchEvent(new CustomEvent(TOGGLE_DRAWER_EVENT));
        },
        close: () => {
            window.dispatchEvent(new CustomEvent(CLOSE_DRAWER_EVENT));
        },
        open: () => {
            window.dispatchEvent(new CustomEvent(OPEN_DRAWER_EVENT));
        },
    };
}
