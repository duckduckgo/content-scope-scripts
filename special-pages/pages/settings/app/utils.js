export const ROW_SIZE = 28;
export const TITLE_SIZE = 32;
export const END_SIZE = 24;
export const TITLE_KIND = ROW_SIZE + TITLE_SIZE;
export const END_KIND = ROW_SIZE + END_SIZE;
export const BOTH_KIND = ROW_SIZE + TITLE_SIZE + END_SIZE;

/**
 * @typedef {'ctrl+click' | 'shift+click' | 'click' | 'escape' | 'delete' | 'shift+up' | 'shift+down' | 'up' | 'down' | 'unknown'} Intention
 */

/**
 * @param {MouseEvent|KeyboardEvent} event
 * @param {ImportMeta['platform']} platformName
 * @return {Intention}
 */
export function eventToIntention(event, platformName) {
    if (event instanceof MouseEvent) {
        const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
        if (isControlClick) {
            return 'ctrl+click';
        } else if (event.shiftKey) {
            return 'shift+click';
        }
        return 'click';
    } else if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') {
            return 'escape';
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            return 'delete';
        } else if (event.key === 'ArrowUp' && event.shiftKey) {
            return 'shift+up';
        } else if (event.key === 'ArrowDown' && event.shiftKey) {
            return 'shift+down';
        } else if (event.key === 'ArrowUp') {
            return 'up';
        } else if (event.key === 'ArrowDown') {
            return 'down';
        }
    }
    return 'unknown';
}

/**
 * @param {any} condition
 * @param {string} [message]
 * @return {asserts condition}
 */
export function invariant(condition, message) {
    if (condition) return;
    if (message) throw new Error('Invariant failed: ' + message);
    throw new Error('Invariant failed');
}
