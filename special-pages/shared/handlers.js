/**
 * @param {MouseEvent} event
 * @param {ImportMeta['platform']} platformName
 * @return {'new-tab' | 'new-window' | 'same-tab'}
 */
export function eventToTarget(event, platformName) {
    const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
    if (isControlClick) {
        return 'new-tab';
    } else if (event.shiftKey || event.button === 1 /* middle click */) {
        return 'new-window';
    }
    return 'same-tab';
}

/**
 * @param {MouseEvent} event
 * @param {ImportMeta['platform']} platformName
 * @return {'ctrl+click' | 'shift+click' | 'click'}
 */
export function eventToIntention(event, platformName) {
    const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
    if (isControlClick) {
        return 'ctrl+click';
    } else if (event.shiftKey) {
        return 'shift+click';
    }
    return 'click';
}
