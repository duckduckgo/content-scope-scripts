/**
 * Moves submitted prompts to the end, in the order they were submitted; the rest keep their original order.
 *
 * @template {{ id: string }} T
 * @param {T[]} prompts
 * @param {string[]} submittedIds - Oldest first.
 * @returns {T[]}
 */
export function orderPrompts(prompts, submittedIds) {
    const unsubmitted = prompts.filter((prompt) => !submittedIds.includes(prompt.id));
    const submitted = submittedIds.flatMap((id) => prompts.filter((prompt) => prompt.id === id));
    return [...unsubmitted, ...submitted];
}

/**
 * Records a submission: the ID moves to the end of the list, so it is ordered last.
 *
 * @param {string[]} submittedIds
 * @param {string} id
 * @returns {string[]}
 */
export function appendSubmittedId(submittedIds, id) {
    return [...submittedIds.filter((existing) => existing !== id), id];
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @returns {T[][]}
 */
export function chunk(items, size) {
    /** @type {T[][]} */
    const pages = [];
    for (let i = 0; i < items.length; i += size) {
        pages.push(items.slice(i, i + size));
    }
    return pages;
}
