/**
 * @returns {number}
 */
export function getCurrentTimestamp() {
    const video = document.querySelector('video');
    return video?.currentTime || 0;
}
