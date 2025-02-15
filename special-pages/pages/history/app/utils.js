export const ROW_SIZE = 28;
export const TITLE_SIZE = 32;
export const END_SIZE = 24;
export const TITLE_KIND = ROW_SIZE + TITLE_SIZE;
export const END_KIND = ROW_SIZE + END_SIZE;
export const BOTH_KIND = ROW_SIZE + TITLE_SIZE + END_SIZE;

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
        const isStart = curr.dateRelativeDay !== prev?.dateRelativeDay;
        const isEnd = curr.dateRelativeDay !== next?.dateRelativeDay;

        if (isStart && isEnd) {
            heights[i] = TITLE_SIZE + ROW_SIZE + END_SIZE;
        } else if (isStart) {
            heights[i] = TITLE_SIZE + ROW_SIZE;
        } else if (isEnd) {
            heights[i] = ROW_SIZE + END_SIZE;
        } else {
            heights[i] = ROW_SIZE;
        }
    }
    return heights;
}
