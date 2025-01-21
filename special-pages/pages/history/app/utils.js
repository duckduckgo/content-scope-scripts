import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

export const ROW_SIZE = 28;
export const TITLE_SIZE = 32;
export const END_GAP = 24;
export const TITLE_KIND = ROW_SIZE + TITLE_SIZE;
export const END_KIND = ROW_SIZE + END_GAP;

/**
 * @param {number[]} heights - an array of integers that represents a 1:1 mapping to `rows` - each value is pixels
 * @param {number} space - the height in pixels that we have to fill
 * @param {number} scrollOffset - the y offset in pixels representing scrolling
 * @return {{startIndex: number, endIndex: number}}
 */
export function calcVisibleRows(heights, space, scrollOffset) {
    let startIndex = 0;
    let endIndex = 0;
    let currentHeight = 0;

    // Adjust startIndex for the scrollOffset
    for (let i = 0; i < heights.length; i++) {
        if (currentHeight + heights[i] > scrollOffset) {
            startIndex = i;
            break;
        }
        currentHeight += heights[i];
    }

    // Start calculating endIndex from the adjusted startIndex
    currentHeight = 0;
    for (let i = startIndex; i < heights.length; i++) {
        if (currentHeight + heights[i] > space) {
            endIndex = i;
            break;
        }
        currentHeight += heights[i];
        endIndex = i;
    }

    return { startIndex, endIndex };
}

/**
 * @param {import("../types/history").HistoryItem[]} rows
 * @return {number[]}
 */
export function generateHeights(rows) {
    const heights = new Array(rows.length);
    for (let i = 0; i < rows.length; i++) {
        const curr = rows[i];
        const prev = rows[i - 1];
        const next = rows[i + 1];
        if (curr.dateRelativeDay !== prev?.dateRelativeDay) {
            heights[i] = ROW_SIZE + TITLE_SIZE;
        } else if (curr.dateRelativeDay !== next?.dateRelativeDay) {
            heights[i] = ROW_SIZE + END_GAP;
        } else {
            heights[i] = ROW_SIZE;
        }
    }
    return heights;
}

/**
 * @param {Array} rows - The array of rows to be virtually rendered. Each row represents an item in the list.
 * @param {number[]} heights - index lookup for known element heights
 * @param {Object} safeAreaRef - A React ref object pointing to the DOM element that serves as the virtualized list’s container.
 * @param {number} overscan - how many items to fetch outside the window
 * @return {Object} An object containing the calculated `start` and `end` indices of the visible rows.
 */
export function useVisibleRows(rows, heights, safeAreaRef, overscan = 5) {
    // set the start/end indexes of the elements
    const [{ start, end }, setVisibleRange] = useState({ start: 0, end: 1 });

    // hold a mutable value that we update on resize
    const gridOffsetRef = useRef(0);
    const mainScrollerRef = useRef(/** @type {Element|null} */ (null));
    const scrollingSize = useRef(/** @type {number|null} */ (null));

    /**
     * When called, make the expensive call to `getBoundingClientRect` to determine the offset of
     * the grid wrapper.
     */
    function updateGlobals() {
        if (!safeAreaRef.current) return;
        const rec = safeAreaRef.current.getBoundingClientRect();
        gridOffsetRef.current = rec.y + mainScrollerRef.current?.scrollTop;
        scrollingSize.current = rec.height;
    }

    /**
     * decide which the start/end indexes should be, based on scroll position.
     * NOTE: this is called on scroll, so must not incur expensive checks/measurements - math only!
     */
    function setVisibleRowsForOffset() {
        if (!safeAreaRef.current) return console.warn('cannot access safeAreaRef ref', safeAreaRef);
        if (scrollingSize.current === null) return console.warn('need height');
        const scrollY = mainScrollerRef.current?.scrollTop ?? 0;
        const next = calcVisibleRows(heights || [], scrollingSize.current, scrollY);

        const withOverScans = {
            start: Math.max(next.startIndex - overscan, 0),
            end: next.endIndex + overscan,
        };
        // console.log(withOverScans);
        // // don't set state if the offset didn't change
        setVisibleRange((prev) => {
            if (withOverScans.start !== prev.start || withOverScans.end !== prev.end) {
                window.dispatchEvent(new CustomEvent('range-change', { detail: { start: withOverScans.start, end: withOverScans.end } }));
                return { start: withOverScans.start, end: withOverScans.end };
            }
            return prev;
        });
    }

    useLayoutEffect(() => {
        mainScrollerRef.current = document.querySelector('[data-main-scroller]') || document.documentElement;
        if (!mainScrollerRef.current) console.warn('missing elements');

        // always update globals first
        updateGlobals();

        // and set visible rows once the size is known
        setVisibleRowsForOffset();

        const controller = new AbortController();

        // when the main area is scrolled, update the visible offset for the rows.
        mainScrollerRef.current?.addEventListener('scroll', setVisibleRowsForOffset, { signal: controller.signal });

        return () => {
            controller.abort();
        };
    }, [rows, heights, safeAreaRef]);

    useEffect(() => {
        let lastWindowHeight = window.innerHeight;
        function handler() {
            if (lastWindowHeight === window.innerHeight) return;
            lastWindowHeight = window.innerHeight;
            updateGlobals();
            setVisibleRowsForOffset();
        }
        window.addEventListener('resize', handler);
        return () => {
            return window.removeEventListener('resize', handler);
        };
    }, [heights, rows, safeAreaRef]);

    return { start, end };
}
