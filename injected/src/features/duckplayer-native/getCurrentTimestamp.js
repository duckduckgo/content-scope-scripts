// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Typing will be fixed in the future

export function getCurrentTimestamp() {
    const video = document.querySelector('video');
    return video ? video.currentTime : 0;
}
