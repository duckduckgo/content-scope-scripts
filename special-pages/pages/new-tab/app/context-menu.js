import { useMessaging } from './types.js';
import { useEffect } from 'preact/hooks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ContextMenuItem {
    /** @type {string} */
    title;
    /** @type {string} */
    id;
    /** @type {number} */
    index;
}

const OPEN_EVENT = 'ntp-contextMenu-open';

/**
 * @returns {ContextMenuItem[]}
 */
export function collect() {
    /** @type {ContextMenuItem[]} */
    const next = [];
    const detail = {
        register: (/** @type {ContextMenuItem} */ incoming) => {
            next.push(incoming);
        },
    };
    const event = new CustomEvent(OPEN_EVENT, { detail });
    window.dispatchEvent(event);
    next.sort((a, b) => a.index - b.index);
    return next;
}

/**
 * Forward the contextmenu event
 */
export function useContextMenu() {
    const messaging = useMessaging();
    useEffect(() => {
        function handler(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const items = collect();
            /** @type {Omit<ContextMenuItem, "index">[]} */
            const simplified = items
                .filter((x) => !x.id.startsWith('_'))
                .map((item) => {
                    return {
                        id: item.id,
                        title: item.title,
                    };
                });
            messaging.contextMenu({ visibilityMenuItems: simplified });
        }
        document.body.addEventListener('contextmenu', handler);
        return () => {
            document.body.removeEventListener('contextmenu', handler);
        };
    }, [messaging]);
}

/**
 * Call this to opt-in to the visibility menu
 * @param {ContextMenuItem} row
 */
export function useContextMenuItem({ title, id, index }) {
    useEffect(() => {
        const handler = (/** @type {CustomEvent<any>} */ e) => {
            e.detail.register({ title, id, index });
        };
        window.addEventListener(OPEN_EVENT, handler);
        return () => window.removeEventListener(OPEN_EVENT, handler);
    }, [title, id, index]);
}
