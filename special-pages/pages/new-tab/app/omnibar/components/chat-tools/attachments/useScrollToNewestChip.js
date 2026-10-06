import { useLayoutEffect, useRef } from 'preact/hooks';

/**
 * Scrolls the chip list to the end when a chip is added. Items are in attach order,
 * so a newly added chip is always last. useLayoutEffect so the scroll happens before
 * paint and the chip doesn't flash un-scrolled.
 *
 * @param {number} count - number of chips currently rendered
 */
export function useScrollToNewestChip(count) {
    const listRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const previousCount = useRef(0);
    useLayoutEffect(() => {
        const grew = count > previousCount.current;
        previousCount.current = count;
        const list = listRef.current;
        if (!grew || !list) return;
        list.lastElementChild?.scrollIntoView?.({ behavior: 'auto', inline: 'nearest', block: 'nearest' });
        list.scrollLeft = list.scrollWidth;
    }, [count]);
    return listRef;
}
