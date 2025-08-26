import { useEffect, useState } from 'preact/hooks';
import { useTabState } from './TabsProvider.js';
import { PersistentValue } from './PersistentValue.js';
import { invariant } from '../utils.js';

const SCROLLER = '[data-main-scroller]';

/**
 * Allow recording and restoring of the scroll position
 */
export function PersistentScrollProvider() {
    const [value] = useState(() => /** @type {PersistentValue<number>} */ (new PersistentValue()));
    const { all, current } = useTabState();
    useEffect(() => {
        let last = current.peek();
        const elem = document.querySelector(SCROLLER);
        invariant(elem, 'must have access to scroller here');

        /**
         * Subscribe to changes in available tab IDs to prune stored scroll positions
         * for tabs that no longer exist
         */
        const unsub1 = all.subscribe((tabIds) => {
            value?.prune({ preserve: tabIds });
        });
        /**
         * Subscribe to changes in the current tab to restore the saved scroll position
         * when switching between tabs. If no scroll position is saved, defaults to 0.
         */
        const unsub2 = current.subscribe((tabId) => {
            last = tabId;
            const restore = value.byId(last);
            const nextY = restore ?? 0;

            elem.scrollTop = nextY;
        });

        const controller = new AbortController();
        elem.addEventListener(
            'scroll',
            (e) => {
                if (!(e.target instanceof HTMLElement)) throw new Error('unreachable');
                value.update({ id: last, value: e.target.scrollTop });
            },
            { signal: controller.signal },
        );

        return () => {
            unsub1();
            unsub2();
            controller.abort();
        };
    }, [all, current, value]);
    return null;
}
