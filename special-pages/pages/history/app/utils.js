export const ROW_SIZE = 28;
export const TITLE_SIZE = 32;
export const END_GAP = 24;
export const TITLE_KIND = ROW_SIZE + TITLE_SIZE;
export const END_KIND = ROW_SIZE + END_GAP;

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
